// =============================================================================
// phase.js — Cálculo de DIA / SEMANA / FASE a partir da data de plantio
// -----------------------------------------------------------------------------
// A data de plantio é a ÂNCORA de todo o cronograma. Tudo aqui é derivado dela.
// Dia 1 = o próprio dia do plantio.
// =============================================================================

import {
  SCHEDULE, GROW, STAGE_LABEL,
  FLOWER_SCHEDULE, FLOWER_MIN_DAYS, FLOWER_MAX_DAYS, FLOWER_MID_DAYS,
} from './data.js';

// Converte uma string 'YYYY-MM-DD' num Date local à meia-noite (evita bug de fuso).
export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Formata um Date para 'YYYY-MM-DD' (chave dos documentos de registro no Firestore).
export function fmtDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayStr() {
  return fmtDate(new Date());
}

// Data brasileira legível: '01/07/2026'.
export function fmtBR(str) {
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

const MS_DAY = 86400000;

// Número do dia do cultivo para uma data qualquer (default: hoje).
// `offset` = ajuste manual de dias (ex.: dias de germinação antes da semana 1).
//   Positivo adianta a contagem, negativo atrasa. Não altera nenhum registro —
//   os registros são guardados por DATA; isto só muda o rótulo do dia/semana.
// >>> AJUSTE AQUI se quiser mudar a regra de contagem (ex.: começar do dia 0). <<<
export function dayNumber(plantingDate, forDate = new Date(), offset = 0) {
  const start = parseDate(plantingDate);
  const ref = new Date(forDate.getFullYear(), forDate.getMonth(), forDate.getDate());
  return Math.floor((ref - start) / MS_DAY) + 1 + Number(offset || 0); // dia do plantio = dia 1 (+ ajuste)
}

// Devolve o objeto de semana (do SCHEDULE) correspondente a um número de dia.
// Antes do dia 1 → primeira semana. Depois do fim do ciclo → última (Colheita).
export function weekForDay(day) {
  if (day < 1) return SCHEDULE[0];
  for (const wk of SCHEDULE) {
    if (day >= wk.dayStart && day <= wk.dayEnd) return wk;
  }
  return SCHEDULE[SCHEDULE.length - 1];
}

// Semana de floração (1 = semana dos primeiros pistilos) a partir do dia de floração.
export function flowerWeekForDay(flowerDay) {
  const w = Math.ceil(Math.max(1, flowerDay) / 7);
  return Math.min(Math.max(w, 1), FLOWER_SCHEDULE.length);
}

// Estado da FLORAÇÃO OBSERVADA. Só existe quando `floweringStart` foi informado.
// Esta é a âncora correta pra autoflorescente — ela floresce quando quer, não
// quando o calendário do guia manda.
export function computeFlower(floweringStart, forDate = new Date()) {
  if (!floweringStart) return null;
  const start = parseDate(floweringStart);
  const ref = new Date(forDate.getFullYear(), forDate.getMonth(), forDate.getDate());
  const elapsed = Math.floor((ref - start) / MS_DAY);
  if (elapsed < 0) return null;             // data de floração ainda no futuro

  const flowerDay = elapsed + 1;            // dia dos primeiros pistilos = dia 1
  const week = flowerWeekForDay(flowerDay);
  const schedule = FLOWER_SCHEDULE[week - 1];

  // Janela estimada de colheita, contada da floração (o tricoma é quem decide).
  const harvestFrom = addDays(start, FLOWER_MIN_DAYS - 1);
  const harvestTo = addDays(start, FLOWER_MAX_DAYS - 1);
  const harvestMid = addDays(start, FLOWER_MID_DAYS - 1);
  const daysToHarvest = Math.max(0, Math.floor((harvestMid - ref) / MS_DAY));

  return {
    startDate: floweringStart,
    flowerDay,
    week,
    schedule,
    stage: schedule.stage,
    phase: schedule.phase,
    harvestFrom: fmtDate(harvestFrom),
    harvestTo: fmtDate(harvestTo),
    daysToHarvest,
    // Janela de colheita aberta a partir de ~7 semanas de floração.
    harvestReady: flowerDay >= FLOWER_MIN_DAYS,
  };
}

function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

// Pacote completo do "estado atual" do cultivo — o coração do dashboard.
// Quando `floweringStart` é informado, a fase/luz/colheita passam a vir da
// floração OBSERVADA; o cronograma fixo do guia vira só referência.
export function computeStatus(plantingDate, forDate = new Date(), offset = 0, floweringStart = null) {
  const day = dayNumber(plantingDate, forDate, offset);
  const wk = weekForDay(day);
  const flower = computeFlower(floweringStart, forDate);

  // Sem floração observada → comportamento original (calendário do guia).
  let totalDays = GROW.cycleDays;
  let daysToHarvest = Math.max(0, totalDays - day);
  let harvestReady = day >= 64;
  let stage = wk.stage;
  let phase = wk.phase;
  let schedule = wk;

  if (flower) {
    // Dia do cultivo em que a floração começou → base do ciclo estimado real.
    const flowerStartDay = dayNumber(plantingDate, parseDate(floweringStart), offset);
    totalDays = flowerStartDay + FLOWER_MID_DAYS - 1;
    daysToHarvest = flower.daysToHarvest;
    harvestReady = flower.harvestReady;
    stage = flower.stage;
    phase = flower.phase;
    schedule = flower.schedule;
  }

  const progress = Math.min(100, Math.max(0, (day / Math.max(1, totalDays)) * 100));
  const postHarvest = day > totalDays;

  return {
    day,
    totalDays,
    daysToHarvest,
    progress,
    harvestReady,
    postHarvest,
    week: wk.week,               // semana do guia (referência)
    stage,
    stageLabel: STAGE_LABEL[stage],
    phase,
    schedule,
    guideWeek: wk,               // cronograma fixo, pra aba Guia
    flower,                      // null quando a floração ainda não foi marcada
  };
}

// Diferença em dias entre uma data (string) e hoje — usada nos contadores de
// secagem e cura no módulo de pós-colheita.
export function daysSince(dateStr) {
  if (!dateStr) return null;
  const start = parseDate(dateStr);
  const now = new Date();
  const ref = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((ref - start) / MS_DAY);
}
