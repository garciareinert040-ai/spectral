# As Cartas do Gralha 🗺️⚓

Mapa pirata interativo do Caribe (1715–1722) para acompanhar o progresso das
missões de **Assassin's Creed Black Flag Resynced** — desenhado como uma carta
náutica do século XVIII: pergaminho envelhecido, rosa dos ventos, monstros
marinhos e selos de cera. Toda a arte é original, gerada em SVG/CSS.

## Rodando

```bash
npm install
npm run dev
```

Build de produção: `npm run build` (saída em `dist/`, 100% estática).

## Como usar

- **Arraste** para navegar, **roda do mouse / pinça** para zoom.
- **Clique num pin** (X vermelho = missão pendente) para abrir o pergaminho com
  resumo (spoilers borrados por padrão) e o card "O que aconteceu de verdade".
- **Selar como concluída** carimba o pin e estende a **Rota do Gralha** —
  a linha tracejada vermelha que liga as missões concluídas em ordem.
- **Etiquetas de couro** no rodapé filtram as camadas (história, A World
  Without Gold, caçadas, contratos, lendários, fortes, oficiais).
- **Aba "Sequências"** à esquerda mostra o progresso por sequência (lacre de
  cera quando 100%), o modo lanterna e o reset ("Queimar as cartas").
- Navegação por teclado: `Tab` percorre os pins, `Enter` abre, `Esc` fecha.

O progresso é salvo em `localStorage` (chave `gralha-progress-v1`) — vale por
navegador/aparelho.

## Dados

- `src/data/missions.json` — 43 missões das 12 sequências + 8 do capítulo
  *A World Without Gold*. Entradas com `TODO` marcam dados a confirmar
  (nomes/locais de algumas memórias das Sequências 5, 11 e 12 e detalhes do
  capítulo novo) — basta editar o JSON.
- `src/data/camadas.json` — caçadas templárias, contratos, navios lendários,
  fortes e missões dos 3 oficiais (conteúdo novo do remake, com TODOs).

Sem assets da Ubisoft: nomes de missões/locais aparecem apenas como texto.
