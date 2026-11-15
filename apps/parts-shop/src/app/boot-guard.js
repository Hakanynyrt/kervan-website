/* global window, document, navigator, location, setTimeout */
/* boot-guard.js (vite.app.config.ts fills the two texts): runs before the app's bundle. If the
   app has drawn nothing in #root after a few seconds, it shows the last error it saw, so a blank
   start on the iPhone can be read from a screenshot. Plain DOM, no inline script (the page's CSP
   allows scripts from the app itself only). */
(function () {
  var WAIT_MS = 8000;
  var seen = [];
  function note(msg) {
    if (seen.length < 5) seen.push(String(msg).slice(0, 300));
  }
  window.addEventListener(
    'error',
    function (e) {
      var t = e && e.target;
      if (t && t !== window && (t.src || t.href)) note('load failed: ' + (t.src || t.href));
      else note((e && e.message) || 'error');
    },
    true,
  );
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    note((r && (r.stack || r.message)) || String(r));
  });
  setTimeout(function () {
    var root = document.getElementById('root');
    if (root && root.childNodes.length) return;
    var tr = /^tr\b/i.test(navigator.language || '');
    var box = document.createElement('div');
    box.style.cssText =
      'padding:calc(24px + env(safe-area-inset-top)) 20px 24px;font:15px/1.5 -apple-system,system-ui,sans-serif;color:#1c1f23;background:#fff;min-height:100vh;box-sizing:border-box';
    var h = document.createElement('p');
    h.style.cssText = 'margin:0 0 12px;font-weight:600';
    h.textContent = tr ? '__KV_BOOT_FAIL_TR__' : '__KV_BOOT_FAIL_EN__';
    var pre = document.createElement('pre');
    pre.style.cssText =
      'margin:0;white-space:pre-wrap;word-break:break-word;font:12px/1.4 ui-monospace,Menlo,monospace;color:#555';
    var cap = window.Capacitor;
    pre.textContent = [
      location.href,
      'native: ' + !!(cap && cap.isNativePlatform && cap.isNativePlatform()),
      'module: ' + ('noModule' in document.createElement('script')),
    ]
      .concat(seen.length ? seen : ['(no error seen)'])
      .join('\n');
    box.appendChild(h);
    box.appendChild(pre);
    document.body.appendChild(box);
  }, WAIT_MS);
})();
