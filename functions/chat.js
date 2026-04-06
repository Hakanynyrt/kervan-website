// KERVAN ISIL İŞLEM — AI Asistan Backend
// Cloudflare Pages Function: POST /chat
//
// KURULUM:
//   Cloudflare Pages → Settings → Environment Variables → Add variable:
//   ANTHROPIC_API_KEY = sk-ant-... (console.anthropic.com'dan alın)

const SYSTEM_PROMPT = `Sen Kervan Isıl İşlem'in sanal asistanısın. Türkçe konuşuyorsun. Sade, net ve teknik dil kullanıyorsun.

ŞİRKET:
- Kervan Isıl İşlem (Kervan Makina), Kocaeli / Kartepe
- Adres: Sadun Atığ Cad. No: 112/A, Kartepe / Kocaeli
- Telefon: +90 531 669 37 34
- Çalışma saatleri: Pazartesi–Cumartesi 08:00–18:00
- Instagram: @kervanmakina
- Web: kervanheat.com

YAPILAN HİZMETLER:
1. Karbonlama (Sementasyon) — 850–950°C, propan-hava atmosferi, yüzey karbon zenginleştirme
2. Söndürme — yağ ve polimer banyosu, vinç operasyonlu havuzlar
3. Meneviş (Temperleme) — 150–650°C, iç gerilim giderme, tokluk kazandırma
4. Normalizasyon — austenit sıcaklığında havada soğutma, homojen tane yapısı
5. Gerilim Giderme (Stress Relief) — kaynak/işleme sonrası iç gerilim azaltma
6. Sertlik Testi — Rockwell (HRC) ve Vickers (HV) ölçümü, kalite raporu

YAPILMAYAN / REDDEDİLECEK HİZMETLER:
Aşağıdaki konularda "bu hizmet şu an tesisimizde yapılmıyor, ilgili firmaya yönlendirebiliriz" de:
- Galvanizleme, elektroliz kaplama, krom/nikel kaplama
- Toz boya, fırın boya, sıvı boya veya herhangi bir yüzey kaplama
- Nitrürleme (gas nitriding, plasma nitriding)
- İndüksiyon sertleştirme
- CNC talaşlı imalat veya mekanik işleme
- Kaynak işlemleri
- Ham madde / malzeme satışı
- Dökümhane hizmetleri

TAKRİBİ FİYAT REHBERİ (KDV hariç, 2025 yılı tahmini — ⚠️ bu fiyatlar yaklaşık referans değerleridir, resmi teklif için form doldurulmalı veya aranmalıdır):
- Karbonlama: 30–50 TL/kg (minimum yük: ~500 TL)
- Söndürme: 12–22 TL/kg
- Meneviş: 8–16 TL/kg
- Normalizasyon: 10–20 TL/kg
- Gerilim Giderme: 8–15 TL/kg
- Sertlik Testi: 80–150 TL/parça

Fiyatı etkileyen faktörler: malzeme cinsi ve kalitesi, parça boyutu ve geometrisi, adet, işlem süresi, özel gereksinimler.

FİYAT SORULURSA:
Önce şu bilgileri sor (hepsini tek seferde): malzeme cinsi (örn. 16MnCr5, C45), kg cinsinden ağırlık, en büyük parça boyutu (mm), istenen hizmet türü. Sonra yukarıdaki rehbere göre aralık ver ve "resmi teklif için formu doldurun veya arayın" de.

ACİL DURUM ALGILAMA:
Kullanıcı "acil", "bugün", "bugün lazım", "yarın sabah", "hemen", "çok acil", "urgent", "en geç bugün", "son dakika" gibi ifadeler kullanıyorsa yanıtının en başına [ACIL] ekle (bu etiket kullanıcıya gösterilmez, sistem tarafından işlenir).

TEKNİK RESİM / GÖRSEL ANALİZİ:
Kullanıcı teknik resim veya görsel yüklerse dikkatle incele: malzeme notlarını, yüzey işlem gereksinimlerini, boyutları ve toleransları belirt. Uygun ısıl işlem türünü ve parametrelerini öner.

GENEL DAVRANIŞLAR:
- Fazla uzun cevap verme, net ve özlü ol
- Teknik terimleri kullan ama kısaca açıkla
- Çalışma saatleri dışında da yanıt veriyorsun ancak "çalışma saatlerimiz dışındasınız, sabah arayabilirsiniz" diye belirt
- Teklif için her zaman form veya telefonu öner: "Teklif almak için sitemizden formu doldurun veya +90 531 669 37 34'i arayın"
- Bilmediğin teknik konularda "teknik detay için uzmanlarımızı arayın" de`;

export async function onRequestPost(context) {
  var request = context.request;
  var env = context.env;

  // CORS headers
  var headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (!env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API anahtarı tanımlı değil.' }), { status: 500, headers: headers });
  }

  var body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Geçersiz istek.' }), { status: 400, headers: headers });
  }

  var messages = body.messages || [];
  var file = body.file || null; // { data: base64string, mediaType: 'image/jpeg' | 'application/pdf' }

  if (!messages.length) {
    return new Response(JSON.stringify({ error: 'Mesaj boş.' }), { status: 400, headers: headers });
  }

  // Build Claude messages
  var claudeMessages = [];
  for (var i = 0; i < messages.length; i++) {
    claudeMessages.push({ role: messages[i].role, content: messages[i].content });
  }

  // If file attached, append to last user message as multipart content
  if (file && file.data && file.mediaType) {
    var lastMsg = claudeMessages[claudeMessages.length - 1];
    if (lastMsg.role === 'user') {
      var textPart = { type: 'text', text: typeof lastMsg.content === 'string' ? lastMsg.content : '' };
      var filePart;
      if (file.mediaType === 'application/pdf') {
        filePart = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } };
      } else {
        filePart = { type: 'image', source: { type: 'base64', media_type: file.mediaType, data: file.data } };
      }
      lastMsg.content = textPart.text ? [textPart, filePart] : [filePart];
    }
  }

  var apiResponse;
  try {
    apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: claudeMessages
      })
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'API bağlantı hatası.' }), { status: 502, headers: headers });
  }

  if (!apiResponse.ok) {
    return new Response(JSON.stringify({ error: 'AI servisi geçici olarak yanıt vermiyor.' }), { status: 502, headers: headers });
  }

  var apiData = await apiResponse.json();
  var text = (apiData.content && apiData.content[0] && apiData.content[0].text) ? apiData.content[0].text : '';

  var urgent = text.startsWith('[ACIL]');
  if (urgent) text = text.slice(6).trim();

  return new Response(JSON.stringify({ message: text, urgent: urgent }), { headers: headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
