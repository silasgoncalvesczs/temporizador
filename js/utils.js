/* =========================================================
   Utilitários compartilhados: DOM, formatação, cores, ícones,
   manter a tela ligada e bipe.
   Todos os scripts usam o objeto global window.ET.
   ========================================================= */
window.ET = window.ET || {};
(function (ET) {
  'use strict';

  ET.$ = (id) => document.getElementById(id);

  /** Cria um elemento: el('div', 'classe', 'texto') */
  ET.el = function (tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  ET.copy = (o) => JSON.parse(JSON.stringify(o));
  ET.uid = () => 't' + Math.random().toString(36).slice(2, 9);

  /* ---------- Tempo ---------- */
  const pad = (n) => (n < 10 ? '0' : '') + n;
  /** Segundos → "MM:SS", "H:MM:SS" ou "−MM:SS" */
  ET.fmt = function (s) {
    const neg = s < 0, v = neg ? Math.ceil(-s) : Math.ceil(s);
    const h = Math.floor(v / 3600), m = Math.floor((v % 3600) / 60), x = v % 60;
    return (neg ? '−' : '') + (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(x);
  };
  ET.clock = function () {
    const d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  };
  /** Data atual por extenso, ex.: "Segunda-feira, 23 de novembro" */
  ET.today = function () {
    const s = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  /* ---------- Cores ---------- */
  ET.luminance = function (hex) {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  /** Cor de texto legível (escura ou clara) sobre o fundo informado */
  ET.readable = (hex) => (ET.luminance(hex) > 0.35 ? '#111111' : '#ffffff');

  /* ---------- Ícones (SVG em linha) ---------- */
  const P = {
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>',
    prev: '<path d="M19 5v14L9 12z" fill="currentColor" stroke="none"/><path d="M6 5v14"/>',
    next: '<path d="M5 5v14l10-7z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>',
    reset: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v5h5"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M18 13l-6 6-6-6"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M18 7l-.8 12.5H6.8L6 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    settings: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
    monitor: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 20.5h8M12 17v3.5"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 15V4M7 9l5-5 5 5M5 20h14"/>',
    send: '<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>'
  };
  ET.icon = (name) => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || '') + '</svg>';

  /* ---------- Manter a tela ligada (Wake Lock) ---------- */
  let wakeLock = null;
  ET.keepAwake = function () {
    if (wakeLock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    navigator.wakeLock.request('screen').then((l) => {
      wakeLock = l;
      l.addEventListener('release', () => { wakeLock = null; });
    }).catch(() => {});
  };
  document.addEventListener('visibilitychange', ET.keepAwake);
  document.addEventListener('pointerdown', ET.keepAwake);

  /* ---------- Bipe (o navegador só libera áudio após um clique) ---------- */
  let audio = null;
  ET.unlockAudio = function () {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!audio && AC) { try { audio = new AC(); } catch (e) { /* sem áudio */ } }
    if (audio && audio.state === 'suspended') audio.resume();
  };
  ET.beep = function () {
    if (!audio) return;
    [0, 0.35, 0.7].forEach((off) => {
      const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + off;
      o.type = 'sine'; o.frequency.value = 880;
      o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      o.start(t0); o.stop(t0 + 0.3);
    });
  };

  /* ---------- Arquivos ---------- */
  /** Lê um arquivo escolhido pelo usuário. modo: 'text' ou 'dataURL'. Retorna uma Promise. */
  ET.readFile = (file, modo) => new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => resolve(rd.result);
    rd.onerror = () => reject(rd.error);
    if (modo === 'dataURL') rd.readAsDataURL(file); else rd.readAsText(file);
  });

  /** Oferece um texto para download com o nome informado */
  ET.download = function (nome, texto, tipo) {
    const a = ET.el('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: tipo || 'application/json' }));
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  /** "Sesc Seminário 2026" → "sesc-seminario-2026" */
  ET.slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /** Verdadeiro se o foco está num campo de digitação (atalhos de teclado não devem agir) */
  ET.isTyping = (node) => !!node && (/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName) || node.isContentEditable);

  /** Esconde o cursor após alguns segundos parado sobre o elemento */
  ET.autoHideCursor = function (node, ms) {
    let t = null;
    const wake = () => { node.classList.remove('idle'); clearTimeout(t); t = setTimeout(() => node.classList.add('idle'), ms || 2500); };
    node.addEventListener('pointermove', wake);
    wake();
  };
})(window.ET);
