/* =========================================================
   Tela do palestrante (tela.html)
   Só exibe; quem controla é o painel (index.html) aberto no
   mesmo navegador.
   ========================================================= */
(function (ET) {
  'use strict';
  const host = ET.$('screen');
  const screen = ET.createScreen(host);

  function updateTitle() {
    const full = ET.eventTitle(ET.S.cfg);
    document.title = (full ? full + ' · ' : '') + 'Tela do palestrante';
  }

  ET.onChange(() => { screen.applyConfig(); screen.render(); updateTitle(); });

  // Clique alterna tela cheia
  host.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  });

  ET.autoHideCursor(host);
  updateTitle();
  setInterval(screen.render, 200);
  ET.keepAwake();
})(window.ET);
