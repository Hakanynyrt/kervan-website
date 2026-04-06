// KERVAN ISIL İŞLEM — AI Asistan Worker
// Cloudflare Workers + Static Assets
//
// KURULUM:
//   Cloudflare Dashboard → Workers & Pages → kervan-website
//   → Settings → Variables and Secrets → Add variable:
//   ANTHROPIC_API_KEY = sk-ant-... (console.anthropic.com'dan alın)

var SYSTEM_PROMPT = 'Sen Kervan Isıl İşlem\'in sanal asistanısın. Türkçe konuşuyorsun. Sade, net ve teknik dil kullanıyorsun.\n\nŞİRKET:\n- Kervan Isıl İşlem (Kervan Makina), Kocaeli / Kartepe\n- Adres: Sadun Atığ Cad. No: 112/A, Kartepe / Kocaeli\n- Telefon: +90 531 669 37 34\n- Çalışma saatleri: Pazartesi–Cumartesi 08:00–18:00\n- Instagram: @kervanmakina\n- Web: kervanheat.com\n\nYAPILAN HİZMETLER:\n1. Karbonlama (Sementasyon) — 850–950°C, propan-hava atmosferi, yüzey karbon zenginleştirme\n2. Söndürme — yağ ve polimer banyosu, vinç operasyonlu havuzlar\n3. Meneviş (Temperleme) — 150–650°C, iç gerilim giderme, tokluk kazandırma\n4. Normalizasyon — austenit sıcaklığında havada soğutma, homojen tane yapısı\n5. Gerilim Giderme (Stress Relief) — kaynak/işleme sonrası iç gerilim azaltma\n6. Sertlik Testi — Rockwell (HRC) ve Vickers (HV) ölçümü, kalite raporu\n\nYAPILMAYAN / REDDEDİLECEK HİZMETLER:\nAşağıdaki konularda "bu hizmet şu an tesisimizde yapılmıyor, ilgili firmaya yönlendirebiliriz" de:\n- Galvanizleme, elektroliz kaplama, krom/nikel kaplama\n- Toz boya, fırın boya, sıvı boya veya herhangi bir yüzey kaplama\n- Nitrürleme (gas nitriding, plasma nitriding)\n- İndüksiyon sertleştirme\n- CNC talaşlı imalat veya mekanik işleme\n- Kaynak işlemleri\n- Ham madde / malzeme satışı\n- Dökümhane hizmetleri\n\nTAKRİBİ FİYAT REHBERİ (KDV hariç, 2025 yılı tahmini — ⚠️ bu fiyatlar yaklaşık referans değerleridir, resmi teklif için form doldurulmalı veya aranmalıdır):\n- Karbonlama: 30–50 TL/kg (minimum yük: ~500 TL)\n- Söndürme: 12–22 TL/kg\n- Meneviş: 8–16 TL/kg\n- Normalizasyon: 10–20 TL/kg\n- Gerilim Giderme: 8–15 TL/kg\n- Sertlik Testi: 80–150 TL/parça\n\nFiyatı etkileyen faktörler: malzeme cinsi ve kalitesi, parça boyutu ve geometrisi, adet, işlem süresi, özel gereksinimler.\n\nFİYAT SORULURSA:\nÖnce şu bilgileri sor (hepsini tek seferde): malzeme cinsi (örn. 16MnCr5, C45), kg cinsinden ağırlık, en büyük parça boyutu (mm), istenen hizmet türü. Sonra yukarıdaki rehbere göre aralık ver ve "resmi teklif için formu doldurun veya arayın" de.\n\nACİL DURUM ALGILAMA:\nKullanıcı "acil", "bugün", "bugün lazım", "yarın sabah", "hemen", "çok acil", "urgent", "en geç bugün", "son dakika" gibi ifadeler kullanıyorsa yanıtının en başına [ACIL] ekle.\n\nTEKNİK RESİM / GÖRSEL ANALİZİ:\nKullanıcı teknik resim veya görsel yüklerse dikkatle incele: malzeme notlarını, yüzey işlem gereksinimlerini, boyutları ve toleransları belirt. Uygun ısıl işlem türünü ve parametrelerini öner.\n\nGENEL DAVRANIŞLAR:\n- Fazla uzun cevap verme, net ve özlü ol\n- Teknik terimleri kullan ama kısaca açıkla\n- Çalışma saatleri dışında da yanıt veriyorsun ancak "çalışma saatlerimiz dışındasınız, sabah arayabilirsiniz" diye belirt\n- Teklif için her zaman form veya telefonu öner: "Teklif almak için sitemizden formu doldurun veya +90 531 669 37 34\'i arayın"\n- Bilmediğin teknik konularda "teknik detay için uzmanlarımızı arayın" de';

var CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

async function handleChat(request, env) {
  var jsonHeaders = Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS);

  if (!env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API anahtarı tanımlı değil.' }), { status: 500, headers: jsonHeaders });
  }

  var body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Geçersiz istek.' }), { status: 400, headers: jsonHeaders });
  }

  var messages = body.messages || [];
  var file = body.file || null;

  if (!messages.length) {
    return new Response(JSON.stringify({ error: 'Mesaj boş.' }), { status: 400, headers: jsonHeaders });
  }

  var claudeMessages = [];
  for (var i = 0; i < messages.length; i++) {
    claudeMessages.push({ role: messages[i].role, content: messages[i].content });
  }

  if (file && file.data && file.mediaType) {
    var lastMsg = claudeMessages[claudeMessages.length - 1];
    if (lastMsg.role === 'user') {
      var textContent = typeof lastMsg.content === 'string' ? lastMsg.content : '';
      var filePart;
      if (file.mediaType === 'application/pdf') {
        filePart = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } };
      } else {
        filePart = { type: 'image', source: { type: 'base64', media_type: file.mediaType, data: file.data } };
      }
      lastMsg.content = textContent ? [{ type: 'text', text: textContent }, filePart] : [filePart];
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
    return new Response(JSON.stringify({ error: 'API bağlantı hatası.' }), { status: 502, headers: jsonHeaders });
  }

  if (!apiResponse.ok) {
    return new Response(JSON.stringify({ error: 'AI servisi geçici olarak yanıt vermiyor.' }), { status: 502, headers: jsonHeaders });
  }

  var apiData = await apiResponse.json();
  var text = (apiData.content && apiData.content[0] && apiData.content[0].text) ? apiData.content[0].text : '';

  var urgent = text.startsWith('[ACIL]');
  if (urgent) text = text.slice(6).trim();

  return new Response(JSON.stringify({ message: text, urgent: urgent }), { headers: jsonHeaders });
}

export default {
  async fetch(request, env, ctx) {
    var url = new URL(request.url);

    if (url.pathname === '/chat') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
      }
      if (request.method === 'POST') {
        return handleChat(request, env);
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Tüm diğer istekler → static assets
    return env.ASSETS.fetch(request);
  }
};
