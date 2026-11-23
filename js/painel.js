/* =========================================================
   Painel de controle (index.html)
   ========================================================= */
(function (ET) {
  'use strict';
  const $ = ET.$, el = ET.el, S = () => ET.S;

  /** Lê um par de campos min/seg e devolve o total em segundos */
  const readDur = (min, sec) => (parseInt(min.value, 10) || 0) * 60 + Math.min(59, parseInt(sec.value, 10) || 0);

  /** Verdadeiro se o foco está num campo de digitação dentro de `box` */
  const isEditing = (box) => box.contains(document.activeElement) && ET.isTyping(document.activeElement);

  const screen = ET.createScreen($('preview'), { sound: true });

  /* ---------- Ícones nos botões estáticos (data-icon) ---------- */
  document.querySelectorAll('[data-icon]').forEach((b) => {
    b.insertAdjacentHTML('afterbegin', ET.icon(b.dataset.icon));
  });

  /* ---------- Cabeçalho ---------- */
  function renderHeader() {
    const full = ET.eventTitle(S().cfg);
    $('hTitle').textContent = full || 'Temporizador de Eventos';
    document.title = (full ? full + ' · ' : '') + 'Temporizador';
  }

  /* ---------- Controles do timer atual ---------- */
  let lastToggle = null;
  function renderTransport() {
    const t = ET.current(), i = ET.indexOf(S().cur);
    $('tpName').textContent = t ? t.name : 'Nenhum timer selecionado';
    $('tpPos').textContent = t ? 'Item ' + (i + 1) + ' de ' + S().timers.length : 'Programação vazia';
    const state = t ? (t.running ? 'run' : 'stop') : 'none';
    if (state !== lastToggle) {
      lastToggle = state;
      $('bToggle').innerHTML = ET.icon(state === 'run' ? 'pause' : 'play') + (state === 'run' ? 'Pausar' : 'Iniciar');
    }
    ['bToggle', 'bReset', 'bMinus', 'bPlus'].forEach((id) => { $(id).disabled = !t; });
    $('bPrev').disabled = i <= 0;
    $('bNext').disabled = i < 0 || i >= S().timers.length - 1;
  }

  $('bToggle').onclick = () => S().cur && ET.toggle(S().cur);
  $('bReset').onclick = () => S().cur && ET.reset(S().cur);
  $('bMinus').onclick = () => S().cur && ET.adjust(S().cur, -60);
  $('bPlus').onclick = () => S().cur && ET.adjust(S().cur, 60);
  $('bPrev').onclick = () => ET.go(-1);
  $('bNext').onclick = () => ET.go(1);

  /* ---------- Mensagem ---------- */
  function renderMsg() {
    $('msgLive').hidden = !S().msg;
    $('msgLiveTx').textContent = S().msg;
  }
  $('bSend').onclick = () => ET.setMsg($('msgIn').value.trim());
  $('msgIn').onkeydown = (e) => { if (e.key === 'Enter') $('bSend').click(); };
  $('bClr').onclick = () => { $('msgIn').value = ''; ET.setMsg(''); };
  document.querySelectorAll('.chip').forEach((c) => {
    c.onclick = () => { $('msgIn').value = c.textContent; ET.setMsg(c.textContent); };
  });

  /* ---------- Programação ---------- */
  function renderList() {
    const L = $('list');
    L.textContent = '';
    $('count').textContent = S().timers.length ? S().timers.length + (S().timers.length === 1 ? ' item' : ' itens') : '';
    if (!S().timers.length) {
      L.appendChild(el('div', 'list-empty', 'Nenhum timer. Adicione o primeiro abaixo.'));
      return;
    }
    S().timers.forEach((t, i) => {
      const row = el('div', 'it' + (t.id === S().cur ? ' cur' : ''));
      row.innerHTML = `
        <span class="it-n"></span>
        <input class="inp it-name" aria-label="Nome do timer">
        <span class="it-rem"></span>
        <div class="it-row2">
          <span class="it-dur">
            <input class="inp num m" type="number" min="0" aria-label="Minutos"><span class="lbl">min</span>
            <input class="inp num s" type="number" min="0" max="59" aria-label="Segundos"><span class="lbl">seg</span>
          </span>
          <span class="it-act">
            <button class="icon-btn play" data-a="play" title="${t.running ? 'Pausar' : 'Iniciar este timer'}">${ET.icon(t.running ? 'pause' : 'play')}</button>
            <button class="icon-btn" data-a="reset" title="Reiniciar">${ET.icon('reset')}</button>
            <button class="icon-btn" data-a="up" title="Mover para cima">${ET.icon('up')}</button>
            <button class="icon-btn" data-a="down" title="Mover para baixo">${ET.icon('down')}</button>
            <button class="icon-btn danger" data-a="del" title="Excluir">${ET.icon('trash')}</button>
          </span>
        </div>`;
      row.querySelector('.it-n').textContent = i + 1;
      row.querySelector('.it-rem').dataset.t = t.id;
      const n = row.querySelector('.it-name'), m = row.querySelector('.m'), s = row.querySelector('.s');
      n.value = t.name;
      m.value = Math.floor(t.dur / 60);
      s.value = t.dur % 60;
      n.onchange = () => ET.rename(t.id, n.value);
      m.onchange = s.onchange = () => ET.setDur(t.id, readDur(m, s));

      row.querySelectorAll('[data-a]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); act(t, b.dataset.a); }; });
      // Clique na linha (fora dos campos e botões) seleciona o timer
      row.onclick = (e) => { if (!e.target.closest('input,button')) ET.select(t.id); };
      L.appendChild(row);
    });
    renderTimes();
  }

  function act(t, a) {
    if (a === 'play') ET.toggle(t.id);
    else if (a === 'reset') ET.reset(t.id);
    else if (a === 'up') ET.move(t.id, -1);
    else if (a === 'down') ET.move(t.id, 1);
    else if (a === 'del' && confirm('Excluir o timer "' + t.name + '"' + (t.running ? ' (está rodando agora)' : '') + '?')) ET.remove(t.id);
  }

  function renderTimes() {
    S().timers.forEach((t) => {
      const e = document.querySelector('[data-t="' + t.id + '"]');
      if (!e) return;
      const v = ET.rem(t);
      e.textContent = ET.fmt(v);
      e.className = 'it-rem' + (v < 0 ? ' over' : t.running ? ' run' : '');
    });
  }

  $('bAdd').onclick = () => {
    const d = readDur($('nMin'), $('nSec'));
    ET.add($('nName').value.trim() || 'Novo timer', d > 0 ? d : 60);
    $('nName').value = '';
    $('nName').focus();
  };
  $('nName').onkeydown = (e) => { if (e.key === 'Enter') $('bAdd').click(); };
  $('bResetAll').onclick = () => { if (confirm('Reiniciar todos os timers e voltar para o primeiro?')) ET.resetAll(); };

  /* ---------- Telas ---------- */
  $('bWin').onclick = () => window.open('tela.html', 'tela-palestrante', 'width=1280,height=720');
  $('bFull').onclick = () => { const p = $('preview'); if (p.requestFullscreen) p.requestFullscreen().catch(() => {}); };
  ET.autoHideCursor($('preview'));

  /* ---------- Configurações ---------- */
  const dlg = $('cfgDlg');
  /** Campos de logo: [prefixo do id no HTML, chave na configuração] */
  const LOGOS = [['cLogo', 'logo'], ['cELogo', 'eventLogo']];
  $('bCfg').onclick = () => { fillCfg(); dlg.showModal(); };
  $('bCfgClose').onclick = $('bCfgDone').onclick = () => dlg.close();

  (function buildCfgForm() {
    const sel = $('cTheme');
    Object.keys(ET.PRESETS).forEach((k) => { const o = el('option', '', ET.PRESETS[k].label); o.value = k; sel.appendChild(o); });
    const oc = el('option', '', 'Personalizado'); oc.value = 'custom'; sel.appendChild(oc);

    const fs = $('cFont');
    Object.keys(ET.FONTS).forEach((k) => { const o = el('option', '', ET.FONTS[k]); o.value = k; fs.appendChild(o); });

    const box = $('cColors');
    ET.COLOR_KEYS.forEach(([k, label]) => {
      const l = el('label'), inp = el('input', 'inp');
      inp.type = 'color'; inp.id = 'cc-' + k;
      inp.oninput = () => { S().cfg.colors[k] = inp.value; S().cfg.theme = 'custom'; sel.value = 'custom'; ET.commit(); };
      l.append(inp, document.createTextNode(label));
      box.appendChild(l);
    });
  })();

  function fillCfg() {
    const c = S().cfg;
    $('cOrg').value = c.org; $('cName').value = c.name; $('cTag').value = c.tagline; $('cFoot').value = c.footer;
    $('cTheme').value = c.theme; $('cFont').value = c.font; $('cWarn').value = c.warnSec;
    ['showClock', 'showBar', 'flash', 'sound'].forEach((k) => { $('c-' + k).checked = c[k]; });
    ET.COLOR_KEYS.forEach(([k]) => { $('cc-' + k).value = c.colors[k]; });
    LOGOS.forEach(([prefix, key]) => {
      $(prefix + 'Prev').hidden = !c[key];
      if (c[key]) $(prefix + 'Prev').src = c[key];
      $(prefix + 'Rm').hidden = !c[key];
    });
  }

  const bindText = (id, key) => { $(id).oninput = () => { S().cfg[key] = $(id).value; ET.commit(); }; };
  bindText('cOrg', 'org'); bindText('cName', 'name'); bindText('cTag', 'tagline'); bindText('cFoot', 'footer');

  $('cTheme').onchange = () => {
    const k = $('cTheme').value, p = ET.PRESETS[k];
    S().cfg.theme = k;
    if (p) S().cfg.colors = ET.copy(p.c);
    fillCfg(); ET.commit();
  };
  $('cFont').onchange = () => { S().cfg.font = $('cFont').value; ET.commit(); };
  $('cWarn').onchange = () => { S().cfg.warnSec = Math.max(0, parseInt($('cWarn').value, 10) || 0); $('cWarn').value = S().cfg.warnSec; ET.commit(); };
  ['showClock', 'showBar', 'flash'].forEach((k) => { $('c-' + k).onchange = () => { S().cfg[k] = $('c-' + k).checked; ET.commit(); }; });
  $('c-sound').onchange = () => {
    S().cfg.sound = $('c-sound').checked;
    if (S().cfg.sound) { ET.unlockAudio(); ET.beep(); }
    ET.commit();
  };

  /** Reduz a imagem para no máximo `max` px (cabe no armazenamento do navegador) e devolve PNG em data URL */
  function shrinkImage(src, max) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || max, h = img.naturalHeight || max, sc = Math.min(1, max / Math.max(w, h));
        const cv = el('canvas');
        cv.width = Math.round(w * sc); cv.height = Math.round(h * sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  LOGOS.forEach(([prefix, key]) => {
    $(prefix).onchange = function () {
      const f = this.files[0];
      this.value = '';
      if (!f) return;
      ET.readFile(f, 'dataURL')
        .then((src) => shrinkImage(src, 600))
        .then((png) => { S().cfg[key] = png; fillCfg(); ET.commit(); })
        .catch(() => alert('Não foi possível ler esta imagem.'));
    };
    $(prefix + 'Rm').onclick = () => { S().cfg[key] = ''; fillCfg(); ET.commit(); };
  });

  /* ---------- Exportar / importar ---------- */
  $('bExport').onclick = () => {
    const c = S().cfg;
    const nome = ET.slug(c.org + ' ' + c.name) || 'evento';
    ET.download(nome + '.json', JSON.stringify(ET.exportData(), null, 2));
  };
  $('bImport').onclick = () => $('fImport').click();
  $('fImport').onchange = function () {
    const f = this.files[0];
    this.value = '';
    if (!f) return;
    ET.readFile(f, 'text').then((txt) => {
      let o;
      try { o = JSON.parse(txt); } catch (e) { alert('Arquivo inválido: não é um JSON.'); return; }
      if (!confirm('Substituir a programação e as configurações atuais pelas do arquivo "' + f.name + '"?')) return;
      try { ET.importData(o); $('msgIn').value = ''; fillCfg(); } catch (e) { alert('Arquivo inválido: ' + e.message); }
    });
  };

  /* ---------- Aviso de dois painéis abertos ---------- */
  if ('BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel('temporizador-eventos-painel');
      bc.onmessage = (e) => {
        if (e.data === 'hello') { bc.postMessage('here'); $('warnMulti').hidden = false; }
        else if (e.data === 'here') $('warnMulti').hidden = false;
        else if (e.data === 'bye') $('warnMulti').hidden = true;
      };
      bc.postMessage('hello');
      window.addEventListener('pagehide', () => bc.postMessage('bye'));
    } catch (e) { /* sem suporte */ }
  }

  /* ---------- Atalhos de teclado ---------- */
  const typing = (e) => ET.isTyping(e.target);
  document.addEventListener('keydown', (e) => {
    if (dlg.open || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat && S().cur) ET.toggle(S().cur); }
    else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); ET.go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ET.go(-1); }
  });
  // Evita que a barra de espaço também "clique" no botão em foco
  document.addEventListener('keyup', (e) => { if (e.code === 'Space' && !typing(e) && !dlg.open) e.preventDefault(); });
  document.addEventListener('pointerdown', ET.unlockAudio);

  /* ---------- Ciclo de atualização ---------- */
  ET.onChange((src) => {
    screen.applyConfig();
    renderHeader();
    if (src === 'local' || !isEditing($('list'))) renderList();
    if (src === 'remote' && dlg.open && !isEditing(dlg)) fillCfg();
    renderTransport(); renderMsg(); screen.render();
  });

  renderHeader(); renderList(); renderTransport(); renderMsg();
  setInterval(() => { screen.render(); renderTimes(); renderTransport(); }, 200);
  ET.keepAwake();
})(window.ET);
