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
import { waterForHeight, DWARF_MAX_HEIGHT } from './data.js';

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

// Lembretes por data que deixam de fazer sentido quando a floração já começou
// (treino/LST não se faz em flor; o resto passa a ser guiado pela floração).
const OBSOLETE_WHEN_FLOWERING = ['lst', 'topdress'];

// Retorna os lembretes por data ativos para o dia atual do cultivo.
export function dateReminders(status) {
  const d = status.day;
  const flowering = !!status.flower;
  return DATE_REMINDERS
    .filter((r) => d >= r.day && d <= r.day + r.window)
    // Com floração observada, os gatilhos de calendário viram ruído: a
    // orientação certa passa a vir da semana de floração.
    .filter((r) => !(flowering && OBSOLETE_WHEN_FLOWERING.includes(r.kind)))
    .map((r) => ({ level: 'info', icon: r.icon, text: r.text }));
}

// --- 1b) Lembretes ancorados na FLORAÇÃO observada ---------------------------
// `week` = semana de floração em que o aviso passa a valer (janela de 7 dias).
export const FLOWER_REMINDERS = [
  { week: 1, icon: '📏', text: 'Stretch: a altura pode dobrar agora. Confira a distância da luz a cada 2 dias e pare qualquer treino.' },
  { week: 3, icon: '💨', text: 'Exaustor + filtro 24/7 (o cheiro aparece agora) e umidade em 40–50%.' },
  { week: 5, icon: '🔬', text: 'Comece a olhar os tricomas com a lupa — mesmo que ainda estejam transparentes.' },
  { week: 7, icon: '💧', text: 'Reta final: só água e tricoma todo dia.' },
  { week: 8, icon: '✂️', text: 'Janela de colheita aberta: maioria leitoso + ~10–20% âmbar. Quem manda é o tricoma, não o calendário.' },
];

export function flowerReminders(status) {
  if (!status.flower) return [];
  const w = status.flower.week;
  return FLOWER_REMINDERS
    .filter((r) => w === r.week)
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

  // (c) Umidade > 55% durante a floração → risco de mofo.
  // Agora ancorado na floração OBSERVADA (antes era semana 6 do calendário).
  const isFlowering = !!status.flower || status.week >= 6;
  if (isFlowering) {
    const lastHum = latestNumeric(entries, 'humidity');
    if (lastHum != null && lastHum > 55) {
      alerts.push({
        level: 'danger', icon: '🍄',
        text: `Umidade a ${lastHum}% na floração é alta — risco de mofo nos buds densos. Baixe pra 40–50% e reforce a circulação de ar.`,
      });
    }
  }

  // (d) Rega desproporcional ao PORTE da planta (não à fase do guia).
  // Numa planta pequena em vaso de 12 L, o volume "de semana 5" encharca.
  const lastHeight = latestNumeric(entries, 'plantHeight');
  const rec = waterForHeight(lastHeight);
  if (rec) {
    const lastWater = lastWateredVolume(entries);
    if (lastWater != null && lastWater > rec.mid * 2) {
      alerts.push({
        level: 'warn', icon: '🪣',
        text: `Você regou ${lastWater} ml numa planta de ${lastHeight} cm. Pro porte atual, ${rec.label} já basta (${rec.where}). Excesso é o erro nº 1.`,
      });
    }
  }

  // (e) Planta anã em floração → expectativa e manejo mudam de figura.
  if (status.flower && lastHeight != null && lastHeight < DWARF_MAX_HEIGHT) {
    alerts.push({
      level: 'info', icon: '🌱',
      text: `Planta pequena (${lastHeight} cm) já em floração: a altura praticamente travou. Daqui pra frente é só stretch — nada de treino ou desfolha, e rega curta pelo peso.`,
    });
  }

  return alerts;
}

// Volume da rega mais recente em que houve rega de fato.
function lastWateredVolume(entries) {
  const sorted = entries
    .filter((e) => e.watered && e.waterMl != null && e.waterMl !== '')
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return sorted.length ? Number(sorted[0].waterMl) : null;
}

// Junta alertas derivados + lembretes de floração + lembretes por data.
// `offset` = ajuste de dias; `floweringStart` = data dos primeiros pistilos.
export function allReminders(plantingDate, entriesByDate, forDate = new Date(), offset = 0, floweringStart = null) {
  const status = computeStatus(plantingDate, forDate, offset, floweringStart);
  return [
    ...derivedAlerts(status, entriesByDate),
    ...flowerReminders(status),
    ...dateReminders(status),
  ];
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
