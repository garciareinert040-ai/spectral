// =============================================================================
// phase.js — Cálculo de DIA / FASE / COLHEITA de um cultivo
// -----------------------------------------------------------------------------
// Âncoras, em ordem de prioridade:
//   1. floweringStart (observado: primeiros pistilos / virada 12/12)
//   2. plano gerado pela configuração (plan.js)
// Dia 1 = o dia em que a semente germinada foi pro vaso (+ ajuste de dias).
// =============================================================================

import { STAGE_LABEL } from './data.js';
import { buildPlan, flowerWeekGuide } from './plan.js';

const MS_DAY = 86400000;

// 'YYYY-MM-DD' → Date local à meia-noite (evita bug de fuso).
export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function fmtDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export function todayStr() { return fmtDate(new Date()); }
export function fmtBR(str) {
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}
function midnight(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function addDays(date, n) { const d = midnight(date); d.setDate(d.getDate() + n); return d; }

// Número do dia do cultivo pra uma data. `offset` adianta (+) ou atrasa (−).
export function dayNumber(plantingDate, forDate = new Date(), offset = 0) {
  const start = parseDate(plantingDate);
  return Math.floor((midnight(forDate) - start) / MS_DAY) + 1 + Number(offset || 0);
}

// Dias desde uma data (contadores de secagem/cura).
export function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((midnight(new Date()) - parseDate(dateStr)) / MS_DAY);
}

// Data de calendário correspondente a um dia do cultivo.
export function dateOfDay(plantingDate, day, offset = 0) {
  return fmtDate(addDays(parseDate(plantingDate), day - 1 - Number(offset || 0)));
}

// Estado completo do cultivo numa data — o coração do dashboard.
export function computeStatus(cfg, forDate = new Date()) {
  const plan = buildPlan(cfg);
  const g = plan.grow;
  const day = dayNumber(g.plantingDate, forDate, g.dayOffset);
  const fw = g.flowerWeeks;

  // Início da floração: observado (data informada) ou o do plano.
  const observed = !!g.floweringStart && parseDate(g.floweringStart) <= midnight(forDate);
  const flowerStartDate = observed ? g.floweringStart : dateOfDay(g.plantingDate, plan.flowerDay, g.dayOffset);
  const flowerStartDay = observed ? dayNumber(g.plantingDate, parseDate(g.floweringStart), g.dayOffset) : plan.flowerDay;

  let flower = null;
  if (observed || day >= plan.flowerDay) {
    const flowerDay = Math.floor((midnight(forDate) - parseDate(flowerStartDate)) / MS_DAY) + 1;
    const week = Math.max(1, Math.ceil(flowerDay / 7));
    const start = parseDate(flowerStartDate);
    flower = {
      observed,                       // false = estimado pelo plano
      startDate: flowerStartDate,
      flowerDay,
      week,
      guide: flowerWeekGuide(g, Math.min(week, fw + 1)),
      harvestFrom: fmtDate(addDays(start, (fw - 1) * 7 - 1)),
      harvestTo: fmtDate(addDays(start, (fw + 2) * 7 - 1)),
      harvestReady: flowerDay >= (fw - 1) * 7,
    };
  }

  // Fase atual: floração (se começou) ou fase pré-flor do plano.
  let schedule;
  if (flower) {
    schedule = flower.guide;
  } else {
    schedule = plan.pre.find((p) => day >= p.dayStart && day <= p.dayEnd)
      || (day < 1 ? plan.pre[0] : plan.pre[plan.pre.length - 1]);
  }

  const totalDays = flowerStartDay + fw * 7 - 1;
  const daysToHarvest = Math.max(0, totalDays - day);
  const progress = Math.min(100, Math.max(0, (day / Math.max(1, totalDays)) * 100));

  return {
    day,
    totalDays,
    daysToHarvest,
    progress,
    harvestReady: flower ? flower.harvestReady : false,
    postHarvest: day > totalDays + 14,
    stage: schedule.stage,
    stageLabel: STAGE_LABEL[schedule.stage],
    phase: schedule.phase,
    schedule,
    flower,
    plan,
    grow: g,
  };
}
