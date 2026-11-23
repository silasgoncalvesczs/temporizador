/* =========================================================
   Tela do cronômetro: monta o HTML da tela e a atualiza.
   Usada na prévia do painel e em tela.html.
   ========================================================= */
(function (ET) {
  'use strict';

  const TEMPLATE = `
    <div class="scr" data-ref="scr">
      <div class="scr-top">
        <div class="scr-brand">
          <img class="scr-logo" data-ref="logo" alt="" hidden>
          <div class="scr-brand-tx">
            <div class="scr-org" data-ref="org"></div>
            <div class="scr-event" data-ref="event"></div>
            <div class="scr-tag" data-ref="tag"></div>
          </div>
        </div>
        <img class="scr-elogo" data-ref="elogo" alt="" hidden>
      </div>
      <div class="scr-mid">
        <div class="scr-name" data-ref="name"></div>
        <div class="scr-time" data-ref="time">00:00</div>
        <div class="scr-progress"><div class="scr-bar" data-ref="bar"></div></div>
        <div class="scr-status"><span class="dot"></span><span data-ref="status"></span></div>
      </div>
      <div class="scr-msg" data-ref="msg" hidden>
        <span class="scr-msg-lbl">Mensagem</span>
        <span class="scr-msg-tx" data-ref="msgTx"></span>
      </div>
      <div class="scr-foot" data-ref="foot">
        <div class="scr-info" data-ref="info"></div>
        <div class="scr-clock" data-ref="clockBox">
          <span class="scr-date" data-ref="date"></span>
          <span class="scr-hour" data-ref="clock"></span>
        </div>
      </div>
    </div>`;

  /**
   * Cria uma tela dentro de `host` (elemento com a classe .scr-host).
   * opts.sound: true para tocar o bipe ao zerar (só no painel).
   */
  ET.createScreen = function (host, opts) {
    opts = opts || {};
    host.innerHTML = TEMPLATE;
    const r = {};
    host.querySelectorAll('[data-ref]').forEach((n) => { r[n.dataset.ref] = n; });

    let last = { id: null, zero: null, msg: null, logo: null, elogo: null };
    let flashTimer = null;

    function setText(node, text) {
      node.textContent = text;
      node.hidden = !text;
    }

    /** Aplica cores, fontes e textos do evento (chamar quando a configuração muda) */
    function applyConfig() {
      const c = ET.S.cfg;
      for (const k in c.colors) r.scr.style.setProperty('--s-' + k, c.colors[k]);
      r.scr.style.setProperty('--s-acc-tx', ET.readable(c.colors.acc));

      setImage('logo', c.logo);       // logo da organização (canto superior esquerdo)
      setImage('elogo', c.eventLogo); // logo do evento (canto superior direito)
      setText(r.org, c.org.trim());
      setText(r.event, c.name.trim());
      setText(r.tag, c.tagline.trim());
      r.info.textContent = c.footer.trim();
    }

    /** Só troca a imagem quando ela muda (evita recarregar a cada atualização) */
    function setImage(ref, src) {
      if (last[ref] === src) return;
      last[ref] = src;
      r[ref].hidden = !src;
      if (src) r[ref].src = src; else r[ref].removeAttribute('src');
    }

    function retrigger(node, cls) {
      node.classList.remove(cls);
      void node.offsetWidth; // força o navegador a reiniciar a animação
      node.classList.add(cls);
    }

    function onZero() {
      if (ET.S.cfg.flash) {
        retrigger(r.scr, 'flash');
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => r.scr.classList.remove('flash'), 3200);
      }
      if (opts.sound && ET.S.cfg.sound) ET.beep();
    }

    /** Atualiza tempo, status e mensagem (chamado várias vezes por segundo) */
    function render() {
      const c = ET.S.cfg, t = ET.current();
      const cls = ['scr', 'f-' + c.font];
      if (!c.showBar) cls.push('no-bar');
      r.clockBox.hidden = !c.showClock;
      r.foot.hidden = !c.showClock && !c.footer.trim();
      if (c.showClock) { r.date.textContent = ET.today(); r.clock.textContent = ET.clock(); }

      if (t) {
        const s = ET.rem(t), zero = s <= 0;
        r.name.textContent = t.name;
        r.time.textContent = ET.fmt(s);
        // Esgotado: barra cheia em vermelho (mais visível que uma barra vazia)
        r.bar.style.width = (zero ? 1 : Math.min(1, s / t.dur)) * 100 + '%';

        let status;
        if (zero) { cls.push('is-over'); status = 'Tempo esgotado'; }
        else if (s <= c.warnSec) { cls.push('is-warn'); status = t.running ? 'Reta final' : 'Pausado'; }
        else if (t.running) { cls.push('is-running'); status = 'Em andamento'; }
        else { status = t.left >= t.dur ? 'Pronto' : 'Pausado'; }
        r.status.textContent = status;

        // Chegou a zero agora (não dispara ao abrir a página nem ao trocar de timer)
        if (t.running && zero && last.id === t.id && last.zero === false) onZero();
        last.id = t.id; last.zero = zero;
      } else {
        r.name.textContent = 'Nenhum timer selecionado';
        r.time.textContent = '--:--';
        r.bar.style.width = '0';
        r.status.textContent = '';
        last.id = null;
      }

      if (r.scr.classList.contains('flash')) cls.push('flash');
      r.scr.className = cls.join(' ');

      const msg = ET.S.msg || '';
      r.msg.hidden = !msg;
      r.msgTx.textContent = msg;
      if (msg && last.msg !== null && msg !== last.msg) retrigger(r.msg, 'pop');
      last.msg = msg;
    }

    applyConfig();
    render();
    return { applyConfig, render };
  };
})(window.ET);
