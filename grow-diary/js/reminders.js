// =============================================================================
// reminders.js — MOTOR DE LEMBRETES INTELIGENTES
// -----------------------------------------------------------------------------
// Dois tipos de lembrete:
//   1) Por DIA/FASE  — disparam por número de dia (âncora = data de plantio).
//   2) DERIVADOS      — vêm da análise dos dados que você registra.
//
// >>> Pra ajustar as datas-gatilho depois, edite DATE_REMINDERS abaixo. <<<
// =============================================================================

import { computeStatus } from './phase.js';

// --- 1) Lembretes por dia/fase -----------------------------------------------
// `day` = dia do cultivo em que o lembrete começa a valer.
// O lembrete fica "ativo" numa janela (`window` dias) em torno desse dia, pra
// você não perder caso abra o app um ou dois dias depois.
export const DATE_REMINDERS = [
  { day: 15, window: 3, kind: 'lst',       icon: '🪢', text: 'Chegou a hora do LST — confira se já tem 4–6 nós e comece a tombar o topo.' },
  { day: 29, window: 3, kind: 'topdress',  icon: '🌱', text: 'Top-dress de húmus + pare o LST agressivo + acerte a luz pensando na altura FINAL (estirão vem agora).' },
  { day: 36, window: 3, kind: 'exhaust',   icon: '💨', text: 'Ligue exaustor + filtro 24/7 (cheiro forte agora) e baixe a umidade pra 40–50%.' },
  { day: 50, window: 3, kind: 'trichomes', icon: '🔬', text: 'Comece a checar os tricomas com lupa.' },
  { day: 57, window: 4, kind: 'flush',     icon: '💧', text: 'Últimos ~7–10 dias — só água. Cheque tricomas todo dia.' },
  { day: 64, window: 7, kind: 'harvest',   icon: '✂️', text: 'Janela de colheita: quem manda é o tricoma (maioria leitoso + ~10–20% âmbar), não o calendário.' },
];

// Retorna os lembretes por data ativos para o dia atual do cultivo.
export function dateReminders(status) {
  const d = status.day;
  return DATE_REMINDERS
    .filter((r) => d >= r.day && d <= r.day + r.window)
    .map((r) => ({ level: 'info', icon: r.icon, text: r.text }));
}

// --- 2) Alertas derivados dos dados registrados ------------------------------
// Recebe o status atual e o mapa de entradas { 'YYYY-MM-DD': entry }.
export function derivedAlerts(status, entriesByDate) {
  const alerts = [];
  const entries = Object.values(entriesByDate || {});

  // (a) Rega em dias CONSECUTIVOS nas semanas 1–2 → risco de excesso de água.
  if (status.week <= 2) {
    const wateredDates = entries
      .filter((e) => e.watered)
      .map((e) => e.date)
      .sort();
    for (let i = 1; i < wateredDates.length; i++) {
      if (isConsecutive(wateredDates[i - 1], wateredDates[i])) {
        alerts.push({
          level: 'warn', icon: '💧',
          text: 'Você regou em dias seguidos nas primeiras semanas. Cuidado com o excesso de água (erro nº 1) — deixe o solo secar entre regas.',
        });
        break;
      }
    }
  }

  // (b) Altura da luz registrada abaixo do mínimo (30 cm) → subir.
  const lastLight = latestNumeric(entries, 'lightHeight');
  if (lastLight != null && lastLight < 30) {
    alerts.push({
      level: 'warn', icon: '💡',
      text: `Luz a ${lastLight} cm está abaixo do mínimo dessa 65W (30 cm). Suba alguns cm pra evitar branqueamento do topo.`,
    });
  }

  // (c) Umidade > 55% durante a floração (semana 6+) → risco de mofo.
  if (status.week >= 6) {
    const lastHum = latestNumeric(entries, 'humidity');
    if (lastHum != null && lastHum > 55) {
      alerts.push({
        level: 'danger', icon: '🍄',
        text: `Umidade a ${lastHum}% na floração é alta — risco de mofo nos buds densos. Baixe pra 40–50% e reforce a circulação de ar.`,
      });
    }
  }

  return alerts;
}

// Junta lembretes por data + alertas derivados (dashboard mostra tudo junto).
export function allReminders(plantingDate, entriesByDate, forDate = new Date()) {
  const status = computeStatus(plantingDate, forDate);
  return [...derivedAlerts(status, entriesByDate), ...dateReminders(status)];
}

// --- helpers -----------------------------------------------------------------
function isConsecutive(a, b) {
  const da = new Date(a), db = new Date(b);
  return Math.round((db - da) / 86400000) === 1;
}

// Pega o valor numérico mais recente de um campo entre as entradas registradas.
function latestNumeric(entries, field) {
  const sorted = entries
    .filter((e) => e[field] != null && e[field] !== '')
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // mais recente primeiro
  return sorted.length ? Number(sorted[0][field]) : null;
}
