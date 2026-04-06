// KERVAN ISIL İŞLEM — AI Asistan Worker
// Cloudflare Workers + Static Assets
// KURULUM: Settings → Variables and Secrets → ANTHROPIC_API_KEY = sk-ant-...

var SYSTEM_PROMPT = 'Kervan Isıl İşlem sanal asistanısın. Türkçe, kısa ve teknik yaz.\n\nŞİRKET: Kocaeli/Kartepe | +90 531 669 37 34 | Pzt-Cmt 08-18 | kervanheat.com\n\nHİZMETLER: Karbonlama(850-950°C) · Söndürme(yağ/polimer) · Meneviş(150-650°C) · Normalizasyon · Gerilim Giderme · Sertlik Testi(HRC/HV)\n\nYAPILMAYAN: Galvaniz · Kaplama · Boya · Nitrürleme · İndüksiyon · CNC · Kaynak → "Tesisimizde yapılmıyor."\n\nFİYAT (TL/kg, KDV hariç, ~2025): Karbonlama 30-50 · Söndürme 12-22 · Meneviş 8-16 · Normalizasyon 10-20 · Gerilim Giderme 8-15 · Sertlik Testi 80-150/parça\nFiyat sorusu: malzeme cinsi + kg + max boyut(mm) + hizmet sor, aralık ver.\n\nACİL: "acil/hemen/bugün/yarın sabah/son dakika" → yanıt başına [ACIL] ekle.\nİNSAN TALEBİ: "operatör/yetkili/siz/biri arasın/görüşmek" → yanıt başına [CAGRI] ekle.\n\nTEKNİK ÖZET: hizmet+malzeme+miktar bilgisi tamamlanınca VEYA kullanıcı isteyince şu formatı üret:\n[OZET]\nisim: \ntelefon: \neposta: \nhizmet: \nmalzeme: \nagirlik: \nboyut: \nadet: \nnot: \n[/OZET]\nÖzetle birlikte kısa onay mesajı yaz.\n\nGÖRSEL: Teknik resim yüklendiyse ölçü, malzeme ve uygun ısıl işlemi belirt.\nBilmiyorsan: uzmanlarımızı arayın. Mesai dışıysa belirt.';

var CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

async function handleChat(request, env, ctx) {
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
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
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

  var cagri = text.startsWith('[CAGRI]');
  if (cagri) text = text.slice(7).trim();

  var urgent = text.startsWith('[ACIL]');
  if (urgent) text = text.slice(6).trim();

  // [OZET] bloğunu parse et
  var ozet = null;
  var ozetMatch = text.match(/\[OZET\]([\s\S]*?)\[\/OZET\]/);
  if (ozetMatch) {
    text = text.replace(/\[OZET\][\s\S]*?\[\/OZET\]/, '').trim();
    ozet = {};
    ozetMatch[1].trim().split('\n').forEach(function(line) {
      var idx = line.indexOf(':');
      if (idx > -1) {
        var k = line.slice(0, idx).trim();
        var v = line.slice(idx + 1).trim();
        if (k) ozet[k] = v;
      }
    });
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
        return new Response(null, { headers: CORS_HEADERS });
      }
      if (request.method === 'POST') {
        return handleChat(request, env, ctx);
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    return env.ASSETS.fetch(request);
  }
};
