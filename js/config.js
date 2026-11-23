/* =========================================================
   Configurações do evento: temas, valores padrão e validação.
   Para criar um tema novo, adicione uma entrada em PRESETS.
   ========================================================= */
(function (ET) {
  'use strict';

  /** Cores editáveis da tela: [chave, rótulo] */
  ET.COLOR_KEYS = [
    ['bg', 'Fundo'],
    ['bg2', 'Fundo (brilho do topo)'],
    ['text', 'Textos'],
    ['muted', 'Textos secundários'],
    ['time', 'Números do tempo'],
    ['acc', 'Destaque e mensagem']
  ];

  ET.PRESETS = {
    grafite:  { label: 'Grafite',      c: { bg: '#0e0f12', bg2: '#1f232b', text: '#f4f5f7', muted: '#8b919c', time: '#ffffff', acc: '#f5b301' } },
    marinho:  { label: 'Azul-marinho', c: { bg: '#08111f', bg2: '#15294a', text: '#f2f5fa', muted: '#8fa2c2', time: '#ffffff', acc: '#4c8dff' } },
    floresta: { label: 'Floresta',     c: { bg: '#0d1f15', bg2: '#1f3f2a', text: '#f3efe6', muted: '#b4ad98', time: '#f6ead8', acc: '#e9a23b' } },
    vinho:    { label: 'Vinho',        c: { bg: '#1a090e', bg2: '#3b1521', text: '#f7eeea', muted: '#c4a29a', time: '#ffffff', acc: '#e8a04a' } },
    petroleo: { label: 'Petróleo',     c: { bg: '#05171b', bg2: '#0e333a', text: '#eef7f6', muted: '#8fb5b2', time: '#ffffff', acc: '#2ec4b6' } },
    claro:    { label: 'Claro',        c: { bg: '#f4f4f1', bg2: '#ffffff', text: '#15171c', muted: '#6a6f78', time: '#0f1115', acc: '#c2410c' } }
  };

  ET.FONTS = { inter: 'Inter (padrão)', outfit: 'Outfit', serif: 'EB Garamond (serifada)' };

  ET.DEFAULT_CFG = {
    org: '',
    name: 'Nome do evento',
    tagline: '',
    footer: '',
    logo: '',            // logo da organização, em data URL (canto superior esquerdo)
    eventLogo: '',       // logo do evento, em data URL (canto superior direito)
    theme: 'grafite',
    colors: ET.copy(ET.PRESETS.grafite.c),
    font: 'inter',       // fonte dos títulos
    warnSec: 60,         // aviso laranja: segundos antes do fim
    showClock: true,
    showBar: true,
    flash: true,
    sound: false
  };

  /**
   * Completa e valida uma configuração (vinda do armazenamento ou de um arquivo importado).
   * Campos ausentes ou com tipo errado recebem o valor padrão.
   */
  ET.normCfg = function (c) {
    const o = ET.copy(ET.DEFAULT_CFG);
    c = c || {};
    for (const k in o) {
      if (k !== 'colors' && c[k] !== undefined && typeof c[k] === typeof o[k]) o[k] = c[k];
    }
    if (!ET.FONTS[o.font]) o.font = ET.DEFAULT_CFG.font;

    if (ET.PRESETS[o.theme]) {
      o.colors = ET.copy(ET.PRESETS[o.theme].c);
    } else {
      o.theme = 'custom';
      if (c.colors) ET.COLOR_KEYS.forEach(([k]) => {
        if (/^#[0-9a-f]{6}$/i.test(c.colors[k] || '')) o.colors[k] = c.colors[k];
      });
    }
    o.warnSec = Math.max(0, Math.round(o.warnSec) || 0);
    return o;
  };

  /** "Organização · Nome do evento" (ignora partes vazias) */
  ET.eventTitle = (c) => [c.org.trim(), c.name.trim()].filter(Boolean).join(' · ');

  ET.normTimer = function (t) {
    const dur = Math.max(1, Math.round(+t.dur || 60));
    return {
      id: t.id || ET.uid(),
      name: String(t.name || 'Timer'),
      dur: dur,
      left: isFinite(+t.left) ? +t.left : dur,
      running: !!t.running,
      endAt: +t.endAt || 0
    };
  };

  ET.sampleTimers = () => [
    { name: 'Abertura', dur: 300 },
    { name: 'Palestra principal', dur: 1200 },
    { name: 'Perguntas e respostas', dur: 600 }
  ].map(ET.normTimer);
})(window.ET);
