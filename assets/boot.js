/* MCC Security BR — boot.js
   Roda antes da primeira pintura: HTTPS, idioma e flag de JS.
   Fica em arquivo próprio porque a CSP do site não permite script inline. */
(function () {
  'use strict';
  var root = document.documentElement;
  var host = location.hostname;

  // GitHub Pages: garante HTTPS no domínio de produção.
  if (location.protocol === 'http:' && (host === 'mccsecuritybr.com' || /\.mccsecuritybr\.com$/.test(host))) {
    location.replace('https://' + location.host + location.pathname + location.search + location.hash);
    return;
  }

  // Idioma: ?lang= vence, depois a escolha salva, depois o navegador.
  var lang = null;
  try {
    var q = (new URLSearchParams(location.search).get('lang') || '').toLowerCase().slice(0, 2);
    if (q === 'pt' || q === 'en') lang = q;
    if (!lang) {
      var saved = localStorage.getItem('mcc-lang');
      if (saved === 'pt' || saved === 'en') lang = saved;
    }
  } catch (e) { /* storage bloqueado: segue o navegador */ }

  if (!lang) {
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'pt'];
    lang = 'en';
    for (var i = 0; i < prefs.length; i++) {
      if (/^pt\b/i.test(String(prefs[i]))) { lang = 'pt'; break; }
    }
  }

  root.setAttribute('data-lang', lang);
  root.lang = lang === 'pt' ? 'pt-BR' : 'en';

  // Só esconde conteúdo para animar se o script principal realmente subir.
  root.classList.add('js');
  setTimeout(function () {
    if (!window.__mcc) root.classList.remove('js');
  }, 3500);
})();
