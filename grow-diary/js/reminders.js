// =============================================================================
// reminders.js — MOTOR DE LEMBRETES (genérico, derivado do plano do cultivo)
// -----------------------------------------------------------------------------
// Três fontes:
//   1) Marcos do plano (treino, pré-floração / virada 12/12)
//   2) Semanas de floração (stretch, exaustão, tricomas, colheita)
//   3) Alertas tirados dos SEUS registros (rega, luz, umidade, porte)
// =============================================================================

import { computeStatus } from './phase.js';
import { waterForHeight, DWARF_MAX_HEIGHT } from './data.js';

// --- 1) Marcos do plano ------------------------------------------------------
export function planReminders(status) {
  const g = status.grow;
  const d = status.day;
  const F = status.plan.flowerDay;
  const out = [];
  const flowering = !!status.flower;

  if (!flowering && g.training !== 'none' && d >= 15 && d <= 18) {
    out.push({ level: 'info', icon: '🪢', text: 'Hora de começar o treino — confira se já tem 4–6 nós.' });
  }
  // (O aviso de "marque a data da floração" fica no card do dashboard, com botão.)
  if (!g.floweringStart && g.type === 'photo' && d >= F - 3 && d <= F + 7) {
    out.push({ level: 'warn', icon: '🌗', text: 'Pelo plano, é hora de virar a luz pra 12/12 (escuro total nas 12 h de noite).' });
  }
  return out;
}

// --- 2) Semanas de floração --------------------------------------------------
export function flowerReminders(status) {
  if (!status.flower) return [];
  const g = status.grow;
  const w = status.flower.week;
  const fw = g.flowerWeeks;
  const map = {
    1: { icon: '📏', text: 'Stretch: a altura pode dobrar agora. Confira a distância da luz a cada 2 dias e pare treino pesado.' },
    3: { icon: '💨', text: 'Exaustor + filtro 24/7 (o cheiro aparece agora) e umidade em 40–50%.' },
  };
  map[Math.max(4, fw - 2)] = { icon: '🔬', text: 'Comece a olhar os tricomas com a lupa a cada 1–2 dias.' };
  map[fw - 1] = { icon: '💧', text: g.feeding === 'nutrientes' ? 'Reta final: flush (só água pura) e tricoma todo dia.' : 'Reta final: só água e tricoma todo dia.' };
  map[fw] = { icon: '✂️', text: 'Janela de colheita: maioria leitoso + ~10–20% âmbar. Quem manda é o tricoma, não o calendário.' };
  const r = map[Math.min(w, fw)];
  return r ? [{ level: 'info', ...r }] : [];
}

// --- 3) Alertas derivados dos registros --------------------------------------
export function derivedAlerts(status, entriesByDate) {
  const alerts = [];
  const g = status.grow;
  const entries = Object.values(entriesByDate || {});

  // (a) Regas em dias seguidos nas 2 primeiras semanas → excesso de água.
  if (status.day <= 14) {
    const wateredDates = entries.filter((e) => e.watered).map((e) => e.date).sort();
    for (let i = 1; i < wateredDates.length; i++) {
      if (isConsecutive(wateredDates[i - 1], wateredDates[i])) {
        alerts.push({ level: 'warn', icon: '💧', text: 'Você regou em dias seguidos nas primeiras semanas. Cuidado com o excesso de água (erro nº 1) — deixe o solo secar entre regas.' });
        break;
      }
    }
  }

  // (b) Luz abaixo da distância mínima configurada.
  const lastLight = latestNumeric(entries, 'lightHeight');
  if (lastLight != null && lastLight < g.lightMinCm) {
    alerts.push({ level: 'warn', icon: '💡', text: `Luz a ${lastLight} cm está abaixo do mínimo configurado (${g.lightMinCm} cm). Suba alguns cm pra evitar branqueamento do topo.` });
  }

  // (c) Umidade alta na floração → risco de mofo.
  if (status.flower) {
    const lastHum = latestNumeric(entries, 'humidity');
    if (lastHum != null && lastHum > 55) {
      alerts.push({ level: 'danger', icon: '🍄', text: `Umidade a ${lastHum}% na floração é alta — risco de mofo nos buds densos. Baixe pra 40–50% e reforce a circulação de ar.` });
    }
  }

  // (d) Rega desproporcional ao porte da planta.
  const lastHeight = latestNumeric(entries, 'plantHeight');
  const rec = waterForHeight(lastHeight);
  if (rec) {
    const lastWater = lastWateredVolume(entries);
    if (lastWater != null && lastWater > rec.mid * 2) {
      alerts.push({ level: 'warn', icon: '🪣', text: `Você regou ${lastWater} ml numa planta de ${lastHeight} cm. Pro porte atual, ${rec.label} já basta (${rec.where}). Excesso é o erro nº 1.` });
    }
  }

  // (e) Planta pequena já em floração (observada).
  if (status.flower && status.flower.observed && lastHeight != null && lastHeight < DWARF_MAX_HEIGHT) {
    alerts.push({ level: 'info', icon: '🌱', text: `Planta pequena (${lastHeight} cm) já em floração: a altura praticamente travou. Daqui pra frente é só stretch — nada de treino pesado ou desfolha, e rega curta pelo peso.` });
  }

  return alerts;
}

// Tudo junto, na ordem: alertas dos dados → floração → marcos do plano.
export function allReminders(cfg, entriesByDate, forDate = new Date()) {
  const status = computeStatus(cfg, forDate);
  return [...derivedAlerts(status, entriesByDate), ...flowerReminders(status), ...planReminders(status)];
}

// --- helpers -----------------------------------------------------------------
function isConsecutive(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000) === 1;
}
function latestNumeric(entries, field) {
  const sorted = entries
    .filter((e) => e[field] != null && e[field] !== '')
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return sorted.length ? Number(sorted[0][field]) : null;
}
function lastWateredVolume(entries) {
  const sorted = entries
    .filter((e) => e.watered && e.waterMl != null && e.waterMl !== '')
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return sorted.length ? Number(sorted[0].waterMl) : null;
}
