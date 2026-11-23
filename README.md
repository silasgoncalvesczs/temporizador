# Temporizador de Eventos

Cronômetro para palco, palestras e eventos. Há um painel de controle para o operador e uma tela para o palestrante.
É um site estático: só HTML, CSS e JavaScript, sem build e sem dependências externas.

## Páginas

| Página | Uso |
|---|---|
| `index.html` | Painel de controle: programação, iniciar/pausar, mensagens, configurações |
| `tela.html` | Tela do palestrante: só exibe. Clique para tela cheia |

O painel e a tela se sincronizam pelo `localStorage` do navegador. Por isso, os dois precisam estar
abertos **no mesmo navegador e no mesmo computador**. O caso típico é o notebook do operador com
a tela do palestrante arrastada para o projetor ou monitor de retorno.

## Estrutura

```
index.html            painel de controle
tela.html             tela do palestrante
css/
  base.css            fontes, tokens de cor do painel (claro/escuro), reset
  tela.css            visual da tela do cronômetro (prévia e tela do palestrante)
  painel.css          visual do painel de controle
js/                   (carregados nesta ordem, sem módulos: funciona também via file://)
  utils.js            DOM, formatação de tempo, cores, ícones SVG, wake lock, bipe
  config.js           temas (PRESETS), fontes, configuração padrão e validação
  estado.js           estado, localStorage, sincronização e ações dos timers
  tela.js             monta e atualiza a tela do cronômetro (ET.createScreen)
  painel.js           interface do painel (index.html)
  palestrante.js      inicialização da tela do palestrante (tela.html)
assets/
  favicon.svg
  fonts/              Inter, Outfit, EB Garamond (woff2, uso offline)
eventos/
  modelo-temporizador.json   evento carregado no primeiro acesso (site hospedado)
backup/               versões antigas
```

Todos os scripts compartilham o objeto global `window.ET`. O estado fica salvo no navegador, na chave
`temporizador-eventos.estado` do `localStorage`.

## Modelo de evento

`eventos/modelo-temporizador.json` é o ponto de partida do sistema. Com o site hospedado, ele é
carregado automaticamente na **primeira vez** que alguém abre o painel ou a tela naquele navegador.
Depois disso, vale o que estiver salvo no navegador. Para mudar o que todo mundo vê no primeiro acesso,
edite esse arquivo ou substitua-o por um exportado do painel com o mesmo nome. Abrindo pelo disco
(`file://`), o navegador bloqueia a leitura do arquivo e o app usa uma programação de exemplo embutida.

Outros eventos podem ficar na mesma pasta (ex.: `eventos/seminario-2026.json`). Eles são carregados
por **Configurações → Importar evento**.

## Manutenção comum

- **Novo tema de cores:** adicione uma entrada em `ET.PRESETS` em `js/config.js`.
- **Nova opção de configuração:** crie o padrão em `ET.DEFAULT_CFG` (`js/config.js`), o campo no
  `<dialog>` de `index.html`, a ligação em `js/painel.js` e o efeito em `js/tela.js`.
- **Mudar o visual da tela:** `css/tela.css`. As medidas usam `cqw`/`cqh` (relativas à tela), então a prévia do
  painel e a tela cheia mantêm a mesma proporção.
- **Mensagens rápidas:** botões `.chip` em `index.html`.

## Preparar um evento

1. Abra `index.html` → **Configurações** e preencha organização, nome, subtítulo, rodapé e tema. Envie também os logos:
   o **da organização** aparece no canto superior esquerdo e o **do evento** no canto superior direito
   (de preferência PNG com fundo transparente). A data e a hora ficam no rodapé, à direita.
2. Monte a programação na coluna da direita.
3. **Configurações → Exportar evento** salva um `.json` (com os logos). Guarde-o em `eventos/`.
4. No computador do evento: **Configurações → Importar evento**.

## Hospedagem

Copie a pasta inteira (menos `backup/`) para qualquer hospedagem estática: GitHub Pages, Netlify,
Apache/Nginx, etc. Não precisa de servidor de aplicação. Use HTTPS, que é o que permite manter a tela
ligada (Wake Lock).

## Atalhos do painel

`Espaço` inicia/pausa · `→` / `Page Down` próximo · `←` / `Page Up` anterior.
Os atalhos de página funcionam com passadores de slides.
