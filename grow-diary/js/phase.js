// =============================================================================
// phase.js — Cálculo de DIA / SEMANA / FASE a partir da data de plantio
// -----------------------------------------------------------------------------
// A data de plantio é a ÂNCORA de todo o cronograma. Tudo aqui é derivado dela.
// Dia 1 = o próprio dia do plantio.
// =============================================================================

import { SCHEDULE, GROW, STAGE_LABEL } from './data.js';

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

// Pacote completo do "estado atual" do cultivo — o coração do dashboard.
export function computeStatus(plantingDate, forDate = new Date(), offset = 0) {
  const day = dayNumber(plantingDate, forDate, offset);
  const wk = weekForDay(day);
  const totalDays = GROW.cycleDays;
  const daysToHarvest = Math.max(0, totalDays - day);
  const progress = Math.min(100, Math.max(0, (day / totalDays) * 100));
  const harvestReady = day >= 64;           // janela de colheita (semana 10)
  const postHarvest = day > totalDays;      // passou do ciclo → foco em secagem/cura

  return {
    day,
    totalDays,
    daysToHarvest,
    progress,
    harvestReady,
    postHarvest,
    week: wk.week,
    stage: wk.stage,
    stageLabel: STAGE_LABEL[wk.stage],
    phase: wk.phase,
    schedule: wk,
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
