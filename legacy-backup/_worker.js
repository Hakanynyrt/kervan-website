// KERVAN HEAT — AI Asistan Worker
// Cloudflare Workers + Static Assets
// KURULUM: Settings → Variables and Secrets → ANTHROPIC_API_KEY = sk-ant-...

var SYSTEM_PROMPT = 'Kervan Heat (Kervan Isıl İşlem) sanal asistanısın. Müşteri hangi dilde yazarsa o dilde yanıtla (Türkçe veya İngilizce). Kısa ve teknik yaz.\n\nŞİRKET: Kocaeli/Kartepe | +90 531 669 37 34 | Pzt-Cmt 08-18 | kervanheat.com | info@kervanheat.com\n\n── İŞ KOLU 1: HİDROLİK KIRICI YEDEK PARÇALARI (ana iş) ──\nÜretici, satıcı değil. Tüm parçalar Kartepe tesisinde dövme, CNC talaşlı imalat ve ısıl işlem ile üretilir.\nPARÇALAR: Keski(Moil/Düz/Kama/Küt/Konik/Geniş) · Piston · Burç · Bağlantı Civatası · Tamir Kiti · Kama · Ön Kafa\nMALZEME: 42CrMo / 42CrMoA | SERTLİK: HRC 48-52 | CNC işleme\nUYUMLU MARKALAR: Furukawa · Montabert · Rammer · Soosan · MSB · Indeco · NPK · Atlas Copco · Krupp · Caterpillar · Toku · Daemo ve 40+ marka\nTESLİMAT: Avrupa 5-10 gün · Dünya geneli · Konteynere hazır paketleme\nFİYAT: Parça tipine, boyuta, adede ve markaya göre değişir. Teklif formu veya WhatsApp ile fiyat alınır.\n\n── İŞ KOLU 2: ISIL İŞLEM HİZMETLERİ ──\nHİZMETLER: Karbonlama(850-950°C) · Söndürme(yağ/polimer) · Meneviş(150-650°C) · Normalizasyon · Gerilim Giderme · Sertlik Testi(HRC/HV)\nKAPASİTE: Kuyu tipi fırın Ø1500mm · 950°C maks · Yağ+Polimer söndürme banyoları\nYAPILMAYAN: Galvaniz · Kaplama · Boya · Nitrürleme · İndüksiyon → "Tesisimizde yapılmıyor."\nFİYAT (TL/kg, KDV hariç, ~2026): Karbonlama 30-50 · Söndürme 12-22 · Meneviş 8-16 · Normalizasyon 10-20 · Gerilim Giderme 8-15 · Sertlik Testi 80-150/parça\nFiyat sorusu: malzeme cinsi + kg + max boyut(mm) + hizmet sor, aralık ver.\n\nACİL: "acil/hemen/bugün/yarın sabah/son dakika" → yanıt başına [ACIL] ekle.\nİNSAN TALEBİ: "operatör/yetkili/siz/biri arasın/görüşmek" → yanıt başına [CAGRI] ekle.\n\nTEKNİK ÖZET: hizmet/parça+malzeme+miktar bilgisi tamamlanınca VEYA kullanıcı isteyince şu formatı üret:\n[OZET]\nisim: \ntelefon: \neposta: \nhizmet: \nmalzeme: \nagirlik: \nboyut: \nadet: \nnot: \n[/OZET]\nÖzetle birlikte kısa onay mesajı yaz.\n\nGÖRSEL: Teknik resim yüklendiyse ölçü, malzeme ve uygun parça/ısıl işlemi belirt.\nBilmiyorsan: uzmanlarımızı arayın. Mesai dışıysa belirt.';

var CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://kervanheat.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

// C3: Türkiye saatini (UTC+3) sistem prompt'una ekle
function buildSystemPrompt() {
  var now = new Date();
  var utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  var trMs = utcMs + 3 * 3600000; // UTC+3
  var tr = new Date(trMs);
  var days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var day = tr.getDay(); // 0=Pazar … 6=Cumartesi
  var h = tr.getHours();
  var m = tr.getMinutes();
  var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  var isWork = day >= 1 && day <= 6 && h >= 8 && h < 18;
  var timeInfo = 'ŞU AN (Türkiye): ' + days[day] + ' ' + pad(h) + ':' + pad(m) + ' — ' + (isWork ? 'mesai saatindeyiz.' : 'mesai saati dışındayız (Pzt-Cmt 08-18). Mesai dışı olduğunu belirt.');
  return SYSTEM_PROMPT + '\n\n' + timeInfo;
}

async function handleChat(request, env, ctx) {
  var jsonHeaders = Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS_HEADERS);

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
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: buildSystemPrompt(),
        messages: claudeMessages
      })
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'API bağlantı hatası.' }), { status: 502, headers: jsonHeaders });
  }

  if (!apiResponse.ok) {
    var errBody = await apiResponse.text();
    return new Response(JSON.stringify({ error: 'AI servisi yanıt vermedi (' + apiResponse.status + '): ' + errBody.slice(0, 200) }), { status: 502, headers: jsonHeaders });
  }

  var apiData = await apiResponse.json();
  var text = (apiData.content && apiData.content[0] && apiData.content[0].text) ? apiData.content[0].text : '';

  // B1: regex ile her iki flag'i sıradan bağımsız yakala
  var cagri = /\[CAGRI\]/.test(text);
  var urgent = /\[ACIL\]/.test(text);
  text = text.replace(/\[(CAGRI|ACIL)\]\s*/g, '').trim();

  // [OZET] bloğunu parse et
  var ozet = null;
  var ozetMatch = text.match(/\[OZET\]([\s\S]*?)\[\/OZET\]/);
  if (ozetMatch) {
    text = text.replace(/\[OZET\][\s\S]*?\[\/OZET\]/, '').trim();
    ozet = {};
    ozetMatch[1].trim().split('\n').forEach(function(line) {
      var idx = line.indexOf(':');
      if (idx > -1) {
        // B2: anahtarı normalize et (küçük harf, sadece [a-z])
        var k = line.slice(0, idx).trim().toLowerCase().replace(/[^a-z]/g, '');
        var v = line.slice(idx + 1).trim();
        if (k && v) ozet[k] = v;
      }
    });
    if (!Object.keys(ozet).length) ozet = null;
  }

  // Müşteri operatör istedi → e-posta bildirimi gönder (yanıtı beklemeden)
  if (cagri) {
    var summary = claudeMessages.slice(-6).map(function(m) {
      var role = m.role === 'user' ? 'Müşteri' : 'Bot';
      var content = typeof m.content === 'string' ? m.content : '[dosya]';
      return role + ': ' + content;
    }).join('\n');
    ctx.waitUntil(fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: '8f55e1c5-b170-4414-9ceb-477cbf6fca58',
        subject: '⚡ Chatbot — Müşteri Operatör İstiyor',
        from_name: 'Kervan Chatbot',
        email: 'chatbot@kervanheat.com',
        message: summary
      })
    }));
  }

  return new Response(JSON.stringify({ message: text, urgent: urgent, ozet: ozet, cagri: cagri }), { headers: jsonHeaders });
}

export default {
  async fetch(request, env, ctx) {
    var url = new URL(request.url);

    if (url.pathname === '/chat') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }
      if (request.method === 'POST') {
        return handleChat(request, env, ctx);
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    return env.ASSETS.fetch(request);
  }
};
