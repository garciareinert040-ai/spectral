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
// FLORAÇÃO OBSERVADA (âncora real de uma autoflorescente)
// -----------------------------------------------------------------------------
// Autoflorescente não segue calendário: ela floresce quando quer. Quando a data
// de início da floração (primeiros pistilos) é informada, o app passa a guiar
// por ESTA âncora em vez das semanas fixas do guia.
// Duração típica da floração, contada dos primeiros pistilos até a colheita:
export const FLOWER_MIN_DAYS = 49;   // ~7 semanas — mais cedo que isso é raro
export const FLOWER_MAX_DAYS = 70;   // ~10 semanas — limite superior comum
export const FLOWER_MID_DAYS = 56;   // ~8 semanas — usado nas estimativas

// Guia semana-a-semana DA FLORAÇÃO (semana 1 = primeiros pistilos).
export const FLOWER_SCHEDULE = [
  {
    week: 1, stage: 'flower', phase: 'Floração · stretch inicial',
    do: 'Só água, pelo peso do vaso. Não treinar, não desfolhar — a planta está redirecionando tudo pra flor. Manter a luz na distância certa conforme ela sobe.',
    observe: 'É agora que vem o estirão: a altura pode dobrar. Novos topos podem aparecer — isso ainda soma no yield final.',
    light: '~30–33 cm',
  },
  {
    week: 2, stage: 'flower', phase: 'Floração · stretch final',
    do: 'Só água. Top-dress leve de húmus se as folhas estiverem clareando. Acertar a altura da luz pra altura FINAL da planta.',
    observe: 'Pistilos por toda parte; os sites viram cachos definidos. O estirão desacelera no fim desta semana.',
    light: '~30 cm',
  },
  {
    week: 3, stage: 'flower', phase: 'Floração · início da engorda',
    do: 'Exaustor + filtro 24/7 (o cheiro aparece agora). Baixar a umidade pra 40–50%. Só água.',
    observe: 'Buds começam a ganhar volume. Ar circulando é o que evita mofo daqui pra frente.',
    light: '~30 cm',
  },
  {
    week: 4, stage: 'flower', phase: 'Floração · engorda',
    do: 'Só água; umidade baixa (40–50%). Escorar qualquer galho que entorte com o peso.',
    observe: 'Cheque os buds mais densos por dentro (mofo = algodão cinza). Tricomas ainda transparentes.',
    light: '~30 cm',
  },
  {
    week: 5, stage: 'flower', phase: 'Floração · engorda plena',
    do: 'Só água; manter umidade baixa. Começar a olhar tricomas com a lupa (mesmo que ainda transparentes).',
    observe: 'Primeiros tricomas leitosos aparecem. Pistilos começam a alaranjar nas pontas.',
    light: '~30 cm',
  },
  {
    week: 6, stage: 'mature', phase: 'Maturação inicial',
    do: 'Só água. Conferir tricomas com lupa a cada 1–2 dias.',
    observe: 'Boa parte dos pistilos alaranjando; tricomas virando leitosos. Vigiar mofo nos buds densos.',
    light: '~30 cm',
  },
  {
    week: 7, stage: 'mature', phase: 'Maturação',
    do: 'Só água — estes são os últimos ~7–10 dias. Checar tricomas TODO dia.',
    observe: 'Leitoso + ~10–20% âmbar = quase no ponto. Ainda transparente = espere mais.',
    light: '~30 cm',
  },
  {
    week: 8, stage: 'mature', phase: 'Janela de colheita',
    do: 'Colher quando a maioria dos tricomas estiver leitosa + ~10–20% âmbar. Depois: bucking → trim (wet) → secagem → cura.',
    observe: 'Quem manda é o tricoma, não o calendário. Mais âmbar = mais relaxante; menos = mais "cabeça".',
    light: '~30 cm',
  },
  {
    week: 9, stage: 'mature', phase: 'Colheita (passou do previsto)',
    do: 'Se os tricomas já estão leitosos com âmbar, pode colher. Passar muito do ponto degrada os tricomas.',
    observe: 'Muito âmbar = efeito bem sedativo. Sem pressa, mas sem esquecer.',
    light: '~30 cm',
  },
];

// -----------------------------------------------------------------------------
// REGA POR TAMANHO DA PLANTA (não só por fase)
// -----------------------------------------------------------------------------
// O guia original assume uma planta que chega perto de 100 cm. Numa planta
// pequena, o volume do guia vira ENCHARCAMENTO (o erro nº 1). Aqui o volume
// acompanha o porte real: vaso de 12 L com planta de 10 cm bebe pouco.
export const SIZE_WATERING = [
  { maxHeight: 15,  label: '~200–350 ml', mid: 300, where: 'círculo próximo ao caule — deixe o resto do vaso secar' },
  { maxHeight: 30,  label: '~350–500 ml', mid: 425, where: 'círculo médio, ampliando aos poucos' },
  { maxHeight: 50,  label: '~500–700 ml', mid: 600, where: 'molhando mais área do vaso' },
  { maxHeight: 999, label: '~700 ml–1 L', mid: 850, where: 'até pingar ~10–20% pelo fundo' },
];

// Recomendação de rega a partir da altura registrada (cm).
export function waterForHeight(cm) {
  const h = Number(cm);
  if (!h || Number.isNaN(h)) return null;
  return SIZE_WATERING.find((r) => h <= r.maxHeight) || SIZE_WATERING[SIZE_WATERING.length - 1];
}

// -----------------------------------------------------------------------------
// PLANTA ANÃ / FLORAÇÃO PRECOCE
// -----------------------------------------------------------------------------
// Autoflorescente que engata a floração muito cedo (antes de ter porte) trava a
// altura: o que vier depois vem do estirão, não de treino. Abaixo desta altura,
// com a floração já iniciada, o app muda o tom da orientação.
export const DWARF_MAX_HEIGHT = 20;

export const DWARF_GUIDANCE = {
  title: 'Planta anã / floração precoce',
  what: 'Ela entrou em floração antes de ganhar porte. Isso trava a altura: daqui pra frente o crescimento vem do estirão da floração, não de treino.',
  do: [
    'Não treinar mais (LST/topping): em floração, dobrar só estressa e custa yield.',
    'Não desfolhar: com pouca massa foliar, cada folha é fábrica de açúcar pro bud.',
    'Regar POUCO e pelo peso: vaso de 12 L com planta pequena demora muito a secar.',
    'Manter a luz no ponto (30–35 cm): perto demais branqueia um topo que você não tem de sobra.',
    'Top-dress leve de húmus se as folhas clarearem — sem exagero, solo já é adubo.',
  ],
  expect: 'O yield vai ser modesto — é característica desse ciclo, não erro seu. O aprendizado (genética, timing, ambiente) é o retorno real deste primeiro grow.',
};

// Estimativa GROSSEIRA de rendimento seco pela altura. Não é promessa — serve
// só pra calibrar expectativa contra a meta.
export const YIELD_ESTIMATE = [
  { maxHeight: 15,  label: '~5–15 g' },
  { maxHeight: 25,  label: '~10–25 g' },
  { maxHeight: 40,  label: '~20–40 g' },
  { maxHeight: 60,  label: '~35–60 g' },
  { maxHeight: 999, label: '~50–80 g' },
];

export function yieldForHeight(cm) {
  const h = Number(cm);
  if (!h || Number.isNaN(h)) return null;
  return (YIELD_ESTIMATE.find((r) => h <= r.maxHeight) || YIELD_ESTIMATE[YIELD_ESTIMATE.length - 1]).label;
}

// -----------------------------------------------------------------------------
// CHECKBOXES RÁPIDAS do registro diário — só aparecem na janela de dias relevante.
// `hideWhenFlowering` some assim que a floração começa (treino não se faz mais).
// -----------------------------------------------------------------------------
export const QUICK_CHECKS = [
  { key: 'lst',       label: 'Fiz dobra de LST',        fromDay: 15, toDay: 35, hideWhenFlowering: true },
  { key: 'topdress',  label: 'Fiz top-dress de húmus',  fromDay: 29, toDay: 999 },
  { key: 'trichomes', label: 'Checei tricomas com lupa', fromDay: 50, toDay: 999, fromFlowerWeek: 4 },
  { key: 'support',   label: 'Escorei galho',           fromDay: 36, toDay: 999, fromFlowerWeek: 2 },
];

// A partir de que dia o seletor de tricomas aparece no registro (início da floração).
export const TRICHOME_FROM_DAY = 36;
// Com floração observada, o seletor aparece a partir desta semana de floração.
export const TRICHOME_FROM_FLOWER_WEEK = 3;

// Aviso legal — igual ao guia em PDF (rodapé de todas as telas).
export const LEGAL_NOTICE =
  'Material educacional. Pressupõe cultivo pessoal em contexto legalmente autorizado. ' +
  'Não constitui orientação jurídica, médica ou agronômica.';
