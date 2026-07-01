// =============================================================================
// data.js — Dados FIXOS do cultivo (conteúdo do guia em PDF)
// -----------------------------------------------------------------------------
// Aqui vive todo o conteúdo estático do guia: ficha do grow, cronograma
// semana-a-semana, tabelas de rega/luz, troubleshooting e resumo de LST.
// Se você quiser ajustar textos, volumes ou distâncias de luz, é AQUI.
// (As datas-gatilho dos lembretes ficam em js/reminders.js.)
// =============================================================================

// Ficha fixa do projeto (aparece na aba Referências / cabeçalho).
export const GROW = {
  strain: 'G13 Labs · Auto Pineapple Express',
  strainDetail: 'Feminizada · Autoflorescente · Indica-dominante · THC ~15–20%',
  tent: '40 × 40 × 120 cm (Mylar 600D)',
  light: 'Quantum Board 65W (Samsung LM281B + Deep Red) — sem dimmer',
  exhaust: 'Exaustor 120 mm + filtro de carvão',
  pot: 'Vaso têxtil (feltro) 12 L',
  substrate: 'Terrô Solo Vivo AUTO + ~20% perlita · só água (não medir pH)',
  method: '1 planta · LST (sem topping/desfolha) · orgânico',
  cycle: '~65–70 dias da semente à colheita · porte até ~100 cm',
  climate: 'Navegantes/SC — úmido (risco de mofo relevante; wet trim recomendado)',
  cycleDays: 70,       // usado no cálculo de progresso do ciclo
  defaultGoal: 60,     // meta em gramas secos (editável no onboarding)
  minLightCm: 30,      // distância mínima da luz — nunca mais perto
};

// -----------------------------------------------------------------------------
// CRONOGRAMA SEMANA-A-SEMANA
// Cada objeto = 1 semana. `stage` controla a cor da fase:
//   veg = verde · flower = magenta · mature = âmbar
// `lightCm` e `waterMl` são valores numéricos usados pra pré-preencher o
// formulário de registro e pros alertas inteligentes.
// -----------------------------------------------------------------------------
export const SCHEDULE = [
  {
    week: 1, dayStart: 1, dayEnd: 7, stage: 'veg',
    phase: 'Germinação',
    do: 'Plantar a semente germinada (raiz pra baixo, ~1 cm); ~75–100 ml de água só ao redor da muda, no máx. a cada 3 dias.',
    observe: 'Brota em 2–7 dias; não encharcar; caule mole na base = excesso de água.',
    light: '~45 cm', lightCm: 45,
    water: '~75–100 ml só ao redor da muda · no máx. a cada 3 dias', waterMl: 90,
  },
  {
    week: 2, dayStart: 8, dayEnd: 14, stage: 'veg',
    phase: 'Muda',
    do: 'Só água, pouca e ao redor da muda (~100 ml, máx. 3 dias); manter umidade 50–60%.',
    observe: 'Amarelado/murcho aqui é quase sempre excesso de água; risco de fungus gnat.',
    light: '~45 cm', lightCm: 45,
    water: '~100 ml ao redor da muda · máx. 3 dias sem regar', waterMl: 100,
  },
  {
    week: 3, dayStart: 15, dayEnd: 21, stage: 'veg',
    phase: 'Vegetativo + 1ª dobra',
    do: 'Iniciar o LST: tombar o topo pro lado vazio e amarrar na borda; rega ~250–400 ml a cada 2–3 dias.',
    observe: 'Caule fino/esticado = luz longe; após a dobra, ramos viram pra cima em poucos dias.',
    light: '~35–40 cm', lightCm: 38,
    water: '~250–400 ml, círculo maior · a cada 2–3 dias', waterMl: 325,
  },
  {
    week: 4, dayStart: 22, dayEnd: 28, stage: 'veg',
    phase: 'Vegetativo pleno',
    do: 'Seguir guiando o LST a cada 2–3 dias (dossel plano nos 40×40); regar pelo peso (~400–500 ml).',
    observe: 'Atenção à altura, o estirão vem logo; dossel plano = todos os topos recebem luz forte.',
    light: '~35 cm', lightCm: 35,
    water: '~400–500 ml pelo peso · a cada 2–3 dias', waterMl: 450,
  },
  {
    week: 5, dayStart: 29, dayEnd: 35, stage: 'flower',
    phase: 'Pré-floração / Stretch',
    do: 'Parar o LST agressivo; top-dress de húmus; acertar a luz pra altura FINAL; rega ~500 ml.',
    observe: 'Controlar o estirão; confirmar pistilos (não bolsinhas de pólen).',
    light: '~30–35 cm', lightCm: 33,
    water: '~500 ml pelo peso', waterMl: 500,
  },
  {
    week: 6, dayStart: 36, dayEnd: 42, stage: 'flower',
    phase: 'Início da floração',
    do: 'Exaustor + filtro 24/7 (cheiro forte); baixar umidade pra 40–50%; só água (~500 ml–1 L pelo peso).',
    observe: 'Risco de mofo subindo — manter ar circulando; só suporte leve daqui pra frente.',
    light: '~30 cm', lightCm: 30,
    water: '~500 ml–1 L pelo peso', waterMl: 700,
  },
  {
    week: 7, dayStart: 43, dayEnd: 49, stage: 'flower',
    phase: 'Floração média',
    do: 'Umidade baixa (40–50%); só água; escorar galhos que entortem.',
    observe: 'Cheque buds densos por dentro (mofo = algodão cinza); tricomas começam leitosos.',
    light: '~30 cm', lightCm: 30,
    water: '~500 ml–1 L pelo peso', waterMl: 700,
  },
  {
    week: 8, dayStart: 50, dayEnd: 56, stage: 'flower',
    phase: 'Floração tardia',
    do: 'Só água; umidade baixa; começar a conferir tricomas com lupa.',
    observe: 'Pistilos em boa parte brancos/alaranjando; vigiar mofo nos buds densos.',
    light: '~30 cm', lightCm: 30,
    water: '~500 ml–1 L pelo peso', waterMl: 700,
  },
  {
    week: 9, dayStart: 57, dayEnd: 63, stage: 'mature',
    phase: 'Maturação',
    do: 'Iniciar os ~7–10 dias finais só com água; checar tricomas todo dia com lupa.',
    observe: 'Leitoso + ~10–20% âmbar = quase no ponto; transparentes = espere mais.',
    light: '~30 cm', lightCm: 30,
    water: 'Só água · pelo peso do vaso', waterMl: 600,
  },
  {
    week: 10, dayStart: 64, dayEnd: 70, stage: 'mature',
    phase: 'Colheita',
    do: 'Colher com a maioria dos tricomas leitosos + ~10–20% âmbar; depois bucking → trim (wet) → secagem → cura.',
    observe: 'Mais âmbar = efeito mais relaxante; menos = mais "cabeça"; sem pressa pelo relógio.',
    light: '~30 cm', lightCm: 30,
    water: 'Só água até a colheita', waterMl: 600,
  },
];

// Rótulo curto de estágio pra barra de progresso / chips.
export const STAGE_LABEL = {
  veg: 'Vegetativo',
  flower: 'Floração',
  mature: 'Maturação',
};

// -----------------------------------------------------------------------------
// TABELAS DE REFERÊNCIA
// -----------------------------------------------------------------------------
export const WATERING_REF = [
  { phase: 'Sem. 1–2', amount: '~75–100 ml, círculo ao redor da muda', when: 'no máx. 3 dias sem regar' },
  { phase: 'Sem. 3–4', amount: '~250–400 ml, círculo maior', when: 'a cada 2–3 dias' },
  { phase: 'Sem. 5+', amount: '~500 ml–1 L, até pingar ~10–20% pelo fundo', when: 'quando o vaso ficar leve' },
];
export const WATERING_GOLDEN =
  'Regra de ouro: regue pelo PESO do vaso, não por calendário. Na dúvida, regue menos — excesso é o erro nº 1 e o que mais mata muda.';

export const LIGHT_REF = [
  { phase: 'Plântula', distance: '~45 cm', ppfd: '200–400' },
  { phase: 'Vegetativo', distance: '~35–40 cm', ppfd: '400–600' },
  { phase: 'Floração', distance: '~30 cm', ppfd: '600–900' },
];
export const LIGHT_NOTE =
  'Mínimo 30 cm pra essa luz. Lendo a planta: perto demais = folhas do topo branqueando / pontas enrolando ("taco") → suba; longe demais = esticando, nós longos, pálida → abaixe.';

export const TROUBLESHOOTING = [
  { symptom: 'Folhas murchas, solo sempre molhado, mosquitinhos', cause: 'Excesso de rega (erro nº 1)', action: 'Secar entre regas; regar pelo peso' },
  { symptom: 'Planta esticando / perto da luz', cause: 'Vigor da Pineapple + pouco treino', action: 'LST firme e cedo; subir a luz; dossel plano' },
  { symptom: 'Folha branqueada no topo', cause: 'Luz perto demais', action: 'Subir a 65W alguns cm' },
  { symptom: 'Folhas enroladas pra cima, estufa quente', cause: 'Calor', action: 'Afastar do sol; rodar luz à noite; reforçar exaustão' },
  { symptom: 'Mofo / algodão cinza nos buds', cause: 'Umidade alta + ar parado na flor', action: 'Baixar umidade (40–50%); circulação; remover afetado' },
  { symptom: 'Pontas marrons e crocantes', cause: 'Top-dress em excesso / solo rico', action: 'Parar reforço; só água um tempo' },
];

export const LST_SUMMARY =
  'Começa aos 4–6 nós com caule flexível. Plantar deslocado (~5–8 cm da borda) com o espaço vazio do lado pra onde puxar o topo. ' +
  'Tombar o topo principal pro lado vazio e amarrar frouxo na borda. Guiar a cada 2–3 dias (sempre que um topo passar dos outros, dobrar de volta), ' +
  'espalhando como raios de roda nos 40×40. Parar quando a floração engatar (~semana 5); depois só escorar. Se rachar, enrolar fita — cicatriza em dias.';

// -----------------------------------------------------------------------------
// CHECKBOXES RÁPIDAS do registro diário — só aparecem na janela de dias relevante.
// -----------------------------------------------------------------------------
export const QUICK_CHECKS = [
  { key: 'lst',       label: 'Fiz dobra de LST',        fromDay: 15, toDay: 35 },
  { key: 'topdress',  label: 'Fiz top-dress de húmus',  fromDay: 29, toDay: 45 },
  { key: 'trichomes', label: 'Checei tricomas com lupa', fromDay: 50, toDay: 999 },
  { key: 'support',   label: 'Escorei galho',           fromDay: 36, toDay: 999 },
];

// A partir de que dia o seletor de tricomas aparece no registro (início da floração).
export const TRICHOME_FROM_DAY = 36;

// Aviso legal — igual ao guia em PDF (rodapé de todas as telas).
export const LEGAL_NOTICE =
  'Material educacional. Pressupõe cultivo pessoal em contexto legalmente autorizado. ' +
  'Não constitui orientação jurídica, médica ou agronômica.';
