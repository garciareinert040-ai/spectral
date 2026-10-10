// =============================================================================
// data.js — Conteúdo GENÉRICO (vale pra qualquer strain)
// -----------------------------------------------------------------------------
// Nada aqui é específico de uma genética. O que muda de cultivo pra cultivo
// (strain, tipo, tempo de ciclo, vaso, luz, treino, adubação) é configurado
// DENTRO do app e fica salvo no Firestore. O cronograma de cada cultivo é
// GERADO a partir dessa configuração em js/plan.js.
// =============================================================================

// Configuração padrão de um cultivo novo. Tudo editável no app.
export const GROW_DEFAULTS = {
  name: '',             // apelido do cultivo (ex.: "Tenda 1 · inverno")
  strain: '',           // nome da genética
  breeder: '',          // banco de sementes (opcional)
  type: 'auto',         // 'auto' (autoflorescente) | 'photo' (fotoperíodo)
  cycleDays: 75,        // AUTO: dias da semente à colheita, segundo o breeder
  vegWeeks: 4,          // FOTO: semanas de vegetativo antes de virar 12/12
  flowerWeeks: 8,       // semanas de floração (dado do breeder)
  potLiters: null,      // volume do vaso
  medium: '',           // substrato (texto livre)
  space: '',            // estufa/espaço (texto livre)
  lightWatts: null,     // potência da luz
  lightMinCm: 30,       // distância mínima LED → topo (ver manual da luz)
  training: 'lst',      // 'none' | 'lst' | 'topping' | 'scrog'
  feeding: 'agua',      // 'agua' (solo vivo / pré-adubado) | 'nutrientes'
  goalGrams: null,      // meta de peso seco
  plantingDate: null,   // âncora: dia em que a semente germinada foi pro vaso
  dayOffset: 0,         // ajuste manual de contagem
  floweringStart: null, // AUTO: primeiros pistilos · FOTO: dia em que virou 12/12
  postHarvest: {},
};

// Atalhos pra preencher o tempo de ciclo quando você não tem o dado do breeder.
export const PRESETS = [
  { id: 'auto-rapida', label: 'Auto rápida', hint: '~60–70 dias · flor ~7 sem', type: 'auto', cycleDays: 65, flowerWeeks: 7 },
  { id: 'auto',        label: 'Auto padrão', hint: '~70–80 dias · flor ~8 sem', type: 'auto', cycleDays: 75, flowerWeeks: 8 },
  { id: 'auto-longa',  label: 'Auto longa / sativa', hint: '~85–100 dias · flor ~9–10 sem', type: 'auto', cycleDays: 90, flowerWeeks: 10 },
  { id: 'foto-indica', label: 'Foto indica', hint: 'veg 4 sem + flor 8 sem', type: 'photo', vegWeeks: 4, flowerWeeks: 8 },
  { id: 'foto-hibrida', label: 'Foto híbrida', hint: 'veg 4 sem + flor 9 sem', type: 'photo', vegWeeks: 4, flowerWeeks: 9 },
  { id: 'foto-sativa', label: 'Foto sativa', hint: 'veg 4 sem + flor 11 sem', type: 'photo', vegWeeks: 4, flowerWeeks: 11 },
];

export const TYPE_LABEL = { auto: 'Autoflorescente', photo: 'Fotoperíodo' };
export const TRAINING_LABEL = {
  none: 'Sem treino',
  lst: 'LST (dobras)',
  topping: 'Topping + LST',
  scrog: 'SCROG (tela)',
};
export const FEEDING_LABEL = {
  agua: 'Solo vivo / pré-adubado (só água)',
  nutrientes: 'Nutrientes na rega',
};

// Rótulo curto de estágio pra barra de progresso / chips.
export const STAGE_LABEL = { veg: 'Vegetativo', flower: 'Floração', mature: 'Maturação' };

// -----------------------------------------------------------------------------
// TABELAS DE REFERÊNCIA (genéricas)
// -----------------------------------------------------------------------------
export const WATERING_GOLDEN =
  'Regra de ouro: regue pelo PESO do vaso, não por calendário. Na dúvida, regue menos — excesso é o erro nº 1 e o que mais mata muda.';

export const PPFD_REF = { seedling: '200–400', veg: '400–600', flower: '600–900' };

export const LIGHT_NOTE =
  'Use a distância mínima do manual da sua luz como piso. Lendo a planta: perto demais = folhas do topo branqueando / pontas enrolando ("taco") → suba; longe demais = esticando, nós longos, pálida → abaixe.';

export const TROUBLESHOOTING = [
  { symptom: 'Folhas murchas, solo sempre molhado, mosquitinhos', cause: 'Excesso de rega (erro nº 1)', action: 'Secar entre regas; regar pelo peso' },
  { symptom: 'Planta esticando, nós longos, caule fino', cause: 'Luz longe ou fraca', action: 'Aproximar a luz (respeitando o mínimo); treino cedo' },
  { symptom: 'Folha branqueada no topo', cause: 'Luz perto demais', action: 'Subir a luz alguns cm' },
  { symptom: 'Folhas enroladas pra cima, estufa quente', cause: 'Calor', action: 'Rodar luz à noite; reforçar exaustão' },
  { symptom: 'Mofo / algodão cinza nos buds', cause: 'Umidade alta + ar parado na flor', action: 'Baixar umidade (40–50%); circulação; remover afetado' },
  { symptom: 'Pontas marrons e crocantes', cause: 'Excesso de adubo / nutriente', action: 'Reduzir dose; só água um tempo' },
  { symptom: 'Folhas de baixo amarelando rápido no veg', cause: 'Falta de nitrogênio', action: 'Top-dress ou nutriente de crescimento' },
  { symptom: 'Bolinhas (sacos de pólen) nos nós', cause: 'Planta macho / hermafrodita', action: 'Remover macho; hermafrodita: tirar os sacos e reduzir estresse' },
];

export const TRAINING_SUMMARY = {
  lst: 'LST: começa aos 4–6 nós com caule flexível. Tombar o topo principal pro lado e amarrar frouxo na borda. Guiar a cada 2–3 dias (sempre que um topo passar dos outros, dobrar de volta), espalhando como raios de roda. Parar quando a floração engatar; depois só escorar. Se rachar, enrolar fita — cicatriza em dias.',
  topping: 'Topping: cortar o topo acima do 4º–5º nó quando a planta tiver 5–6 nós; ela vira dois topos principais. Depois, LST pra abrir. Em autoflorescente é arriscado (ela não recupera o tempo): se fizer, só uma vez e cedo.',
  scrog: 'SCROG: tela ~20–25 cm acima do vaso. Conforme os galhos passam da tela, puxe de volta por baixo e espalhe pros quadrados vazios. Pare de enfiar galhos ~1 semana depois de a floração começar.',
  none: 'Sem treino: só gire o vaso a cada poucos dias pra planta crescer por igual e escore os galhos pesados na floração.',
};

// -----------------------------------------------------------------------------
// REGA PELO PORTE DA PLANTA
// -----------------------------------------------------------------------------
// Volume acompanha o porte real: vaso grande com planta pequena bebe pouco e o
// substrato demora a secar.
export const SIZE_WATERING = [
  { maxHeight: 15,  label: '~200–350 ml', mid: 300, where: 'círculo próximo ao caule — deixe o resto do vaso secar' },
  { maxHeight: 30,  label: '~350–500 ml', mid: 425, where: 'círculo médio, ampliando aos poucos' },
  { maxHeight: 50,  label: '~500–700 ml', mid: 600, where: 'molhando mais área do vaso' },
  { maxHeight: 999, label: '~700 ml–1 L+', mid: 850, where: 'até pingar ~10–20% pelo fundo' },
];

export function waterForHeight(cm) {
  const h = Number(cm);
  if (!h || Number.isNaN(h)) return null;
  return SIZE_WATERING.find((r) => h <= r.maxHeight) || SIZE_WATERING[SIZE_WATERING.length - 1];
}

// -----------------------------------------------------------------------------
// PLANTA ANÃ / FLORAÇÃO PRECOCE
// -----------------------------------------------------------------------------
export const DWARF_MAX_HEIGHT = 20;

export const DWARF_GUIDANCE = {
  title: 'Planta pequena já em floração',
  what: 'Ela entrou em floração antes de ganhar porte. Isso trava a altura: daqui pra frente o crescimento vem do estirão da floração, não de treino.',
  do: [
    'Não treinar mais (LST/topping): em floração, dobrar só estressa e custa rendimento.',
    'Não desfolhar: com pouca massa foliar, cada folha é fábrica de açúcar pro bud.',
    'Regar POUCO e pelo peso: vaso grande com planta pequena demora a secar.',
    'Manter a luz no ponto: perto demais branqueia um topo que você não tem de sobra.',
  ],
  expect: 'O rendimento tende a ser modesto — é característica desse ciclo, não necessariamente erro de manejo.',
};

// Estimativa GROSSEIRA de rendimento seco pela altura. Não é promessa.
export const YIELD_ESTIMATE = [
  { maxHeight: 15,  label: '~5–15 g' },
  { maxHeight: 25,  label: '~10–25 g' },
  { maxHeight: 40,  label: '~20–40 g' },
  { maxHeight: 60,  label: '~35–60 g' },
  { maxHeight: 999, label: '~50–100+ g' },
];

export function yieldForHeight(cm) {
  const h = Number(cm);
  if (!h || Number.isNaN(h)) return null;
  return (YIELD_ESTIMATE.find((r) => h <= r.maxHeight) || YIELD_ESTIMATE[YIELD_ESTIMATE.length - 1]).label;
}

// Rótulos das checkboxes rápidas (as que aparecem são escolhidas em plan.js).
export const CHECK_LABEL = {
  lst: 'Fiz dobra de LST',
  topping: 'Fiz topping',
  scrog: 'Ajustei galhos na tela',
  feed: 'Dei nutrientes',
  topdress: 'Fiz top-dress',
  support: 'Escorei galho',
  trichomes: 'Checei tricomas com lupa',
};
export const CHECK_CHIP = {
  lst: 'LST', topping: 'Topping', scrog: 'Tela', feed: 'Nutrientes',
  topdress: 'Top-dress', support: 'Escora', trichomes: 'Tricomas',
};

// Aviso legal (rodapé de todas as telas).
export const LEGAL_NOTICE =
  'Material educacional. Pressupõe cultivo pessoal em contexto legalmente autorizado. ' +
  'Não constitui orientação jurídica, médica ou agronômica.';
