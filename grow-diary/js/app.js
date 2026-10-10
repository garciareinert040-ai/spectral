// =============================================================================
// app.js — UI, roteamento e orquestração
// -----------------------------------------------------------------------------
// Vanilla JS. Qualquer pessoa cria conta, monta quantos cultivos quiser (de
// qualquer strain) e o app gera o cronograma a partir da configuração de cada
// um (plan.js). Dados na nuvem via store.js, sincronizados entre dispositivos.
// =============================================================================

import { configPending } from './firebase-init.js';
import {
  watchAuth, login, register, resetPassword, logout, authErrorMessage, currentEmail,
  saveConfig, saveGrow, createGrow, setActiveGrow, deleteGrow,
  saveEntry, deleteEntry, watchConfig, watchEntries, preparePhoto,
  exportAll, importAll, LEGACY_GROW_ID,
} from './store.js';
import {
  GROW_DEFAULTS, PRESETS, TYPE_LABEL, TRAINING_LABEL, FEEDING_LABEL, STAGE_LABEL,
  WATERING_GOLDEN, PPFD_REF, LIGHT_NOTE, TROUBLESHOOTING, TRAINING_SUMMARY,
  SIZE_WATERING, waterForHeight, yieldForHeight, DWARF_MAX_HEIGHT, DWARF_GUIDANCE,
  CHECK_CHIP, LEGAL_NOTICE,
} from './data.js';
import { normalizeGrow, growTitle, plannedFlowerDay, quickChecks } from './plan.js';
import {
  computeStatus, dayNumber, todayStr, fmtBR, daysSince, dateOfDay, parseDate, fmtDate,
} from './phase.js';
import { allReminders } from './reminders.js';

// --------------------------- Estado da aplicação ----------------------------
const S = {
  uid: null,
  rawDoc: null,           // documento users/{uid} como veio da nuvem
  allEntries: [],         // registros de TODOS os cultivos
  grows: {},              // { id: config normalizada }
  growId: null,           // cultivo ativo
  config: null,           // config normalizada do cultivo ativo
  entries: {},            // registros do cultivo ativo, por data
  tab: 'today',
  setupMode: null,        // 'new' | 'edit' quando a tela de configuração está aberta
  authMode: 'login',      // 'login' | 'signup' | 'reset'
  online: navigator.onLine,
  syncing: false,
  pendingWrites: false,
  ready: false,
  unsub: [],
};
const root = () => document.getElementById('root');

// Estado do cultivo ativo numa data (offset + floração observada já aplicados).
const STATUS = (forDate = new Date()) => computeStatus(S.config, forDate);

// ------------------------------- helpers ------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const photoSrc = (p) => (p && (p.data || p.url)) || '';

function toast(msg, type = '') {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 250); }, 2600);
}
function legalFooter() { return `<p class="legal">${esc(LEGAL_NOTICE)}</p>`; }
function closeSheet() { document.querySelectorAll('.sheet-backdrop, .sheet, .lightbox').forEach((e) => e.remove()); }
function openSheet(html) {
  closeSheet();
  const bd = document.createElement('div'); bd.className = 'sheet-backdrop'; bd.onclick = closeSheet;
  const sheet = document.createElement('div'); sheet.className = 'sheet'; sheet.innerHTML = html;
  document.body.appendChild(bd); document.body.appendChild(sheet);
}

// Altura mais recente registrada no cultivo ativo.
function latestHeight() {
  const withH = Object.values(S.entries)
    .filter((e) => e.plantHeight != null && e.plantHeight !== '')
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return withH.length ? Number(withH[0].plantHeight) : null;
}

// Sugere a data de início da floração varrendo as notas do cultivo ativo.
function suggestFloweringStart() {
  const re = /pistilo|pré[\s-]?flora|pre[\s-]?flora|floraç|12\/12/i;
  const hits = Object.values(S.entries).filter((e) => e.notes && re.test(e.notes)).map((e) => e.date).sort();
  return hits.length ? hits[0] : null;
}

// =============================================================================
//  DADOS: perfil → cultivos → cultivo ativo
// =============================================================================
// Antes de existir "vários cultivos", a config ficava solta no documento do
// usuário. Aqui ela vira o cultivo "principal" — em memória; só é gravada no
// formato novo quando você salvar algo nele. Nenhum registro é movido.
function growsFromDoc(doc) {
  const grows = { ...((doc && doc.grows) || {}) };
  if (doc && doc.plantingDate && !doc.legacyMigrated && !grows[LEGACY_GROW_ID]) {
    grows[LEGACY_GROW_ID] = {
      strain: doc.name || '', type: 'auto', cycleDays: 70, flowerWeeks: 8,
      plantingDate: doc.plantingDate, dayOffset: doc.dayOffset || 0,
      floweringStart: doc.floweringStart || null, goalGrams: doc.goalGrams || null,
      postHarvest: doc.postHarvest || {}, createdAt: '0',
    };
  }
  return grows;
}

function applyData() {
  const raw = growsFromDoc(S.rawDoc);
  S.grows = {};
  Object.entries(raw).forEach(([id, g]) => { S.grows[id] = normalizeGrow(g); });
  let id = S.rawDoc && S.rawDoc.activeGrowId;
  if (!id || !S.grows[id]) id = sortedGrowIds()[0] || null;
  S.growId = id;
  S.config = id ? S.grows[id] : null;
  S.entries = {};
  if (id) {
    S.allEntries
      .filter((e) => (e.growId || LEGACY_GROW_ID) === id)
      .forEach((e) => { S.entries[e.date] = e; });
  }
}

function sortedGrowIds() {
  return Object.keys(S.grows).sort((a, b) =>
    String(S.grows[b].plantingDate || '').localeCompare(String(S.grows[a].plantingDate || '')));
}

// Salva o cultivo ATIVO inteiro, com as alterações em `partial`.
async function saveActiveGrow(partial) {
  const full = { ...S.config, ...partial };
  S.config = normalizeGrow(full);
  S.grows[S.growId] = S.config;
  await saveGrow(S.uid, S.growId, full);
}

// =============================================================================
//  BOOT
// =============================================================================
window.addEventListener('online', () => { S.online = true; updateSync(); });
window.addEventListener('offline', () => { S.online = false; updateSync(); });

function boot() {
  if (configPending) { renderConfigNeeded(); return; }
  renderLoader('Conectando…');
  watchAuth((user) => {
    S.unsub.forEach((fn) => fn && fn()); S.unsub = [];
    S.rawDoc = null; S.allEntries = []; S.config = null; S.ready = false; S.tab = 'today'; S.setupMode = null;
    if (!user) { S.uid = null; renderAuth(); return; }
    S.uid = user.uid;
    startSync();
  });
}

// Assina perfil + registros em tempo real (sincronização multi-dispositivo).
function startSync() {
  renderLoader('Carregando seus cultivos…');
  S.unsub.push(watchConfig(S.uid, (doc, meta) => {
    S.rawDoc = doc;
    reflectMeta(meta);
    applyData();
    if (!S.ready) { S.ready = true; renderApp(); } else { rerender(); }
  }));
  S.unsub.push(watchEntries(S.uid, (list, meta) => {
    S.allEntries = list;
    reflectMeta(meta);
    applyData();
    if (S.ready) rerender();
  }));
  setTimeout(() => { if (!S.ready) { S.ready = true; applyData(); renderApp(); } }, 6000);
}

function reflectMeta(meta) {
  if (meta) S.pendingWrites = meta.hasPendingWrites;
  updateSync();
}

// =============================================================================
//  LOGIN / CADASTRO / ESQUECI A SENHA
// =============================================================================
function brand(sub) {
  return `<div class="brand">
    <div class="leaf">🌿</div>
    <div class="kicker">Diário de Cultivo</div>
    <h1>Seu grow, dia a dia</h1>
    <p>${esc(sub)}</p>
  </div>`;
}

function renderConfigNeeded() {
  root().innerHTML = `
    <div class="auth-screen"><div class="auth-card">
      ${brand('Qualquer strain, em qualquer dispositivo.')}
      <div class="config-warning">
        <b>Falta configurar o Firebase.</b><br>
        Abra <span class="mono">js/firebase-init.js</span> e cole as chaves do seu projeto
        Firebase em <span class="mono">firebaseConfig</span>. O passo a passo completo está no
        <span class="mono">README.md</span>.
      </div>
      ${legalFooter()}
    </div></div>`;
}

function renderAuth() {
  const mode = S.authMode;
  const signup = mode === 'signup';
  const reset = mode === 'reset';
  const sub = reset ? 'Enviamos um link pro seu e-mail pra criar uma senha nova.'
    : signup ? 'Crie sua conta — seus cultivos ficam só seus, em qualquer dispositivo.'
      : 'Entre pra ver seus cultivos em qualquer dispositivo.';

  root().innerHTML = `
    <div class="auth-screen"><div class="auth-card">
      ${brand(sub)}
      <div id="auth-err" class="auth-error hidden"></div>
      <div id="auth-ok" class="config-warning hidden" style="color:var(--green);border-color:rgba(124,195,106,.4);background:rgba(124,195,106,.08)"></div>
      <form id="auth-form">
        <div class="field">
          <label>E-mail</label>
          <input type="email" id="au-email" autocomplete="email" required placeholder="voce@email.com">
        </div>
        ${reset ? '' : `
        <div class="field">
          <label>Senha</label>
          <input type="password" id="au-pass" autocomplete="${signup ? 'new-password' : 'current-password'}" required minlength="6" placeholder="mínimo 6 caracteres">
        </div>`}
        ${signup ? `
        <div class="field">
          <label>Confirmar senha</label>
          <input type="password" id="au-pass2" autocomplete="new-password" required minlength="6" placeholder="repita a senha">
          <div class="hint">Sua sessão fica salva neste dispositivo (não pede login toda vez).</div>
        </div>` : ''}
        <button class="btn" id="au-submit" type="submit">${reset ? 'Enviar link' : signup ? 'Criar conta' : 'Entrar'}</button>
      </form>
      ${mode === 'login' ? '<div class="auth-toggle"><button id="au-forgot">Esqueci a senha</button></div>' : ''}
      <div class="auth-toggle">
        ${signup || reset ? 'Já tem conta?' : 'Primeira vez?'}
        <button id="au-toggle">${signup || reset ? 'Entrar' : 'Criar conta'}</button>
      </div>
      ${legalFooter()}
    </div></div>`;

  const label = reset ? 'Enviar link' : signup ? 'Criar conta' : 'Entrar';
  document.getElementById('au-toggle').onclick = () => { S.authMode = signup || reset ? 'login' : 'signup'; renderAuth(); };
  const forgot = document.getElementById('au-forgot');
  if (forgot) forgot.onclick = () => { S.authMode = 'reset'; renderAuth(); };

  document.getElementById('auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('au-email').value.trim();
    const btn = document.getElementById('au-submit');
    const errBox = document.getElementById('auth-err');
    const okBox = document.getElementById('auth-ok');
    const fail = (msg) => { errBox.textContent = msg; errBox.classList.remove('hidden'); btn.disabled = false; btn.textContent = label; };
    errBox.classList.add('hidden'); okBox.classList.add('hidden');

    if (signup && document.getElementById('au-pass').value !== document.getElementById('au-pass2').value) {
      fail('As senhas não conferem.'); return;
    }
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    try {
      if (reset) {
        await resetPassword(email);
        okBox.textContent = 'Pronto! Se existir conta com esse e-mail, o link chega em instantes (confira o spam).';
        okBox.classList.remove('hidden');
        btn.disabled = false; btn.textContent = label;
        return;
      }
      const pass = document.getElementById('au-pass').value;
      await (signup ? register(email, pass) : login(email, pass));
      // watchAuth cuida do resto
    } catch (err) {
      fail(authErrorMessage(err.code));
    }
  };
}

function renderLoader(msg) {
  root().innerHTML = `<div class="full-loader"><div style="text-align:center">
    <div class="spin"></div><div>${esc(msg)}</div></div></div>`;
}

// =============================================================================
//  CONFIGURAR CULTIVO (novo ou edição) — tudo pelo app
// =============================================================================
function setupFormHtml(cfg, mode) {
  const g = normalizeGrow(cfg);
  const sugg = mode === 'edit' && !g.floweringStart ? suggestFloweringStart() : null;
  const sel = (name, labels, value) => `<select id="s-${name}">${Object.entries(labels)
    .map(([k, v]) => `<option value="${k}" ${k === value ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`;
  const num = (v) => (v == null ? '' : v);

  return `
    <form id="setup-form">
      <h3 style="margin:4px 0 10px">🧬 Genética</h3>
      <div class="field">
        <label>Strain *</label>
        <input type="text" id="s-strain" required value="${esc(g.strain)}" placeholder="ex.: Northern Lights Auto">
      </div>
      <div class="form-row">
        <div class="field"><label>Banco / breeder</label><input type="text" id="s-breeder" value="${esc(g.breeder)}" placeholder="opcional"></div>
        <div class="field"><label>Apelido do cultivo</label><input type="text" id="s-name" value="${esc(g.name)}" placeholder="opcional"></div>
      </div>
      <div class="field">
        <label>Tipo</label>
        <div class="seg" id="s-type">
          <button type="button" data-v="auto" class="${g.type === 'auto' ? 'on' : ''}">Autoflorescente</button>
          <button type="button" data-v="photo" class="${g.type === 'photo' ? 'on' : ''}">Fotoperíodo</button>
        </div>
      </div>

      <h3 style="margin:18px 0 6px">⏱ Tempo de cultivo</h3>
      <p class="hint" style="margin-bottom:10px">Use o que o banco informa. Sem o dado? Toque num atalho:</p>
      <div class="entry-chips" id="s-presets" style="margin-bottom:14px">
        ${PRESETS.map((p) => `<button type="button" class="chip" data-preset="${p.id}" title="${esc(p.hint)}">${esc(p.label)}</button>`).join('')}
      </div>
      <div class="form-row">
        <div class="field auto-only"><label>Semente → colheita (dias)</label><input type="number" id="s-cycle" min="45" max="160" value="${g.cycleDays}"></div>
        <div class="field photo-only"><label>Vegetativo (semanas)</label><input type="number" id="s-veg" min="2" max="20" value="${g.vegWeeks}"></div>
        <div class="field"><label>Floração (semanas)</label><input type="number" id="s-flower" min="6" max="16" value="${g.flowerWeeks}"></div>
      </div>

      <h3 style="margin:18px 0 10px">📅 Datas</h3>
      <div class="field">
        <label>Data de plantio *</label>
        <input type="date" id="s-date" required max="${todayStr()}" value="${g.plantingDate || todayStr()}">
        <div class="hint">Dia em que a semente germinada foi pro vaso — a âncora do cronograma.</div>
      </div>
      <div class="field">
        <label id="s-flower-label">${g.type === 'photo' ? 'Virada pra 12/12' : 'Primeiros pistilos (início da floração)'}</label>
        <input type="date" id="s-flowerstart" max="${todayStr()}" value="${g.floweringStart || ''}">
        <div class="hint" id="s-flower-hint">${g.type === 'photo'
          ? 'Deixe vazio até virar a luz. Quando virar, preencha.'
          : 'Deixe vazio até ver os pelinhos brancos. Autoflorescente floresce quando quer — essa data ajusta o cronograma à sua planta.'}
          ${sugg ? `<br>Sugestão pelas suas notas: <b>${fmtBR(sugg)}</b> — <button type="button" id="s-usesugg" style="background:none;border:none;color:var(--magenta);font-weight:700;padding:0">usar</button>` : ''}
        </div>
      </div>

      <h3 style="margin:18px 0 10px">🏠 Estrutura</h3>
      <div class="form-row">
        <div class="field"><label>Vaso (L)</label><input type="number" id="s-pot" min="0" step="0.5" value="${num(g.potLiters)}" placeholder="ex.: 11"></div>
        <div class="field"><label>Luz (W)</label><input type="number" id="s-watts" min="0" value="${num(g.lightWatts)}" placeholder="ex.: 100"></div>
      </div>
      <div class="field">
        <label>Distância mínima da luz (cm)</label>
        <input type="number" id="s-lightmin" min="5" max="120" value="${g.lightMinCm}">
        <div class="hint">Veja no manual da sua luz. Vira o piso de todas as recomendações de altura.</div>
      </div>
      <div class="form-row">
        <div class="field"><label>Substrato</label><input type="text" id="s-medium" value="${esc(g.medium)}" placeholder="ex.: solo + perlita"></div>
        <div class="field"><label>Espaço / estufa</label><input type="text" id="s-space" value="${esc(g.space)}" placeholder="ex.: 60×60×140"></div>
      </div>

      <h3 style="margin:18px 0 10px">🪴 Manejo</h3>
      <div class="field"><label>Treino</label>${sel('training', TRAINING_LABEL, g.training)}</div>
      <div class="field"><label>Adubação</label>${sel('feeding', FEEDING_LABEL, g.feeding)}</div>
      <div class="form-row">
        <div class="field"><label>Meta (g secos)</label><input type="number" id="s-goal" min="1" value="${num(g.goalGrams)}" placeholder="opcional"></div>
        <div class="field"><label>Ajuste de dias</label><input type="number" id="s-offset" step="1" value="${g.dayOffset || 0}"></div>
      </div>
      <p class="hint" style="margin-top:-6px">Ajuste de dias: se a contagem estiver adiantada/atrasada em relação à sua. Não altera registros.</p>

      <div class="golden" id="s-preview" style="margin:16px 0"></div>

      <div class="form-actions">
        ${mode === 'first' ? '' : '<button type="button" class="btn btn-ghost" id="s-cancel">Cancelar</button>'}
        <button type="submit" class="btn" id="s-save">${mode === 'edit' ? 'Salvar' : 'Criar cultivo'}</button>
      </div>
    </form>`;
}

// Lê o formulário de configuração num objeto de cultivo.
function readSetupForm(base) {
  const v = (id) => document.getElementById(id).value;
  const numOrNull = (id) => (v(id) === '' ? null : Number(v(id)));
  const typeBtn = document.querySelector('#s-type button.on');
  return {
    ...base,
    strain: v('s-strain').trim(),
    breeder: v('s-breeder').trim(),
    name: v('s-name').trim(),
    type: typeBtn ? typeBtn.dataset.v : 'auto',
    cycleDays: numOrNull('s-cycle') ?? GROW_DEFAULTS.cycleDays,
    vegWeeks: numOrNull('s-veg') ?? GROW_DEFAULTS.vegWeeks,
    flowerWeeks: numOrNull('s-flower') ?? GROW_DEFAULTS.flowerWeeks,
    plantingDate: v('s-date'),
    floweringStart: v('s-flowerstart') || null,
    potLiters: numOrNull('s-pot'),
    lightWatts: numOrNull('s-watts'),
    lightMinCm: numOrNull('s-lightmin') ?? GROW_DEFAULTS.lightMinCm,
    medium: v('s-medium').trim(),
    space: v('s-space').trim(),
    training: v('s-training'),
    feeding: v('s-feeding'),
    goalGrams: numOrNull('s-goal'),
    dayOffset: Math.trunc(Number(v('s-offset') || 0)),
  };
}

function mountSetup(mode, base) {
  const typeSeg = document.getElementById('s-type');
  const syncType = () => {
    const photo = document.querySelector('#s-type button.on').dataset.v === 'photo';
    document.querySelectorAll('.auto-only').forEach((el) => { el.style.display = photo ? 'none' : ''; });
    document.querySelectorAll('.photo-only').forEach((el) => { el.style.display = photo ? '' : 'none'; });
    document.getElementById('s-flower-label').textContent = photo ? 'Virada pra 12/12' : 'Primeiros pistilos (início da floração)';
    updatePreview();
  };
  typeSeg.querySelectorAll('button').forEach((b) => {
    b.onclick = () => { typeSeg.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); syncType(); };
  });
  document.querySelectorAll('#s-presets [data-preset]').forEach((b) => {
    b.onclick = () => {
      const p = PRESETS.find((x) => x.id === b.dataset.preset);
      typeSeg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.v === p.type));
      if (p.cycleDays) document.getElementById('s-cycle').value = p.cycleDays;
      if (p.vegWeeks) document.getElementById('s-veg').value = p.vegWeeks;
      document.getElementById('s-flower').value = p.flowerWeeks;
      syncType();
    };
  });

  // Prévia ao vivo do cronograma gerado.
  function updatePreview() {
    const box = document.getElementById('s-preview');
    const cfg = readSetupForm(base);
    if (!cfg.plantingDate) { box.textContent = 'Informe a data de plantio.'; return; }
    const st = computeStatus(cfg);
    const g = st.grow;
    const F = plannedFlowerDay(g);
    const flowerLine = g.floweringStart
      ? `Floração (informada): <b>${fmtBR(g.floweringStart)}</b>`
      : `Floração prevista: <b>dia ${F}</b> (~${fmtBR(dateOfDay(g.plantingDate, F, g.dayOffset))})`;
    const start = g.floweringStart ? parseDate(g.floweringStart) : parseDate(dateOfDay(g.plantingDate, F, g.dayOffset));
    const add = (n) => { const d = new Date(start); d.setDate(d.getDate() + n); return fmtBR(fmtDate(d)); };
    box.innerHTML = `${flowerLine}<br>Colheita estimada: <b>${add((g.flowerWeeks - 1) * 7 - 1)} – ${add((g.flowerWeeks + 2) * 7 - 1)}</b>
      <br>Hoje: <b>Dia ${st.day}</b> · ${esc(st.phase)}
      <br><span style="opacity:.8">Estimativa — no fim, quem decide é o tricoma.</span>`;
  }
  document.getElementById('setup-form').addEventListener('input', updatePreview);
  document.getElementById('setup-form').addEventListener('change', updatePreview);
  const useSugg = document.getElementById('s-usesugg');
  if (useSugg) useSugg.onclick = () => { document.getElementById('s-flowerstart').value = suggestFloweringStart(); updatePreview(); };
  syncType();

  const cancel = document.getElementById('s-cancel');
  if (cancel) cancel.onclick = () => { S.setupMode = null; S.tab = 'today'; renderApp(); };

  document.getElementById('setup-form').onsubmit = async (e) => {
    e.preventDefault();
    const cfg = readSetupForm(base);
    if (!cfg.strain) { toast('Informe a strain.', 'err'); return; }
    if (!cfg.plantingDate) { toast('Informe a data de plantio.', 'err'); return; }
    const btn = document.getElementById('s-save');
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    try {
      if (mode === 'edit') {
        await saveActiveGrow(cfg);
        toast('Cultivo atualizado ✓', 'ok');
      } else {
        const id = await createGrow(S.uid, { ...cfg, postHarvest: {} });
        S.rawDoc = { ...(S.rawDoc || {}), activeGrowId: id, grows: { ...((S.rawDoc && S.rawDoc.grows) || {}), [id]: cfg } };
        applyData();
        toast('Cultivo criado ✓', 'ok');
      }
      S.setupMode = null; S.tab = 'today';
      renderApp();
    } catch (err) {
      console.error(err);
      toast('Erro ao salvar. Tente de novo.', 'err');
      btn.disabled = false; btn.textContent = mode === 'edit' ? 'Salvar' : 'Criar cultivo';
    }
  };
}

// Primeiro acesso (nenhum cultivo ainda): tela cheia de boas-vindas + formulário.
function renderFirstSetup() {
  root().innerHTML = `
    <div class="auth-screen" style="justify-content:flex-start"><div class="auth-card">
      <div class="brand">
        <div class="leaf">🌱</div>
        <div class="kicker">Vamos começar</div>
        <h1>Monte seu cultivo</h1>
        <p>O cronograma, os lembretes e a janela de colheita são gerados a partir disso. Dá pra mudar tudo depois.</p>
      </div>
      ${setupFormHtml({ ...GROW_DEFAULTS }, 'first')}
      <div class="auth-toggle"><button id="first-logout">Sair (${esc(currentEmail())})</button></div>
      ${legalFooter()}
    </div></div>`;
  mountSetup('first', {});
  document.getElementById('first-logout').onclick = () => logout();
}

// =============================================================================
//  APP SHELL
// =============================================================================
function renderApp() {
  if (!S.config) { renderFirstSetup(); return; }
  const status = STATUS();
  const activeCls = status.stage === 'veg' ? 'veg' : status.stage === 'mature' ? 'mature' : '';
  const many = Object.keys(S.grows).length > 1;

  root().innerHTML = `
    <div class="app">
      <header class="topbar">
        <div class="grow-name" id="grow-switch" style="cursor:pointer">
          <b>${esc(growTitle(S.config))}${many ? ' ▾' : ''}</b>
          <span class="mono">${esc(topbarLine(status))}</span>
        </div>
        <div id="sync-ind" class="sync"><span class="dot"></span><span class="txt">…</span></div>
        <button class="icon-btn" id="menu-btn" aria-label="Menu">⋯</button>
      </header>
      <main class="view" id="view"></main>
      <nav class="tabbar">
        ${tabBtn('today', '🏠', 'Hoje', activeCls)}
        ${tabBtn('history', '📖', 'Histórico', activeCls)}
        ${tabBtn('charts', '📈', 'Gráficos', activeCls)}
        ${tabBtn('schedule', '🗓️', 'Guia', activeCls)}
        ${tabBtn('ref', '📚', 'Ref', activeCls)}
      </nav>
    </div>`;

  document.getElementById('menu-btn').onclick = openMenu;
  document.getElementById('grow-switch').onclick = openGrows;
  document.querySelectorAll('.tabbar button').forEach((b) => {
    b.onclick = () => { S.setupMode = null; S.tab = b.dataset.tab; renderView(); };
  });
  updateSync();
  renderView();
}

function topbarLine(status) {
  const strain = S.config.name && S.config.strain ? `${S.config.strain} · ` : '';
  return status.flower
    ? `${strain}Dia ${status.day} · Flor sem ${status.flower.week}`
    : `${strain}Dia ${status.day} · ${status.phase}`;
}

function tabBtn(tab, ico, label, activeCls) {
  const active = S.tab === tab ? `active ${activeCls}` : '';
  return `<button class="${active}" data-tab="${tab}"><span class="ico">${ico}</span>${label}</button>`;
}

// Re-render preservando a tela atual (chegou dado novo da nuvem).
function rerender() {
  if (!S.config) { renderApp(); return; }
  if (!document.getElementById('view')) { renderApp(); return; }
  // Não atropela formulários abertos com uma sincronização.
  if (S.setupMode || S.tab === 'entry') { updateSync(); return; }
  const sub = document.querySelector('.grow-name span');
  if (sub) sub.textContent = topbarLine(STATUS());
  renderView();
}

function updateSync() {
  const el = document.getElementById('sync-ind');
  if (!el) return;
  el.classList.remove('is-synced', 'is-syncing', 'is-offline');
  let txt = 'Sincronizado';
  if (!S.online) { el.classList.add('is-offline'); txt = 'Offline'; }
  else if (S.syncing || S.pendingWrites) { el.classList.add('is-syncing'); txt = 'Sincronizando'; }
  else { el.classList.add('is-synced'); }
  el.querySelector('.txt').textContent = txt;
}

// =============================================================================
//  ROTEADOR
// =============================================================================
function renderView() {
  document.querySelectorAll('.tabbar button').forEach((b) =>
    b.classList.toggle('active', b.dataset.tab === S.tab));
  const v = document.getElementById('view');
  if (!v) return;
  window.scrollTo(0, 0);
  if (S.setupMode) {
    const editing = S.setupMode === 'edit';
    v.innerHTML = `
      <h2 class="section-title">${editing ? 'Configurar cultivo' : 'Novo cultivo'}</h2>
      <div class="section-sub">${editing ? 'Mudanças recalculam o cronograma — registros não são alterados' : 'Os cultivos anteriores continuam salvos'}</div>
      ${setupFormHtml(editing ? S.config : { ...GROW_DEFAULTS }, S.setupMode)}
      ${legalFooter()}`;
    mountSetup(S.setupMode, editing ? S.config : {});
    return;
  }
  switch (S.tab) {
    case 'today':    v.innerHTML = viewToday(); mountToday(); break;
    case 'entry':    renderEntryForm(); break;
    case 'history':  v.innerHTML = viewHistory(); mountHistory(); break;
    case 'charts':   v.innerHTML = viewCharts(); mountCharts(); break;
    case 'schedule': v.innerHTML = viewSchedule(); break;
    case 'ref':      v.innerHTML = viewRef(); mountRef(); break;
    case 'harvest':  v.innerHTML = viewHarvest(); mountHarvest(); break;
    default:         S.tab = 'today'; renderView();
  }
}

function openSetup(mode) { S.setupMode = mode; renderView(); }

// =============================================================================
//  VIEW: HOJE
// =============================================================================
function viewToday() {
  const status = STATUS();
  const g = status.grow;
  const wk = status.schedule;
  const f = status.flower;
  const reminders = allReminders(S.config, S.entries);
  const hasToday = !!S.entries[todayStr()];
  const barColor = status.stage === 'veg' ? 'bg-veg' : status.stage === 'flower' ? 'bg-flower' : 'bg-mature';

  const flowerLine = f
    ? `<div class="to-harvest" style="color:var(--magenta)">🌸 Floração · dia ${f.flowerDay} (semana ${f.week})${f.observed ? ` · desde ${fmtBR(f.startDate)}` : ' · estimada pelo plano'}</div>`
    : '';
  const harvestLine = status.postHarvest
    ? 'Ciclo concluído — foco em secagem e cura.'
    : `~${status.daysToHarvest} dias até a colheita${f ? ` · janela ${fmtBR(f.harvestFrom)} – ${fmtBR(f.harvestTo)}` : ' (estimativa)'}`;

  // Convite a marcar a floração real (auto: pistilos · foto: virada 12/12).
  const F = status.plan.flowerDay;
  const flowerPrompt = !g.floweringStart && status.day >= F - 4 ? `
    <div class="reminder warn">
      <span class="ico">🌸</span>
      <div>
        ${g.type === 'photo'
          ? '<b>Já virou a luz pra 12/12?</b> Marque a data — o cronograma de floração passa a contar dela.'
          : '<b>Viu os primeiros pistilos?</b> Autoflorescente floresce quando quer — marque a data e o cronograma se ajusta à sua planta.'}
        <br><button class="btn btn-sm" id="set-flower" style="margin-top:10px">Marcar data</button>
      </div>
    </div>` : '';

  const harvestCard = status.harvestReady ? `
    <div class="card accent" style="border-left-color:var(--amber)">
      <div class="card-label mature">Colheita &amp; pós-colheita</div>
      <p>Você entrou na janela de colheita. Abra o módulo pra seguir o passo a passo
         (colher → trim → secagem → cura) e registrar o peso final.</p>
      <button class="btn btn-sm" id="go-harvest" style="margin-top:12px">Abrir módulo de colheita →</button>
    </div>` : '';

  const h = latestHeight();
  const rec = waterForHeight(h);
  const waterVal = rec ? rec.label : wk.water;
  const waterNote = rec ? `pra ${h} cm · ${rec.where}` : 'pelo peso do vaso';

  const dwarf = f && f.observed && h != null && h < DWARF_MAX_HEIGHT ? `
    <div class="card accent" style="border-left-color:var(--amber)">
      <div class="card-label mature">🌱 ${esc(DWARF_GUIDANCE.title)}</div>
      <p style="margin-bottom:10px">${esc(DWARF_GUIDANCE.what)}</p>
      <ul style="margin:0 0 10px 18px;font-size:14px;line-height:1.6">
        ${DWARF_GUIDANCE.do.map((t) => `<li>${esc(t)}</li>`).join('')}
      </ul>
      <p style="font-size:13px;color:var(--muted)">${esc(DWARF_GUIDANCE.expect)}</p>
    </div>` : '';

  return `
    <div class="hero">
      <div class="day-num">${status.day}<small> / ~${status.totalDays}</small></div>
      <div class="phase-line stage-${status.stage}">${esc(status.phase)}</div>
      ${flowerLine}
      <div class="to-harvest">${harvestLine}</div>
      <div class="progress"><span class="${barColor}" style="width:${status.progress}%"></span></div>
      <div class="progress-legend"><span>Plantio</span><span>${STAGE_LABEL[status.stage]}</span><span>Colheita</span></div>
    </div>

    ${flowerPrompt}
    ${reminders.map(reminderHtml).join('')}
    ${harvestCard}
    ${dwarf}

    <div class="card accent">
      <div class="card-label">Fazer hoje</div>
      <p>${esc(wk.do)}</p>
    </div>
    <div class="card accent" style="border-left-color:var(--green)">
      <div class="card-label veg">Observe</div>
      <p>${esc(wk.observe)}</p>
    </div>

    <div class="grid-2">
      <div class="mini">
        <div class="card-label">💡 Luz</div>
        <div class="mono-val">${esc(wk.light)}</div>
        <p style="font-size:12px;color:var(--muted);margin-top:4px">LED → topo · mín. ${g.lightMinCm} cm</p>
      </div>
      <div class="mini">
        <div class="card-label veg">💧 Rega</div>
        <div class="mono-val" style="font-size:15px">${esc(waterVal)}</div>
        <p style="font-size:12px;color:var(--muted);margin-top:4px">${esc(waterNote)}</p>
      </div>
    </div>

    <button class="fab" id="add-entry">${hasToday ? '✎ Editar registro de hoje' : '+ Registrar hoje'}</button>
    ${legalFooter()}`;
}

function reminderHtml(r) {
  return `<div class="reminder ${r.level}"><span class="ico">${r.icon}</span><div>${esc(r.text)}</div></div>`;
}

function mountToday() {
  const add = document.getElementById('add-entry');
  if (add) add.onclick = () => openEntryForm(todayStr());
  const gh = document.getElementById('go-harvest');
  if (gh) gh.onclick = () => { S.tab = 'harvest'; renderView(); };
  const sf = document.getElementById('set-flower');
  if (sf) sf.onclick = () => openSetup('edit');
}

// =============================================================================
//  VIEW: REGISTRO DIÁRIO
// =============================================================================
let formState = null; // { date, existingPhotos:[{data}], newFiles:[{file,url}] }

function openEntryForm(date) {
  S.tab = 'entry';
  S._entryDate = date;
  renderView();
}

function renderEntryForm() {
  const v = document.getElementById('view');
  const date = S._entryDate || todayStr();
  const st = STATUS(new Date(date + 'T12:00:00'));
  const wk = st.schedule;
  const fw = st.flower ? st.flower.week : null;
  const existing = S.entries[date] || null;

  formState = {
    date,
    existingPhotos: existing && Array.isArray(existing.photos) ? [...existing.photos] : [],
    newFiles: [],
  };

  const checks = quickChecks(S.config, st);
  const showTrich = fw && fw >= 3;
  const ec = existing || {};
  const tri = ec.trichomes || {};
  const recWater = waterForHeight(ec.plantHeight ?? latestHeight());

  v.innerHTML = `
    <button class="btn btn-ghost btn-sm" id="back-btn" style="margin-bottom:14px">← Voltar</button>
    <h2 class="section-title">${existing ? 'Editar registro' : 'Registrar dia'}</h2>
    <div class="section-sub">Dia ${st.day}${fw ? ` · Floração dia ${st.flower.flowerDay} (sem ${fw})` : ''} · ${esc(st.phase)}</div>

    <form id="entry-form">
      <div class="field">
        <label>Data</label>
        <input type="date" id="e-date" value="${date}" max="${todayStr()}">
        <div class="hint">Pode registrar um dia anterior.</div>
      </div>

      <div class="field">
        <label>Regou hoje?</label>
        <div class="seg veg" id="e-watered">
          <button type="button" data-v="1" class="${ec.watered ? 'on' : ''}">Sim</button>
          <button type="button" data-v="0" class="${ec.watered === false ? 'on' : ''}">Não</button>
        </div>
      </div>

      <div class="form-row">
        <div class="field">
          <label>Volume (ml)</label>
          <input type="number" id="e-waterml" inputmode="numeric" value="${ec.waterMl ?? ''}" placeholder="${recWater ? recWater.mid : (wk.waterMl || 300)}">
          ${recWater ? `<div class="hint">Pro porte atual: ${esc(recWater.label)}</div>` : ''}
        </div>
        <div class="field">
          <label>Altura planta (cm)</label>
          <input type="number" id="e-height" inputmode="decimal" value="${ec.plantHeight ?? ''}" placeholder="ex: 25">
        </div>
      </div>

      <div class="form-row">
        <div class="field">
          <label>Altura da luz (cm)</label>
          <input type="number" id="e-light" inputmode="decimal" value="${ec.lightHeight ?? ''}" placeholder="${wk.lightCm}">
          <div class="hint">Recomendado agora: ${esc(wk.light)}</div>
        </div>
        <div class="field">
          <label>Temp. (°C)</label>
          <input type="number" id="e-temp" inputmode="decimal" value="${ec.temp ?? ''}" placeholder="ex: 25">
        </div>
      </div>

      <div class="form-row">
        <div class="field">
          <label>Umidade (%)</label>
          <input type="number" id="e-hum" inputmode="numeric" value="${ec.humidity ?? ''}" placeholder="ex: 55">
        </div>
        <div class="field">
          <label>Topos / sites</label>
          <input type="number" id="e-sites" inputmode="numeric" value="${ec.sites ?? ''}" placeholder="ex: 5">
        </div>
      </div>

      ${checks.length ? `
      <div class="field">
        <label>Feitos hoje</label>
        <div class="checks">
          ${checks.map((c) => `
            <label class="check ${ec.checks && ec.checks[c.key] ? 'on' : ''}">
              <input type="checkbox" data-check="${c.key}" ${ec.checks && ec.checks[c.key] ? 'checked' : ''}>
              <span>${esc(c.label)}</span>
            </label>`).join('')}
        </div>
      </div>` : ''}

      ${showTrich ? `
      <div class="field">
        <label>Tricomas (% aproximado)</label>
        <div class="trichome-picker">
          <div class="tri"><div class="swatch sw-clear"></div><input type="number" id="tri-clear" min="0" max="100" placeholder="0" value="${tri.clear ?? ''}"><label>Transparente</label></div>
          <div class="tri"><div class="swatch sw-milky"></div><input type="number" id="tri-milky" min="0" max="100" placeholder="0" value="${tri.milky ?? ''}"><label>Leitoso</label></div>
          <div class="tri"><div class="swatch sw-amber"></div><input type="number" id="tri-amber" min="0" max="100" placeholder="0" value="${tri.amber ?? ''}"><label>Âmbar</label></div>
        </div>
      </div>` : ''}

      <div class="field">
        <label>Fotos</label>
        <div class="photo-input" id="photo-input"></div>
        <input type="file" id="photo-file" accept="image/*" multiple capture="environment" class="hidden">
        <div class="hint">Comprimidas automaticamente (máx. 1080px) e guardadas na nuvem.</div>
      </div>

      <div class="field">
        <label>Notas</label>
        <textarea id="e-notes" placeholder="Observações do dia…">${esc(ec.notes || '')}</textarea>
      </div>

      <div class="form-actions">
        ${existing ? '<button type="button" class="btn btn-ghost" id="del-btn" style="flex:0 0 auto">🗑</button>' : ''}
        <button type="submit" class="btn" id="save-btn">Salvar na nuvem</button>
      </div>
    </form>
    ${legalFooter()}`;

  document.getElementById('back-btn').onclick = () => { S.tab = 'today'; renderView(); };
  const wateredSeg = document.getElementById('e-watered');
  wateredSeg.querySelectorAll('button').forEach((b) => {
    b.onclick = () => { wateredSeg.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); };
  });
  v.querySelectorAll('.check input').forEach((cb) => {
    cb.onchange = () => cb.closest('.check').classList.toggle('on', cb.checked);
  });
  renderPhotoInput();
  document.getElementById('photo-file').onchange = onPickPhotos;
  const del = document.getElementById('del-btn');
  if (del) del.onclick = () => confirmDelete(date);
  document.getElementById('entry-form').onsubmit = (e) => { e.preventDefault(); saveCurrentEntry(); };
}

function renderPhotoInput() {
  const box = document.getElementById('photo-input');
  if (!box) return;
  const existingHtml = formState.existingPhotos.map((p, i) => `
    <div class="photo-thumb"><img src="${esc(photoSrc(p))}" alt="foto">
      <button type="button" class="rm" data-rm-existing="${i}">×</button></div>`).join('');
  const newHtml = formState.newFiles.map((f, i) => `
    <div class="photo-thumb"><img src="${esc(f.url)}" alt="nova foto">
      <button type="button" class="rm" data-rm-new="${i}">×</button></div>`).join('');
  box.innerHTML = existingHtml + newHtml + '<button type="button" class="photo-add" id="photo-add">+</button>';
  document.getElementById('photo-add').onclick = () => document.getElementById('photo-file').click();
  box.querySelectorAll('[data-rm-existing]').forEach((b) => { b.onclick = () => {
    formState.existingPhotos.splice(+b.dataset.rmExisting, 1); renderPhotoInput();
  }; });
  box.querySelectorAll('[data-rm-new]').forEach((b) => { b.onclick = () => {
    const i = +b.dataset.rmNew;
    URL.revokeObjectURL(formState.newFiles[i].url);
    formState.newFiles.splice(i, 1); renderPhotoInput();
  }; });
}

function onPickPhotos(e) {
  Array.from(e.target.files || []).forEach((file) => {
    if (file.type.startsWith('image/')) formState.newFiles.push({ file, url: URL.createObjectURL(file) });
  });
  e.target.value = '';
  renderPhotoInput();
}

async function saveCurrentEntry() {
  const btn = document.getElementById('save-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Salvando…';
  S.syncing = true; updateSync();

  const date = document.getElementById('e-date').value || formState.date;
  const wateredOn = document.querySelector('#e-watered button.on');
  const num = (id) => { const v = document.getElementById(id).value; return v === '' ? null : Number(v); };
  const checks = {};
  document.querySelectorAll('.check input[data-check]').forEach((cb) => { checks[cb.dataset.check] = cb.checked; });
  let trichomes = null;
  if (document.getElementById('tri-clear')) {
    trichomes = { clear: num('tri-clear'), milky: num('tri-milky'), amber: num('tri-amber') };
    if (trichomes.clear == null && trichomes.milky == null && trichomes.amber == null) trichomes = null;
  }

  try {
    const prepared = [];
    for (const nf of formState.newFiles) prepared.push(await preparePhoto(nf.file));
    const entry = {
      date,
      watered: wateredOn ? wateredOn.dataset.v === '1' : null,
      waterMl: num('e-waterml'),
      plantHeight: num('e-height'),
      lightHeight: num('e-light'),
      temp: num('e-temp'),
      humidity: num('e-hum'),
      sites: num('e-sites'),
      notes: document.getElementById('e-notes').value.trim(),
      checks,
      trichomes,
      photos: [...formState.existingPhotos, ...prepared],
    };

    // 1 documento do Firestore ≤ 1 MiB: avisa em vez de falhar sem explicar.
    if (new Blob([JSON.stringify(entry)]).size > 1_000_000) {
      S.syncing = false; updateSync();
      toast('As fotos deste dia ficaram grandes demais. Remova uma e salve de novo.', 'err');
      btn.disabled = false; btn.textContent = 'Salvar na nuvem';
      return;
    }

    await saveEntry(S.uid, S.growId, entry);
    S.entries[date] = { ...entry, growId: S.growId };
    S.syncing = false; updateSync();
    toast('Registro salvo e sincronizado ✓', 'ok');
    S.tab = 'today'; renderView();
  } catch (err) {
    console.error(err);
    S.syncing = false; updateSync();
    toast('Erro ao salvar. Verifique a conexão.', 'err');
    btn.disabled = false; btn.textContent = 'Salvar na nuvem';
  }
}

function confirmDelete(date) {
  openSheet(`
    <h3>Apagar registro?</h3>
    <p style="color:var(--muted);margin-bottom:16px">O registro de ${fmtBR(date)} e suas fotos serão removidos da nuvem. Não dá pra desfazer.</p>
    <button class="btn" id="do-del" style="background:var(--danger)">Apagar</button>
    <button class="btn btn-ghost" id="cancel-del" style="margin-top:10px">Cancelar</button>`);
  document.getElementById('cancel-del').onclick = closeSheet;
  document.getElementById('do-del').onclick = async () => {
    closeSheet();
    try {
      await deleteEntry(S.uid, S.growId, date);
      delete S.entries[date];
      toast('Registro apagado', 'ok');
      S.tab = 'history'; renderView();
    } catch (err) { toast('Erro ao apagar', 'err'); }
  };
}

// =============================================================================
//  VIEW: HISTÓRICO
// =============================================================================
function viewHistory() {
  const dates = Object.keys(S.entries).sort();
  if (!dates.length) {
    return `<h2 class="section-title">Histórico</h2>
      <div class="empty"><span class="big">📖</span>Nenhum registro ainda.<br>Toque em "Registrar hoje" na aba Hoje.</div>${legalFooter()}`;
  }

  const gallery = [];
  dates.forEach((d) => (S.entries[d].photos || []).forEach((p) => gallery.push({ ...p, date: d })));

  // Agrupa por fase do cultivo naquela data (veg) ou semana de floração.
  const groups = [];
  const byKey = {};
  dates.forEach((d) => {
    const st = STATUS(new Date(d + 'T12:00:00'));
    const key = st.flower ? `f${st.flower.week}` : st.schedule.key;
    const label = st.flower ? `Flor · semana ${st.flower.week}` : st.schedule.phase;
    if (!byKey[key]) { byKey[key] = { key, label, stage: st.stage, items: [] }; groups.push(byKey[key]); }
    byKey[key].items.push({ date: d, day: st.day });
  });

  const galleryHtml = gallery.length ? `
    <div class="card">
      <div class="card-label">🎞️ Galeria de evolução</div>
      <div class="gallery-strip" id="gallery-strip">
        ${gallery.map((g, i) => `<img src="${esc(photoSrc(g))}" data-gi="${i}" alt="${esc(g.date)}">`).join('')}
      </div>
      <p style="font-size:12px;color:var(--muted)">Role para ver a planta crescendo · toque para ampliar</p>
    </div>` : '';

  window._gallery = gallery;
  const groupsHtml = groups.reverse().map((g) => `
    <div class="week-group">
      <div class="week-head"><span class="stage-${g.stage}">${esc(g.label)}</span><span class="bar"></span></div>
      ${g.items.sort((a, b) => (a.date < b.date ? 1 : -1)).map((it) => entryCard(S.entries[it.date], it.day)).join('')}
    </div>`).join('');

  return `<h2 class="section-title">Histórico</h2>
    <div class="section-sub">${dates.length} ${dates.length === 1 ? 'dia registrado' : 'dias registrados'}</div>
    ${galleryHtml}${groupsHtml}${legalFooter()}`;
}

function entryCard(e, day) {
  const stats = [];
  if (e.watered != null) stats.push(`<span>💧 ${e.watered ? (e.waterMl ? `<b>${e.waterMl}</b> ml` : 'regou') : 'sem rega'}</span>`);
  if (e.plantHeight != null) stats.push(`<span>🌱 <b>${e.plantHeight}</b> cm</span>`);
  if (e.lightHeight != null) stats.push(`<span>💡 <b>${e.lightHeight}</b> cm</span>`);
  if (e.temp != null) stats.push(`<span>🌡 <b>${e.temp}</b>°C</span>`);
  if (e.humidity != null) stats.push(`<span>💦 <b>${e.humidity}</b>%</span>`);
  if (e.sites != null) stats.push(`<span>🌸 <b>${e.sites}</b> topos</span>`);
  if (e.trichomes && (e.trichomes.milky || e.trichomes.amber || e.trichomes.clear))
    stats.push(`<span>🔬 ${e.trichomes.clear || 0}/${e.trichomes.milky || 0}/${e.trichomes.amber || 0}</span>`);

  const chips = e.checks ? Object.entries(e.checks).filter(([, v]) => v)
    .map(([k]) => `<span class="chip">✓ ${esc(CHECK_CHIP[k] || k)}</span>`).join('') : '';
  const thumbs = (e.photos || []).map((p) => {
    const src = photoSrc(p);
    const gi = (window._gallery || []).findIndex((g) => photoSrc(g) === src);
    return `<img src="${esc(src)}" data-gi="${gi}" alt="foto">`;
  }).join('');

  return `
    <div class="entry" data-edit="${esc(e.date)}">
      <div class="entry-top"><span class="date">${fmtBR(e.date)}</span><span class="daytag mono">Dia ${day}</span></div>
      ${stats.length ? `<div class="entry-stats">${stats.join('')}</div>` : ''}
      ${chips ? `<div class="entry-chips">${chips}</div>` : ''}
      ${e.notes ? `<div class="entry-notes">${esc(e.notes)}</div>` : ''}
      ${thumbs ? `<div class="entry-thumbs">${thumbs}</div>` : ''}
    </div>`;
}

function mountHistory() {
  document.querySelectorAll('.entry-thumbs img, .gallery-strip img').forEach((img) => {
    img.onclick = (ev) => { ev.stopPropagation(); openLightbox(+img.dataset.gi); };
  });
  document.querySelectorAll('.entry[data-edit]').forEach((el) => {
    el.onclick = () => openEntryForm(el.dataset.edit);
  });
}

function openLightbox(startIndex) {
  const gallery = window._gallery || [];
  if (!gallery.length || startIndex < 0) return;
  let i = startIndex;
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  const draw = () => {
    const g = gallery[i];
    lb.innerHTML = `
      <button class="lb-x">×</button>
      ${i > 0 ? '<button class="lb-nav lb-prev">‹</button>' : ''}
      <img src="${esc(photoSrc(g))}" alt="">
      ${i < gallery.length - 1 ? '<button class="lb-nav lb-next">›</button>' : ''}
      <div class="lb-cap">${fmtBR(g.date)} · ${i + 1}/${gallery.length}</div>`;
    lb.querySelector('.lb-x').onclick = () => lb.remove();
    const prev = lb.querySelector('.lb-prev'); if (prev) prev.onclick = () => { i--; draw(); };
    const next = lb.querySelector('.lb-next'); if (next) next.onclick = () => { i++; draw(); };
  };
  lb.onclick = (e) => { if (e.target === lb) lb.remove(); };
  document.body.appendChild(lb); draw();
}

// =============================================================================
//  VIEW: GRÁFICOS (Chart.js global)
// =============================================================================
function viewCharts() {
  const dates = Object.keys(S.entries).sort();
  if (dates.length < 2) {
    return `<h2 class="section-title">Gráficos</h2>
      <div class="empty"><span class="big">📈</span>Registre pelo menos 2 dias<br>para ver os gráficos de evolução.</div>${legalFooter()}`;
  }
  return `<h2 class="section-title">Gráficos</h2>
    <div class="section-sub">Evolução ao longo do cultivo</div>
    <div class="chart-card"><h3>🌱 Altura da planta (cm)</h3><canvas id="chart-height"></canvas></div>
    <div class="chart-card"><h3>🌡 Temperatura &amp; umidade</h3><canvas id="chart-env"></canvas></div>
    ${legalFooter()}`;
}

function mountCharts() {
  if (typeof Chart === 'undefined') return;
  const dates = Object.keys(S.entries).sort();
  const labels = dates.map((d) => fmtBR(d).slice(0, 5));
  const grid = 'rgba(255,255,255,.06)', tick = '#9a9a9a';
  const font = { family: 'JetBrains Mono', size: 10 };
  const val = (f) => dates.map((d) => (S.entries[d][f] != null && S.entries[d][f] !== '' ? Number(S.entries[d][f]) : null));
  const base = {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: { legend: { labels: { color: tick, font: { family: 'JetBrains Mono' } } } },
  };

  new Chart(document.getElementById('chart-height'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'Altura (cm)', data: val('plantHeight'), borderColor: '#7cc36a', backgroundColor: 'rgba(124,195,106,.15)', tension: .3, spanGaps: true, fill: true, pointRadius: 3 }] },
    options: { ...base, scales: { x: { ticks: { color: tick, font }, grid: { color: grid } }, y: { ticks: { color: tick, font }, grid: { color: grid } } } },
  });
  new Chart(document.getElementById('chart-env'), {
    type: 'line',
    data: { labels, datasets: [
      { label: 'Temp (°C)', data: val('temp'), borderColor: '#d9a441', backgroundColor: 'transparent', tension: .3, spanGaps: true, pointRadius: 3, yAxisID: 'y' },
      { label: 'Umidade (%)', data: val('humidity'), borderColor: '#e6398a', backgroundColor: 'transparent', tension: .3, spanGaps: true, pointRadius: 3, yAxisID: 'y1' },
    ] },
    options: { ...base, scales: {
      x: { ticks: { color: tick, font }, grid: { color: grid } },
      y: { position: 'left', ticks: { color: '#d9a441', font }, grid: { color: grid } },
      y1: { position: 'right', ticks: { color: '#e6398a', font }, grid: { drawOnChartArea: false } },
    } },
  });
}

// =============================================================================
//  VIEW: CRONOGRAMA (gerado a partir da configuração)
// =============================================================================
function viewSchedule() {
  const status = STATUS();
  const g = status.grow;
  const f = status.flower;
  const plan = status.plan;
  const flowerStart = f ? f.startDate : dateOfDay(g.plantingDate, plan.flowerDay, g.dayOffset);
  const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return fmtBR(fmtDate(d)); };

  const card = (p, cur, dates) => `
    <div class="timeline-week ${cur ? 'current' : ''}">
      <div class="tw-head">
        <span class="phase stage-${p.stage}">${esc(p.phase)}</span>
        ${cur ? '<span class="now">AGORA</span>' : ''}
        <span class="days">${dates}</span>
      </div>
      <div class="tw-row"><b>Fazer</b>${esc(p.do)}</div>
      <div class="tw-row"><b>Observe</b>${esc(p.observe)}</div>
      <div class="tw-row"><b>Luz</b>${esc(p.light)}</div>
    </div>`;

  // Fases antes da floração (encerram onde a floração real começou, se houver).
  const preEnd = f && f.observed ? dayNumber(g.plantingDate, parseDate(flowerStart), g.dayOffset) - 1 : Infinity;
  const pre = plan.pre.filter((p) => p.dayStart <= preEnd).map((p) => {
    const end = Math.min(p.dayEnd, preEnd);
    const cur = !f && status.schedule.key === p.key;
    return card(p, cur, `dias ${p.dayStart}–${end}`);
  }).join('');

  const flowerWeeks = [];
  for (let w = 1; w <= g.flowerWeeks; w++) {
    const p = plan.flower[w - 1];
    const cur = f && Math.min(f.week, g.flowerWeeks) === w;
    flowerWeeks.push(card({ ...p, phase: `Flor sem ${w} · ${p.phase.replace(/^Floração · /, '')}` }, cur,
      `${addDays(flowerStart, (w - 1) * 7)} – ${addDays(flowerStart, w * 7 - 1)}`));
  }

  return `<h2 class="section-title">Cronograma</h2>
    <div class="section-sub">${esc(g.strain)} · ${TYPE_LABEL[g.type]} · ${g.type === 'auto' ? `~${g.cycleDays} dias` : `veg ${g.vegWeeks} sem`} · flor ${g.flowerWeeks} sem</div>
    <p class="note-block">Gerado a partir da configuração deste cultivo.
      ${f && f.observed ? `A floração conta da data que você marcou (${fmtBR(flowerStart)}).` : 'A floração é a prevista pelo plano até você marcar a data real.'}
      <button type="button" id="sched-edit" style="background:none;border:none;color:var(--magenta);font-weight:700;padding:0">Ajustar</button></p>
    <h3 style="margin:8px 0 8px">🌱 Até a floração</h3>
    ${pre || '<p class="note-block">—</p>'}
    <h3 style="margin:20px 0 8px">🌸 Floração</h3>
    ${flowerWeeks.join('')}
    ${legalFooter()}`;
}

// =============================================================================
//  VIEW: REFERÊNCIAS
// =============================================================================
function viewRef() {
  const status = STATUS();
  const g = status.grow;
  const m = g.lightMinCm;
  const curSize = waterForHeight(latestHeight());
  const stagePhase = status.flower ? 2 : status.day <= 14 ? 0 : 1;
  const lightRows = [
    ['Plântula / muda', `~${m + 15} cm`, PPFD_REF.seedling],
    ['Vegetativo', `~${m + 5}–${m + 10} cm`, PPFD_REF.veg],
    ['Floração', `~${m} cm`, PPFD_REF.flower],
  ];
  const ficha = [
    ['Strain', [g.strain, g.breeder].filter(Boolean).join(' · ')],
    ['Tipo', TYPE_LABEL[g.type]],
    ['Ciclo', g.type === 'auto' ? `~${g.cycleDays} dias · floração ~${g.flowerWeeks} sem` : `veg ${g.vegWeeks} sem + floração ${g.flowerWeeks} sem`],
    ['Plantio', g.plantingDate ? fmtBR(g.plantingDate) : ''],
    ['Vaso', g.potLiters ? `${g.potLiters} L` : ''],
    ['Substrato', g.medium],
    ['Espaço', g.space],
    ['Luz', [g.lightWatts ? `${g.lightWatts} W` : '', `mín. ${m} cm`].filter(Boolean).join(' · ')],
    ['Treino', TRAINING_LABEL[g.training]],
    ['Adubação', FEEDING_LABEL[g.feeding]],
    ['Meta', g.goalGrams ? `${g.goalGrams} g secos` : ''],
  ].filter(([, val]) => val);

  return `<h2 class="section-title">Referências</h2>
    <div class="section-sub">Tabelas de consulta rápida</div>

    <h3 style="margin:6px 0 10px">💧 Rega pelo porte da planta</h3>
    <div class="tbl-wrap"><table class="ref">
      <thead><tr><th>Altura</th><th>Volume</th><th>Onde molhar</th></tr></thead>
      <tbody>${SIZE_WATERING.map((r, i) => {
        const cur = curSize && curSize.maxHeight === r.maxHeight;
        const prev = i === 0 ? 0 : SIZE_WATERING[i - 1].maxHeight;
        const range = r.maxHeight >= 999 ? `acima de ${prev} cm` : `${prev + 1}–${r.maxHeight} cm`;
        return `<tr class="${cur ? 'current' : ''}"><td class="wk">${range}</td><td>${esc(r.label)}</td><td>${esc(r.where)}</td></tr>`;
      }).join('')}</tbody>
    </table></div>
    <p class="note-block">Mudas (até ~2 semanas): só ~50–150 ml, ao redor do caule.${g.potLiters ? ` Vaso de ${g.potLiters} L: quanto maior o vaso em relação à planta, mais tempo ele leva pra secar.` : ''}</p>
    <div class="golden">${esc(WATERING_GOLDEN)}</div>

    <h3 style="margin:6px 0 10px">💡 Luz — altura e PPFD-alvo</h3>
    <div class="tbl-wrap"><table class="ref">
      <thead><tr><th>Fase</th><th>Distância (LED→topo)</th><th>PPFD-alvo</th></tr></thead>
      <tbody>${lightRows.map((r, i) => `<tr class="${i === stagePhase ? 'current' : ''}"><td class="wk">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="note-block">Distâncias calculadas a partir do mínimo configurado (${m} cm). ${esc(LIGHT_NOTE)}</div>

    <h3 style="margin:6px 0 10px">🩺 Troubleshooting</h3>
    <input type="text" id="ts-filter" style="width:100%;background:var(--surface);border:1px solid var(--line);border-radius:10px;color:var(--text);padding:11px 13px;margin-bottom:12px;font-size:16px" placeholder="Filtrar por sintoma / causa…">
    <div class="tbl-wrap"><table class="ref" id="ts-table">
      <thead><tr><th>Sintoma</th><th>Causa provável</th><th>O que fazer</th></tr></thead>
      <tbody>${TROUBLESHOOTING.map((t) => `<tr><td>${esc(t.symptom)}</td><td>${esc(t.cause)}</td><td>${esc(t.action)}</td></tr>`).join('')}</tbody>
    </table></div>

    <h3 style="margin:6px 0 10px">🪢 Treino — ${esc(TRAINING_LABEL[g.training])}</h3>
    <div class="note-block">${esc(TRAINING_SUMMARY[g.training])}</div>

    <h3 style="margin:6px 0 10px">🌿 Ficha do cultivo</h3>
    <div class="card">
      ${ficha.map(([k, v]) => `<div class="tw-row"><b>${esc(k)}</b>${esc(v)}</div>`).join('')}
      <button class="btn btn-ghost btn-sm" id="ref-edit" style="margin-top:8px">Editar configuração</button>
    </div>
    ${legalFooter()}`;
}

function mountRef() {
  const filter = document.getElementById('ts-filter');
  if (filter) filter.oninput = () => {
    const q = filter.value.toLowerCase();
    document.querySelectorAll('#ts-table tbody tr').forEach((tr) => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
  const ed = document.getElementById('ref-edit');
  if (ed) ed.onclick = () => openSetup('edit');
}

// Botão "Ajustar" da aba Guia (montado por delegação, a view é só HTML).
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'sched-edit') openSetup('edit');
});

// =============================================================================
//  VIEW: COLHEITA & PÓS-COLHEITA
// =============================================================================
function viewHarvest() {
  const ph = S.config.postHarvest || {};
  const goal = S.config.goalGrams;

  const steps = ['Colher', 'Buckear', 'Trim', 'Secagem', 'Cura'];
  const stepFlow = steps.map((s, i) => {
    const done = ph.stepDone && ph.stepDone[i];
    return `<span class="step ${done ? 'done' : ''}" data-step="${i}">${s}</span>` + (i < steps.length - 1 ? '<span class="arrow">→</span>' : '');
  }).join('');

  const dryDays = daysSince(ph.dryStart);
  const cureDays = daysSince(ph.cureStart);
  const cureBurp = cureDays != null && cureDays < 7;
  const dryTracker = ph.dryStart ? `
    <div class="tracker">
      <div class="count">${dryDays}<small> dias</small></div>
      <div class="rangelabel">de 7–14 dias · início ${fmtBR(ph.dryStart)}</div>
    </div>` : '';
  const cureTracker = ph.cureStart ? `
    <div class="tracker">
      <div class="count">${cureDays}<small> dias</small></div>
      <div class="rangelabel">mínimo 14–28 dias · início ${fmtBR(ph.cureStart)}</div>
    </div>
    ${cureBurp ? '<div class="reminder warn"><span class="ico">🫙</span><div>1ª semana de cura: faça o <b>burping</b> (abrir os potes) todo dia por alguns minutos.</div></div>' : ''}` : '';

  const w = ph.finalWeight;
  const pct = w && goal ? Math.min(100, Math.round((w / goal) * 100)) : 0;
  const h = latestHeight();
  const est = yieldForHeight(h);
  const estCard = est ? `
    <div class="card">
      <div class="card-label mature">📐 Expectativa pelo porte atual</div>
      <p style="font-size:14px;line-height:1.6">
        Com <b>${h} cm</b>, uma estimativa grosseira de peso seco fica em <b>${esc(est)}</b>${goal ? ` (meta: ${goal} g)` : ''}.
        Depende muito da genética, da luz e do número de topos — use só como régua.
      </p>
    </div>` : '';

  return `<h2 class="section-title">Colheita &amp; pós-colheita</h2>
    <div class="section-sub">colher → trim → secagem → cura</div>
    ${estCard}
    <div class="step-flow">${stepFlow}</div>
    <p style="font-size:12px;color:var(--muted);margin-bottom:18px">Toque nas etapas para marcar o que já foi feito.</p>

    <div class="card">
      <div class="card-label mature">🌬 Secagem</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:12px">Escuro · 18–22 °C · 50–60% umidade · ar suave · 7–14 dias até os galhos finos estalarem.</p>
      ${dryTracker}
      <div class="field" style="margin-top:10px">
        <label>Início da secagem</label>
        <input type="date" id="dry-start" value="${ph.dryStart || ''}" max="${todayStr()}">
      </div>
    </div>

    <div class="card">
      <div class="card-label mature">🫙 Cura</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:12px">Potes de vidro ~⅔ cheios · burping diário na 1ª semana, depois a cada poucos dias · mínimo 2–4 semanas · alvo 58–62% de umidade.</p>
      ${cureTracker}
      <div class="field" style="margin-top:10px">
        <label>Início da cura</label>
        <input type="date" id="cure-start" value="${ph.cureStart || ''}" max="${todayStr()}">
      </div>
    </div>

    <div class="card">
      <div class="card-label mature">⚖️ Peso final seco</div>
      <div class="field" style="margin-top:6px">
        <label>Gramas secos colhidos</label>
        <input type="number" id="final-weight" inputmode="decimal" value="${w ?? ''}" placeholder="ex: 40">
      </div>
      ${goal ? `
      <div class="goal-compare">
        <div class="goal-bar">
          <div class="track"><div class="fill" style="width:${pct}%">${pct}%</div></div>
          <p style="font-size:12px;color:var(--muted);margin-top:6px">da meta de ${goal} g</p>
        </div>
        <div class="goal-num">${w != null ? w : '—'}<small> / ${goal} g</small></div>
      </div>` : '<p class="hint">Defina uma meta em Configurar cultivo pra comparar.</p>'}
      <button class="btn" id="save-harvest" style="margin-top:16px">Salvar</button>
    </div>
    ${legalFooter()}`;
}

function mountHarvest() {
  document.querySelectorAll('.step-flow .step').forEach((el) => {
    el.onclick = async () => {
      const i = +el.dataset.step;
      const ph = { ...(S.config.postHarvest || {}) };
      ph.stepDone = { ...(ph.stepDone || {}) };
      ph.stepDone[i] = !ph.stepDone[i];
      el.classList.toggle('done', ph.stepDone[i]);
      try { await saveActiveGrow({ postHarvest: ph }); } catch { toast('Erro ao salvar', 'err'); }
    };
  });
  const save = document.getElementById('save-harvest');
  if (save) save.onclick = async () => {
    const ph = { ...(S.config.postHarvest || {}) };
    ph.dryStart = document.getElementById('dry-start').value || null;
    ph.cureStart = document.getElementById('cure-start').value || null;
    const w = document.getElementById('final-weight').value;
    ph.finalWeight = w === '' ? null : Number(w);
    save.disabled = true; save.innerHTML = '<span class="spin"></span>';
    try { await saveActiveGrow({ postHarvest: ph }); toast('Salvo na nuvem ✓', 'ok'); renderView(); }
    catch { toast('Erro ao salvar', 'err'); save.disabled = false; save.textContent = 'Salvar'; }
  };
}

// =============================================================================
//  MEUS CULTIVOS (trocar / criar / excluir)
// =============================================================================
function openGrows() {
  const ids = sortedGrowIds();
  openSheet(`
    <h3>Meus cultivos</h3>
    ${ids.map((id) => {
      const g = S.grows[id];
      const st = computeStatus(g);
      const n = S.allEntries.filter((e) => (e.growId || LEGACY_GROW_ID) === id).length;
      return `<div class="menu-item" style="justify-content:space-between">
        <button data-grow="${id}" style="flex:1;text-align:left;background:none;border:none;color:var(--text);padding:0;font-size:15px">
          ${id === S.growId ? '✅ ' : ''}<b>${esc(growTitle(g))}</b><br>
          <span class="mono" style="font-size:11px;color:var(--muted)">${esc(TYPE_LABEL[g.type])} · plantio ${g.plantingDate ? fmtBR(g.plantingDate) : '—'} · dia ${st.day} · ${n} registros</span>
        </button>
        <button data-del-grow="${id}" aria-label="Excluir" style="background:none;border:none;color:var(--faint);font-size:18px;padding:6px">🗑</button>
      </div>`;
    }).join('')}
    <button class="btn" id="g-new" style="margin-top:16px">+ Novo cultivo</button>`);

  document.querySelectorAll('[data-grow]').forEach((b) => {
    b.onclick = async () => {
      const id = b.dataset.grow;
      closeSheet();
      if (id === S.growId) return;
      S.rawDoc = { ...(S.rawDoc || {}), activeGrowId: id };
      applyData(); S.tab = 'today'; S.setupMode = null; renderApp();
      try { await setActiveGrow(S.uid, id); } catch { toast('Erro ao trocar de cultivo', 'err'); }
    };
  });
  document.querySelectorAll('[data-del-grow]').forEach((b) => { b.onclick = () => confirmDeleteGrow(b.dataset.delGrow); });
  document.getElementById('g-new').onclick = () => { closeSheet(); openSetup('new'); };
}

function confirmDeleteGrow(id) {
  const g = S.grows[id];
  const entryIds = S.allEntries.filter((e) => (e.growId || LEGACY_GROW_ID) === id).map((e) => e._id);
  openSheet(`
    <h3>Excluir "${esc(growTitle(g))}"?</h3>
    <p style="color:var(--muted);margin-bottom:12px">Isso apaga a configuração e os <b>${entryIds.length} registros</b> (com fotos) deste cultivo. Não dá pra desfazer — se quiser guardar, exporte um backup antes.</p>
    <div class="field"><label>Digite EXCLUIR pra confirmar</label><input type="text" id="del-confirm" autocomplete="off"></div>
    <button class="btn" id="do-del-grow" style="background:var(--danger)" disabled>Excluir cultivo</button>
    <button class="btn btn-ghost" id="cancel-del-grow" style="margin-top:10px">Cancelar</button>`);
  const inp = document.getElementById('del-confirm');
  const btn = document.getElementById('do-del-grow');
  inp.oninput = () => { btn.disabled = inp.value.trim().toUpperCase() !== 'EXCLUIR'; };
  document.getElementById('cancel-del-grow').onclick = closeSheet;
  btn.onclick = async () => {
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    const next = sortedGrowIds().find((x) => x !== id) || null;
    try {
      await deleteGrow(S.uid, id, entryIds, next);
      closeSheet();
      toast('Cultivo excluído', 'ok');
    } catch (err) {
      console.error(err);
      toast('Erro ao excluir', 'err');
      btn.disabled = false; btn.textContent = 'Excluir cultivo';
    }
  };
}

// =============================================================================
//  MENU
// =============================================================================
function openMenu() {
  openSheet(`
    <h3>Menu</h3>
    <p class="mono" style="font-size:11px;color:var(--muted);margin:-8px 0 8px">${esc(currentEmail())}</p>
    <button class="menu-item" id="m-grows"><span class="ico">🌿</span> Meus cultivos</button>
    <button class="menu-item" id="m-edit"><span class="ico">⚙️</span> Configurar este cultivo</button>
    <button class="menu-item" id="m-new"><span class="ico">➕</span> Novo cultivo</button>
    <button class="menu-item" id="m-harvest"><span class="ico">✂️</span> Colheita &amp; pós-colheita</button>
    <button class="menu-item" id="m-export"><span class="ico">⬇️</span> Exportar backup (JSON)</button>
    <button class="menu-item" id="m-import"><span class="ico">⬆️</span> Importar backup (JSON)</button>
    <button class="menu-item danger" id="m-logout"><span class="ico">🚪</span> Sair da conta</button>`);

  document.getElementById('m-grows').onclick = () => { closeSheet(); openGrows(); };
  document.getElementById('m-edit').onclick = () => { closeSheet(); openSetup('edit'); };
  document.getElementById('m-new').onclick = () => { closeSheet(); openSetup('new'); };
  document.getElementById('m-harvest').onclick = () => { closeSheet(); S.setupMode = null; S.tab = 'harvest'; renderView(); };
  document.getElementById('m-export').onclick = () => { closeSheet(); doExport(); };
  document.getElementById('m-import').onclick = () => { closeSheet(); doImport(); };
  document.getElementById('m-logout').onclick = async () => {
    closeSheet();
    try { await logout(); } catch { toast('Erro ao sair', 'err'); }
  };
}

async function doExport() {
  toast('Preparando backup…');
  try {
    const data = await exportAll(S.uid);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `diario-cultivo-${todayStr()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast('Backup exportado ✓', 'ok');
  } catch (e) { console.error(e); toast('Erro ao exportar', 'err'); }
}

function doImport() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    const file = inp.files[0]; if (!file) return;
    try {
      const n = await importAll(S.uid, JSON.parse(await file.text()));
      toast(`Importado ✓ (${n} registros)`, 'ok');
    } catch (e) { console.error(e); toast('Arquivo inválido', 'err'); }
  };
  inp.click();
}

// ------------------------------- start --------------------------------------
boot();
