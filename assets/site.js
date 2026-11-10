/* MCC Security BR — site.js (v6)
   Sem dependências. Tudo aqui é melhoria progressiva: sem JS a página
   continua completa (em português) e legível. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var finePointer = mq('(hover: hover) and (pointer: fine)');

  window.__mcc = true;

  /* ------------------------------------------------------------------ *
   * Idioma
   * ------------------------------------------------------------------ */
  var TITLES = {
    pt: 'MCC Security BR — Segurança Ofensiva & Auditoria Web3 | Matheus Camara Carvalho',
    en: 'MCC Security BR — Cybersecurity & Web3 Auditing | Matheus Camara Carvalho'
  };

  function getLang() {
    return root.getAttribute('data-lang') === 'en' ? 'en' : 'pt';
  }

  function applyLang(lang) {
    root.setAttribute('data-lang', lang);
    root.lang = lang === 'pt' ? 'pt-BR' : 'en';
    doc.title = TITLES[lang];
    $$('[data-set-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-set-lang') === lang));
    });
    $$('[data-label-' + lang + ']').forEach(function (el) {
      el.setAttribute('aria-label', el.getAttribute('data-label-' + lang));
    });
  }

  $$('[data-set-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-set-lang');
      if (lang === getLang()) return;
      applyLang(lang);
      try { localStorage.setItem('mcc-lang', lang); } catch (e) { /* sem storage */ }
      // Uma escolha manual vale mais que um ?lang= antigo na URL.
      try {
        var url = new URL(location.href);
        if (url.searchParams.has('lang')) {
          url.searchParams.delete('lang');
          history.replaceState(null, '', url.pathname + url.search + url.hash);
        }
      } catch (e) { /* URL API ausente */ }
      runScramble();
    });
  });

  applyLang(getLang());

  /* ------------------------------------------------------------------ *
   * Cabeçalho: estado "grudado", barra de progresso e seção ativa
   * ------------------------------------------------------------------ */
  var header = $('#header');
  var progress = $('#progress');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.pageYOffset || root.scrollTop || 0;
      if (header) header.classList.toggle('is-stuck', y > 36);
      if (progress) {
        var max = root.scrollHeight - window.innerHeight;
        progress.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : '0');
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  var navLinks = $$('[data-nav]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('data-section');
        navLinks.forEach(function (a) {
          if (a.getAttribute('data-nav') === id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-42% 0px -56% 0px' });
    $$('[data-section]').forEach(function (s) { spy.observe(s); });
  }

  /* ------------------------------------------------------------------ *
   * Menu mobile
   * ------------------------------------------------------------------ */
  var menuBtn = $('.menu-btn');
  var menu = $('#menu');

  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    root.classList.toggle('menu-open', open);
  }

  if (menu && menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
    });
    window.addEventListener('resize', function () {
      if (!menu.hidden && window.innerWidth > 1080) setMenu(false);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------ *
   * Texto "decifrando" no título
   * ------------------------------------------------------------------ */
  var GLYPHS = '/\\|<>[]{}!?+-=_:;01';

  function scramble(el) {
    var finalText = el.getAttribute('data-final');
    if (finalText === null) {
      finalText = el.textContent;
      el.setAttribute('data-final', finalText);
    }
    if (reduce) { el.textContent = finalText; return; }
    var len = finalText.length;
    var start = null;
    var dur = 850;
    function frame(now) {
      if (start === null) start = now;
      var k = Math.min(1, (now - start) / dur);
      var shown = Math.floor(k * len);
      var out = '';
      for (var i = 0; i < len; i++) {
        var ch = finalText.charAt(i);
        out += (i < shown || ch === ' ') ? ch : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      el.textContent = k < 1 ? out : finalText;
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function runScramble() {
    var visible = 0;
    $$('[data-scramble]').forEach(function (el) {
      var finalText = el.getAttribute('data-final');
      if (el.offsetParent === null) {            // idioma oculto: só garante o texto final
        if (finalText !== null) el.textContent = finalText;
        return;
      }
      var delay = visible++ * 140;
      setTimeout(function () { scramble(el); }, delay);
    });
  }

  /* ------------------------------------------------------------------ *
   * Cartão de verificação: digita o comando e marca as checagens
   * ------------------------------------------------------------------ */
  function runVerify(card) {
    if (!card || card.getAttribute('data-ran')) return;
    card.setAttribute('data-ran', '1');
    if (reduce) return;

    var cmd = $('[data-type]', card);
    var rows = $$('.check', card);
    var count = $('[data-verify-count]', card);
    if (!cmd || !rows.length) return;

    var text = cmd.textContent;
    var total = rows.length;
    cmd.textContent = '';
    if (count) count.textContent = '0';
    card.classList.add('is-running');

    var typed = 0;
    var done = 0;

    function finish() {
      card.classList.remove('is-running');
      rows.forEach(function (r) { r.classList.remove('is-done'); });
      if (count) count.textContent = String(total);
    }
    function tick() {
      if (done >= total) { setTimeout(finish, 700); return; }
      rows[done].classList.add('is-done');
      done++;
      if (count) count.textContent = String(done);
      setTimeout(tick, 280);
    }
    function type() {
      typed++;
      cmd.textContent = text.slice(0, typed);
      if (typed < text.length) setTimeout(type, 24 + Math.random() * 46);
      else setTimeout(tick, 300);
    }
    setTimeout(type, 350);
  }

  /* ------------------------------------------------------------------ *
   * Contadores
   * ------------------------------------------------------------------ */
  function animateCount(el) {
    var original = el.textContent;
    var m = original.trim().match(/^([^\d]*)([\d][\d.,]*)(.*)$/);
    if (!m) return;
    var prefix = m[1], numStr = m[2], suffix = m[3];
    var decimals = (numStr.split('.')[1] || '').length;
    var grouped = numStr.indexOf(',') > -1;
    var target = parseFloat(numStr.replace(/,/g, ''));
    if (!isFinite(target)) return;

    function fmt(v) {
      var s = v.toFixed(decimals);
      if (grouped) {
        var parts = s.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        s = parts.join('.');
      }
      return prefix + s + suffix;
    }

    var start = null;
    var dur = 1500;
    function step(now) {
      if (start === null) start = now;
      var k = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - k, 4);
      el.textContent = k < 1 ? fmt(target * eased) : original;
      if (k < 1) requestAnimationFrame(step);
    }
    el.textContent = fmt(0);
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------ *
   * Entrada ao rolar
   * ------------------------------------------------------------------ */
  var revealEls = $$('[data-reveal]');
  var counters = $$('[data-count]');
  var verifyCard = $('#verify');

  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) {
      el.classList.add('is-revealed');
      el.removeAttribute('data-reveal');
    });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        revealIO.unobserve(el);
        var delay = batch++ * 90;
        el.style.setProperty('--d', delay + 'ms');
        el.classList.add('is-revealed');
        if (el === verifyCard) setTimeout(function () { runVerify(el); }, delay + 250);
        // Depois da entrada, solta o elemento para os efeitos de hover próprios.
        setTimeout(function () {
          el.removeAttribute('data-reveal');
          el.style.removeProperty('--d');
        }, delay + 1300);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });
    revealEls.forEach(function (el) { revealIO.observe(el); });

    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        animateCount(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  if (doc.fonts && doc.fonts.ready && doc.fonts.ready.then) {
    // Espera a fonte para o efeito não "pular" de largura.
    var started = false;
    var go = function () { if (!started) { started = true; runScramble(); } };
    doc.fonts.ready.then(go);
    setTimeout(go, 1200);
  } else {
    runScramble();
  }

  /* ------------------------------------------------------------------ *
   * Letreiro "Reconhecido por"
   * ------------------------------------------------------------------ */
  $$('[data-marquee]').forEach(function (box) {
    if (reduce) return;
    var track = $('.marquee-track', box);
    if (!track) return;
    var items = $$('li', track);
    for (var copy = 0; copy < 3; copy++) {
      items.forEach(function (li) {
        var clone = li.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    }
    requestAnimationFrame(function () {
      var half = track.scrollWidth / 2;
      box.style.setProperty('--dur', Math.max(24, Math.round(half / 34)) + 's');
      box.classList.add('is-ready');
    });
  });

  /* ------------------------------------------------------------------ *
   * Luz que segue o cursor + inclinação da carta
   * ------------------------------------------------------------------ */
  if (finePointer && !reduce) {
    $$('[data-spot]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left).toFixed(1) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top).toFixed(1) + 'px');
      }, { passive: true });
    });

    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (px * 8).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * 8).toFixed(2) + 'deg');
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Lightbox (dialog nativo: foco preso e ESC de graça)
   * ------------------------------------------------------------------ */
  var lb = $('#lightbox');
  var lbImg = $('#lightbox-img');
  var lbCaption = $('#lightbox-caption');
  var lbOriginal = $('#lightbox-original');
  var lbStage = $('#lightbox-stage');
  var lbClose = $('#lightbox-close');

  function resetZoom() {
    lbStage.classList.remove('is-zoomed');
    lbImg.style.removeProperty('width');
    lbStage.scrollTop = 0;
    lbStage.scrollLeft = 0;
  }

  function openLightbox(trigger) {
    var src = trigger.getAttribute('data-lightbox');
    var original = trigger.getAttribute('data-original') || src;
    var caption = trigger.getAttribute('data-caption') || '';
    resetZoom();
    lbImg.onerror = function () {
      lbImg.onerror = null;
      lbImg.src = original;               // WebP indisponível: usa o PNG
    };
    lbImg.src = src;
    lbImg.alt = caption;
    lbCaption.textContent = caption;
    lbOriginal.href = original;
    if (typeof lb.showModal === 'function') lb.showModal();
    else lb.setAttribute('open', '');
  }

  function closeLightbox() {
    if (typeof lb.close === 'function' && lb.open) lb.close();
    else { lb.removeAttribute('open'); onLightboxClosed(); }
  }

  function onLightboxClosed() {
    lbImg.onerror = null;
    lbImg.removeAttribute('src');
    resetZoom();
  }

  if (lb && lbImg && lbStage) {
    $$('[data-lightbox]').forEach(function (trigger) {
      trigger.addEventListener('click', function () { openLightbox(trigger); });
    });
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    lb.addEventListener('close', onLightboxClosed);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    lbStage.addEventListener('click', function (e) {
      if (e.target !== lbImg) { closeLightbox(); return; }
      if (lbStage.classList.contains('is-zoomed')) { resetZoom(); return; }
      var natural = lbImg.naturalWidth || 0;
      var cs = window.getComputedStyle(lbStage);
      var room = lbStage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var target = Math.min(natural, Math.max(room, 1100));
      if (target <= lbImg.clientWidth + 8) return;        // já está no tamanho máximo
      lbStage.classList.add('is-zoomed');
      lbImg.style.setProperty('width', target + 'px');
    });
  }

  /* ------------------------------------------------------------------ *
   * Copiar + aviso
   * ------------------------------------------------------------------ */
  var toast = $('#toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 1900);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = doc.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.className = 'sr-only';
      doc.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
      doc.body.removeChild(ta);
      if (ok) resolve(); else reject(new Error('copy'));
    });
  }

  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      copyText(text).then(function () {
        showToast(getLang() === 'pt' ? 'Copiado: ' + text : 'Copied: ' + text);
      }, function () {
        showToast(text);
      });
    });
  });

  /* ------------------------------------------------------------------ *
   * Ano do rodapé
   * ------------------------------------------------------------------ */
  $$('[data-year]').forEach(function (el) {
    var y = new Date().getFullYear();
    if (y > 2026) el.textContent = String(y);
  });

  /* ------------------------------------------------------------------ *
   * Campo de bytes do hero (canvas): textura estática + varredura
   * ------------------------------------------------------------------ */
  (function hexField() {
    var canvas = $('#field');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var hero = canvas.parentNode;

    var CELL_W = 36, CELL_H = 24, FONT = '500 11px "JetBrains Mono", ui-monospace, Consolas, monospace';
    var base = doc.createElement('canvas');
    var w = 0, h = 0, dpr = 1, cols = 0, rows = 0, cells = [];
    var pointer = { x: -9999, y: -9999 };
    var raf = null, visible = true, t0 = 0;

    function byte() {
      var v = Math.floor(Math.random() * 256).toString(16).toUpperCase();
      return v.length < 2 ? '0' + v : v;
    }

    function drawBase() {
      var b = base.getContext('2d');
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.clearRect(0, 0, w, h);
      b.font = FONT;
      b.textBaseline = 'middle';
      b.fillStyle = 'rgba(190, 212, 235, 0.07)';
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          b.fillText(cells[r * cols + c], c * CELL_W + 8, r * CELL_H + CELL_H / 2);
        }
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = base.width = Math.round(w * dpr);
      canvas.height = base.height = Math.round(h * dpr);
      cols = Math.ceil(w / CELL_W) + 1;
      rows = Math.ceil(h / CELL_H) + 1;
      cells = new Array(cols * rows);
      for (var i = 0; i < cells.length; i++) cells[i] = byte();
      drawBase();
      paint(performance.now());
    }

    function paint(now) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
      if (reduce) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = FONT;
      ctx.textBaseline = 'middle';

      var span = w + h * 0.6 + 600;
      var wave = (((now - t0) / 9000) % 1) * span - 300;      // faixa diagonal de varredura
      var R = 170, BAND = 80;

      for (var r = 0; r < rows; r++) {
        var y = r * CELL_H + CELL_H / 2;
        for (var c = 0; c < cols; c++) {
          var x = c * CELL_W + 8;
          var k = 0;
          var dw = Math.abs(x + y * 0.6 - wave);
          if (dw < BAND) k = (1 - dw / BAND) * 0.5;
          var dx = x - pointer.x, dy = y - pointer.y;
          if (dx > -R && dx < R && dy > -R && dy < R) {
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < R) k = Math.max(k, 1 - d / R);
          }
          if (k <= 0.02) continue;
          var idx = r * cols + c;
          if (Math.random() < 0.05 * k) cells[idx] = byte();
          ctx.fillStyle = 'rgba(54, 243, 162, ' + (0.1 + 0.8 * k * k).toFixed(3) + ')';
          ctx.fillText(cells[idx], x, y);
        }
      }
    }

    function loop(now) {
      paint(now);
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (reduce || raf !== null || !visible || doc.hidden) return;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }, { passive: true });

    if (finePointer && !reduce) {
      hero.addEventListener('pointermove', function (e) {
        var rect = canvas.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { pointer.x = pointer.y = -9999; });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0 }).observe(hero);
    }
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) stop(); else start();
    });

    t0 = performance.now();
    resize();
    if (doc.fonts && doc.fonts.ready && doc.fonts.ready.then) doc.fonts.ready.then(resize);
    start();
  })();

  /* ------------------------------------------------------------------ *
   * Para quem abre o console
   * ------------------------------------------------------------------ */
  try {
    console.log(
      '%cMCC Security BR%c\nNão confie. Verifique. / Don\'t trust. Verify.\n> matheus@mccsecuritybr.com',
      'font: 800 20px/1.4 system-ui, sans-serif; color: #36f3a2;',
      'font: 500 12px/1.6 ui-monospace, Consolas, monospace; color: #9aa6b3;'
    );
  } catch (e) { /* console indisponível */ }
})();
