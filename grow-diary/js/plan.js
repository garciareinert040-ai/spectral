// =============================================================================
// plan.js — CRONOGRAMA GERADO a partir da configuração do cultivo
// -----------------------------------------------------------------------------
// Em vez de um cronograma fixo de uma strain, cada cultivo ganha um plano
// montado com: tipo (auto/foto), tempo de ciclo, semanas de floração, treino,
// adubação e distância mínima da luz. Ajuste os textos aqui se quiser.
//
//   Germinação (dias 1–7) → Muda (8–14) → Vegetativo (semanas) → Floração
//   (semanas, do breeder) → Janela de colheita
// =============================================================================

import { GROW_DEFAULTS, CHECK_LABEL } from './data.js';

// Preenche campos faltando com os padrões e garante números válidos.
export function normalizeGrow(cfg = {}) {
  const g = { ...GROW_DEFAULTS, ...cfg };
  const n = (v, d, min, max) => {
    const x = Number(v);
    if (v === null || v === '' || Number.isNaN(x)) return d;
    return Math.min(max, Math.max(min, Math.round(x)));
  };
  g.type = g.type === 'photo' ? 'photo' : 'auto';
  g.cycleDays = n(g.cycleDays, GROW_DEFAULTS.cycleDays, 45, 160);
  g.vegWeeks = n(g.vegWeeks, GROW_DEFAULTS.vegWeeks, 2, 20);
  g.flowerWeeks = n(g.flowerWeeks, GROW_DEFAULTS.flowerWeeks, 6, 16);
  g.lightMinCm = n(g.lightMinCm, GROW_DEFAULTS.lightMinCm, 5, 120);
  g.dayOffset = Number(g.dayOffset || 0);
  if (!['none', 'lst', 'topping', 'scrog'].includes(g.training)) g.training = 'lst';
  if (!['agua', 'nutrientes'].includes(g.feeding)) g.feeding = 'agua';
  g.postHarvest = g.postHarvest || {};
  return g;
}

// Nome curto pra exibir (apelido > strain > genérico).
export function growTitle(g) {
  return (g && (g.name || g.strain)) || 'Meu cultivo';
}

// Dia do cultivo em que a floração DEVE começar, pelo plano.
//   AUTO: ciclo total − semanas de flor (ex.: 75 − 56 → dia 20)
//   FOTO: fim do vegetativo = dia da virada pra 12/12
export function plannedFlowerDay(g) {
  const d = g.type === 'photo'
    ? g.vegWeeks * 7 + 1
    : g.cycleDays - g.flowerWeeks * 7 + 1;
  return Math.max(15, d); // nunca antes do fim da fase de muda
}

// --- Textos de apoio ---------------------------------------------------------
function feedVeg(g) {
  return g.feeding === 'nutrientes'
    ? 'Nutriente de crescimento na rega (comece com metade da dose do fabricante).'
    : 'Só água, pelo peso do vaso — o solo já é o adubo.';
}
function feedFlower(g) {
  return g.feeding === 'nutrientes'
    ? 'Nutriente de floração na rega (dose do fabricante, sem exagero).'
    : 'Só água, pelo peso do vaso.';
}
function lightTxt(g, phase) {
  const m = g.lightMinCm;
  if (phase === 'seedling') return { light: `~${m + 15} cm`, lightCm: m + 15 };
  if (phase === 'veg') return { light: `~${m + 5}–${m + 10} cm`, lightCm: m + 7 };
  if (phase === 'stretch') return { light: `~${m}–${m + 3} cm`, lightCm: m + 2 };
  return { light: `~${m} cm`, lightCm: m };
}

function trainingStart(g) {
  switch (g.training) {
    case 'lst': return 'Com 4–6 nós e caule flexível, comece o LST: tombe o topo pro lado e amarre frouxo na borda.';
    case 'topping': return g.type === 'auto'
      ? 'Topping em auto é arriscado (ela não recupera o tempo). Se for fazer, só agora, acima do 4º–5º nó — senão, siga só com LST.'
      : 'Com 5–6 nós, faça o topping acima do 4º–5º nó; depois abra os dois topos com LST.';
    case 'scrog': return 'Instale a tela ~20–25 cm acima do vaso e comece a guiar os galhos por baixo dela.';
    default: return 'Sem treino: gire o vaso a cada poucos dias pra planta crescer por igual.';
  }
}
function trainingKeep(g) {
  switch (g.training) {
    case 'lst':
    case 'topping': return 'Guie o LST a cada 2–3 dias: sempre que um topo passar dos outros, dobre de volta — dossel plano.';
    case 'scrog': return 'Puxe pra baixo da tela os galhos que passarem e espalhe pros quadrados vazios.';
    default: return 'Gire o vaso a cada poucos dias; mantenha a luz na distância certa.';
  }
}

// --- Fases pré-floração ------------------------------------------------------
function vegPhases(g, F) {
  const phases = [
    {
      key: 'germ', stage: 'veg', dayStart: 1, dayEnd: 7, phase: 'Germinação / plântula',
      do: 'Semente germinada no vaso (raiz pra baixo, ~1 cm). Pouca água, só ao redor da muda — no máx. a cada 2–3 dias.',
      observe: 'Brota em 2–7 dias. Caule mole na base = excesso de água.',
      water: '~50–100 ml só ao redor da muda', waterMl: 80, ...lightTxt(g, 'seedling'),
    },
    {
      key: 'seedling', stage: 'veg', dayStart: 8, dayEnd: 14, phase: 'Muda',
      do: 'Pouca água, ao redor da muda. Umidade 55–65%.' + (g.feeding === 'nutrientes' ? ' Ainda sem nutriente (ou 1/4 da dose).' : ''),
      observe: 'Amarelado/murcho aqui é quase sempre excesso de água; risco de fungus gnat.',
      water: '~100–150 ml ao redor da muda', waterMl: 120, ...lightTxt(g, 'seedling'),
    },
  ];

  const vegDays = F - 15; // dias entre o fim da muda e a floração
  const weeks = Math.max(0, Math.ceil(vegDays / 7));
  for (let i = 0; i < weeks; i++) {
    const dayStart = 15 + i * 7;
    const dayEnd = Math.min(F - 1, dayStart + 6);
    const last = i === weeks - 1;
    let doTxt;
    let observe;
    let phase;
    if (i === 0) {
      phase = 'Vegetativo · início do treino';
      doTxt = `${trainingStart(g)} ${feedVeg(g)}`;
      observe = 'Caule fino/esticado = luz longe. Depois de uma dobra, os ramos viram pra cima em poucos dias.';
    } else if (last && g.type === 'photo') {
      phase = 'Vegetativo · preparar a virada';
      doTxt = `Última semana de veg: pare o treino agressivo, faça desfolha leve se o miolo estiver fechado e programe o timer pra 12/12. ${feedVeg(g)}`;
      observe = 'A planta costuma dobrar de tamanho na floração — vire 12/12 com ~metade da altura final que cabe na estufa.';
    } else if (last) {
      phase = 'Vegetativo · pré-floração';
      doTxt = `Pare o treino agressivo e acerte a luz pensando na altura FINAL. ${feedVeg(g)}`;
      observe = 'Os primeiros pistilos (pelinhos brancos) aparecem nos nós do topo — quando ver, marque a data da floração no app.';
    } else {
      phase = 'Vegetativo pleno';
      doTxt = `${trainingKeep(g)} ${feedVeg(g)}`;
      observe = 'Crescimento rápido; dossel plano = todos os topos recebem luz forte.';
    }
    phases.push({
      key: `veg${i + 1}`, stage: 'veg', dayStart, dayEnd, phase, do: doTxt, observe,
      water: 'pelo peso do vaso', waterMl: null, ...lightTxt(g, 'veg'),
    });
  }
  return phases;
}

// --- Semanas de floração -----------------------------------------------------
// `w` = semana de floração (1 = primeiros pistilos / virada 12/12).
export function flowerWeekGuide(g, w) {
  const fw = g.flowerWeeks;
  const base = { week: w };
  if (w >= fw + 1) {
    return { ...base, stage: 'mature', phase: 'Colheita (passou do previsto)', ...lightTxt(g, 'flower'),
      do: 'Se os tricomas já estão leitosos com âmbar, colha. Passar muito do ponto degrada os tricomas.',
      observe: 'Muito âmbar = efeito bem sedativo. Sem pressa, mas sem esquecer.' };
  }
  if (w === fw) {
    return { ...base, stage: 'mature', phase: 'Janela de colheita', ...lightTxt(g, 'flower'),
      do: 'Colha quando a maioria dos tricomas estiver leitosa + ~10–20% âmbar. Depois: bucking → trim → secagem → cura.',
      observe: 'Quem manda é o tricoma, não o calendário. Mais âmbar = mais relaxante; menos = mais "cabeça".' };
  }
  if (w === fw - 1) {
    return { ...base, stage: 'mature', phase: 'Maturação', ...lightTxt(g, 'flower'),
      do: g.feeding === 'nutrientes'
        ? 'Reta final: só água pura (flush), se esse for seu método. Checar tricomas TODO dia.'
        : 'Reta final: só água. Checar tricomas TODO dia.',
      observe: 'Leitoso + ~10–20% âmbar = quase no ponto. Ainda transparente = espere mais.' };
  }
  if (w === fw - 2) {
    return { ...base, stage: 'mature', phase: 'Maturação inicial', ...lightTxt(g, 'flower'),
      do: `${feedFlower(g)} Conferir tricomas com lupa a cada 1–2 dias.`,
      observe: 'Pistilos alaranjando; tricomas virando leitosos. Vigiar mofo nos buds densos.' };
  }
  if (w === 1) {
    return { ...base, stage: 'flower', phase: 'Floração · stretch inicial', ...lightTxt(g, 'stretch'),
      do: (g.type === 'photo' ? 'Luz em 12/12 com escuro TOTAL (nenhuma luz vazando). ' : '') +
        `Não treinar pesado nem desfolhar. ${feedFlower(g)} Ajuste a luz conforme ela sobe.`,
      observe: 'É agora que vem o estirão: a altura pode dobrar. Novos topos ainda podem aparecer.' };
  }
  if (w === 2) {
    return { ...base, stage: 'flower', phase: 'Floração · stretch final', ...lightTxt(g, 'stretch'),
      do: `${feedFlower(g)} Acerte a altura da luz pra altura FINAL da planta.` +
        (g.training === 'scrog' ? ' Última semana pra ajustar galhos na tela.' : ''),
      observe: 'Pistilos por toda parte; os sites viram cachos definidos. O estirão desacelera.' };
  }
  if (w === 3) {
    return { ...base, stage: 'flower', phase: 'Floração · início da engorda', ...lightTxt(g, 'flower'),
      do: `Exaustor + filtro 24/7 (o cheiro aparece agora). Umidade em 40–50%. ${feedFlower(g)}`,
      observe: 'Buds começam a ganhar volume. Ar circulando é o que evita mofo daqui pra frente.' };
  }
  return { ...base, stage: 'flower', phase: 'Floração · engorda', ...lightTxt(g, 'flower'),
    do: `${feedFlower(g)} Umidade baixa (40–50%). Escore galhos que entortarem com o peso.`,
    observe: 'Cheque os buds mais densos por dentro (mofo = algodão cinza).' };
}

// Plano completo: fases pré-flor + semanas de flor (pela data PLANEJADA).
export function buildPlan(cfg) {
  const g = normalizeGrow(cfg);
  const F = plannedFlowerDay(g);
  const pre = vegPhases(g, F);
  const flower = [];
  for (let w = 1; w <= g.flowerWeeks; w++) {
    flower.push({
      key: `flower${w}`, dayStart: F + (w - 1) * 7, dayEnd: F + w * 7 - 1,
      water: 'pelo peso do vaso', waterMl: null, ...flowerWeekGuide(g, w),
    });
  }
  return { grow: g, flowerDay: F, totalDays: F + g.flowerWeeks * 7 - 1, pre, flower };
}

// Checkboxes rápidas relevantes pro momento do cultivo.
export function quickChecks(g, status) {
  const fw = status.flower ? status.flower.week : null;
  const day = status.day;
  const keys = [];
  if (!fw && day >= 15) {
    if (['lst', 'topping', 'scrog'].includes(g.training)) keys.push('lst');
    if (g.training === 'topping') keys.push('topping');
    if (g.training === 'scrog') keys.push('scrog');
  }
  if (fw && fw <= 2 && g.training === 'scrog') keys.push('scrog');
  if (day >= 15 && g.feeding === 'nutrientes') keys.push('feed');
  if (day >= 21 && g.feeding === 'agua') keys.push('topdress');
  if (fw && fw >= 2) keys.push('support');
  if (fw && fw >= Math.max(3, g.flowerWeeks - 3)) keys.push('trichomes');
  return keys.map((key) => ({ key, label: CHECK_LABEL[key] }));
}
