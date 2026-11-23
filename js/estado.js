/* =========================================================
   Estado da aplicação, armazenamento e lógica dos timers.
   O estado fica no localStorage do navegador; o painel e a tela
   do palestrante se sincronizam pelo evento "storage".
   ========================================================= */
(function (ET) {
  'use strict';

  const KEY = 'temporizador-eventos.estado';
  /** Evento carregado automaticamente no primeiro acesso (só quando o site está hospedado) */
  const MODELO_URL = 'eventos/modelo-temporizador.json';

  /** Estado: { cfg, timers: [{id,name,dur,left,running,endAt}], cur, msg } */
  ET.S = { cfg: ET.copy(ET.DEFAULT_CFG), timers: [], cur: null, msg: '' };

  /* ---------- Assinantes de mudanças ---------- */
  const listeners = [];
  /** fn(origem): origem é 'local' (esta janela) ou 'remote' (outra janela) */
  ET.onChange = (fn) => listeners.push(fn);
  const emit = (src) => listeners.forEach((fn) => fn(src));

  /* ---------- Armazenamento ---------- */
  const hasSaved = () => { try { return localStorage.getItem(KEY) !== null; } catch (e) { return false; } };

  /** Lê o estado salvo. Retorna false se não houver nada salvo (ou se estiver corrompido). */
  ET.load = function () {
    try {
      const o = JSON.parse(localStorage.getItem(KEY));
      if (!o || !Array.isArray(o.timers)) return false;
      ET.S = {
        cfg: ET.normCfg(o.cfg),
        timers: o.timers.map(ET.normTimer),
        cur: o.cur || null,
        msg: typeof o.msg === 'string' ? o.msg : ''
      };
      return true;
    } catch (e) {
      return false; // armazenamento indisponível ou corrompido
    }
  };

  let saveWarned = false;
  ET.save = function () {
    try {
      localStorage.setItem(KEY, JSON.stringify(ET.S));
      saveWarned = false;
    } catch (e) {
      if (!saveWarned) {
        saveWarned = true;
        alert('Não foi possível salvar no navegador. Se você enviou um logo, tente uma imagem menor.');
      }
    }
  };

  /** Salva e avisa os assinantes desta janela */
  ET.commit = function () { ET.save(); emit('local'); };

  window.addEventListener('storage', (e) => {
    if (e.key === KEY && ET.load()) emit('remote');
  });

  /* ---------- Consultas ---------- */
  ET.get = (id) => ET.S.timers.find((t) => t.id === id);
  ET.indexOf = (id) => ET.S.timers.findIndex((t) => t.id === id);
  ET.current = () => ET.get(ET.S.cur);
  /** Segundos restantes (negativo = tempo excedido) */
  ET.rem = (t) => (t.running ? (t.endAt - Date.now()) / 1000 : t.left);

  /* ---------- Ações ---------- */
  function pause(t) { if (t.running) { t.left = ET.rem(t); t.running = false; } }
  function shift(t, d) { if (t.running) t.endAt += d * 1000; else t.left += d; }

  ET.start = function (id) {
    ET.S.timers.forEach((t) => { if (t.id !== id) pause(t); });
    const t = ET.get(id);
    if (!t) return;
    ET.S.cur = id;
    if (!t.running) { t.endAt = Date.now() + t.left * 1000; t.running = true; }
    ET.commit();
  };
  ET.toggle = function (id) {
    const t = ET.get(id);
    if (!t) return;
    if (t.running) { pause(t); ET.commit(); } else ET.start(id);
  };
  ET.reset = function (id) {
    const t = ET.get(id);
    if (!t) return;
    t.running = false; t.left = t.dur;
    ET.commit();
  };
  ET.resetAll = function () {
    ET.S.timers.forEach((t) => { t.running = false; t.left = t.dur; });
    ET.S.cur = ET.S.timers.length ? ET.S.timers[0].id : null;
    ET.commit();
  };
  ET.adjust = function (id, d) {
    const t = ET.get(id);
    if (!t) return;
    shift(t, d);
    ET.commit();
  };
  /** Altera a duração mantendo o tempo já decorrido */
  ET.setDur = function (id, dur) {
    const t = ET.get(id);
    if (!t) return;
    dur = Math.max(1, Math.round(dur));
    shift(t, dur - t.dur);
    t.dur = dur;
    ET.commit();
  };
  ET.rename = function (id, name) {
    const t = ET.get(id);
    if (!t) return;
    t.name = name;
    ET.commit();
  };
  ET.select = function (id) {
    if (ET.S.cur === id) return;
    ET.S.timers.forEach(pause);
    ET.S.cur = id;
    ET.commit();
  };
  /** Avança (+1) ou volta (−1); se o atual estava rodando, o próximo já começa */
  ET.go = function (d) {
    const i = ET.indexOf(ET.S.cur) + d;
    if (i < 0 || i >= ET.S.timers.length) return;
    const c = ET.current(), wasRunning = !!(c && c.running);
    ET.S.timers.forEach(pause);
    ET.S.cur = ET.S.timers[i].id;
    if (wasRunning) ET.start(ET.S.cur); else ET.commit();
  };
  ET.add = function (name, dur) {
    const t = ET.normTimer({ name: name, dur: dur });
    ET.S.timers.push(t);
    if (!ET.S.cur) ET.S.cur = t.id;
    ET.commit();
  };
  ET.remove = function (id) {
    const i = ET.indexOf(id);
    if (i < 0) return;
    ET.S.timers.splice(i, 1);
    if (ET.S.cur === id) ET.S.cur = ET.S.timers.length ? ET.S.timers[Math.min(i, ET.S.timers.length - 1)].id : null;
    ET.commit();
  };
  ET.move = function (id, d) {
    const i = ET.indexOf(id), j = i + d;
    if (i < 0 || j < 0 || j >= ET.S.timers.length) return;
    ET.S.timers.splice(j, 0, ET.S.timers.splice(i, 1)[0]);
    ET.commit();
  };
  ET.setMsg = function (msg) { ET.S.msg = msg; ET.commit(); };

  /* ---------- Exportar / importar ---------- */
  ET.exportData = () => ({
    app: 'temporizador-eventos',
    version: 3,
    cfg: ET.S.cfg,
    timers: ET.S.timers.map((t) => ({ name: t.name, dur: t.dur }))
  });
  /** Substitui configurações e programação. Lança erro se o arquivo for inválido. */
  ET.importData = function (o) {
    if (!o || !Array.isArray(o.timers)) throw new Error('O arquivo não contém uma programação de timers.');
    ET.S.cfg = ET.normCfg(o.cfg);
    ET.S.timers = o.timers.map((t) => ET.normTimer({ name: t.name, dur: t.dur }));
    ET.S.cur = ET.S.timers.length ? ET.S.timers[0].id : null;
    ET.S.msg = '';
    ET.commit();
  };

  /* ---------- Inicialização ---------- */
  if (!ET.load()) {
    // Primeiro acesso: começa com a programação de exemplo embutida...
    ET.S.timers = ET.sampleTimers();
    ET.S.cur = ET.S.timers[0].id;
    // ...e, com o site hospedado, troca pelo modelo da pasta eventos/ (via file:// o navegador bloqueia).
    if (location.protocol !== 'file:' && window.fetch) {
      fetch(MODELO_URL, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((o) => { if (o && !hasSaved()) ET.importData(o); })
        .catch(() => { /* sem modelo: segue com o exemplo embutido */ });
    }
  }
})(window.ET);
