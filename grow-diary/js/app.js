// =============================================================================
// app.js — UI, roteamento e orquestração
// -----------------------------------------------------------------------------
// Vanilla JS. Lê os dados fixos de data.js, calcula fase/dia em phase.js,
// gera lembretes em reminders.js e fala com a nuvem via store.js.
// =============================================================================

import { configPending } from './firebase-init.js';
import {
  watchAuth, currentUid, login, register, logout, authErrorMessage,
  loadConfig, saveConfig, saveEntry, deleteEntry,
  watchConfig, watchEntries, uploadPhoto, deletePhoto,
  exportAll, importAll,
} from './store.js';
import {
  GROW, SCHEDULE, STAGE_LABEL, WATERING_REF, WATERING_GOLDEN,
  LIGHT_REF, LIGHT_NOTE, TROUBLESHOOTING, LST_SUMMARY,
  QUICK_CHECKS, TRICHOME_FROM_DAY, LEGAL_NOTICE,
} from './data.js';
import {
  computeStatus, weekForDay, dayNumber, todayStr, fmtBR, daysSince,
} from './phase.js';
import { allReminders } from './reminders.js';

// --------------------------- Estado da aplicação ----------------------------
const S = {
  uid: null,
  config: null,
  entries: {},            // { 'YYYY-MM-DD': entry }
  tab: 'today',
  authMode: 'login',      // 'login' | 'signup'
  online: navigator.onLine,
  syncing: false,
  pendingWrites: false,
  ready: false,           // já recebeu o primeiro snapshot?
  unsub: [],              // funções pra cancelar os listeners
};
const root = () => document.getElementById('root');

// ------------------------------- helpers ------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg, type = '') {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 250); }, 2600);
}

function legalFooter() {
  return `<p class="legal">${esc(LEGAL_NOTICE)}</p>`;
}

// Fecha qualquer sheet/modal aberto.
function closeSheet() { document.querySelectorAll('.sheet-backdrop, .sheet, .lightbox').forEach((e) => e.remove()); }

// =============================================================================
//  BOOT — decide entre loader / login / onboarding / app
// =============================================================================
window.addEventListener('online', () => { S.online = true; updateSync(); });
window.addEventListener('offline', () => { S.online = false; updateSync(); });

function boot() {
  if (configPending) { renderConfigNeeded(); return; }
  renderLoader('Conectando…');
  // PONTO DE INTEGRAÇÃO: observa o estado de login (sessão persistente).
  watchAuth((user) => {
    // limpa listeners antigos ao trocar de usuário
    S.unsub.forEach((fn) => fn && fn()); S.unsub = [];
    S.entries = {}; S.config = null; S.ready = false;
    if (!user) { S.uid = null; renderAuth(); return; }
    S.uid = user.uid;
    startSync();
  });
}

// Assina config + entries em tempo real (sincronização multi-dispositivo).
function startSync() {
  renderLoader('Carregando seu cultivo…');
  let gotConfig = false;
  S.unsub.push(watchConfig(S.uid, (config, meta) => {
    S.config = config;
    reflectMeta(meta);
    gotConfig = true;
    if (!S.ready) { S.ready = true; renderApp(); } else { rerender(); }
  }));
  S.unsub.push(watchEntries(S.uid, (map, meta) => {
    S.entries = map;
    reflectMeta(meta);
    if (S.ready) rerender();
  }));
  // fallback: se em 6s nada chegou (offline sem cache), mostra o app mesmo assim
  setTimeout(() => { if (!S.ready) { S.ready = true; renderApp(); } }, 6000);
}

function reflectMeta(meta) {
  if (meta) S.pendingWrites = meta.hasPendingWrites;
  updateSync();
}

// =============================================================================
//  TELA DE LOGIN / CADASTRO
// =============================================================================
function renderConfigNeeded() {
  root().innerHTML = `
    <div class="auth-screen"><div class="auth-card">
      <div class="brand"><div class="leaf">🌿</div>
        <div class="kicker">Diário de Cultivo</div>
        <h1>Auto Pineapple Express</h1></div>
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
  const signup = S.authMode === 'signup';
  root().innerHTML = `
    <div class="auth-screen"><div class="auth-card">
      <div class="brand">
        <div class="leaf">🌿</div>
        <div class="kicker">Diário de Cultivo</div>
        <h1>Auto Pineapple Express</h1>
        <p>${signup ? 'Crie sua conta para começar' : 'Entre para ver seu cultivo em qualquer dispositivo'}</p>
      </div>
      <div id="auth-err" class="auth-error hidden"></div>
      <form id="auth-form">
        <div class="field">
          <label>E-mail</label>
          <input type="email" id="au-email" autocomplete="email" required placeholder="voce@email.com">
        </div>
        <div class="field">
          <label>Senha</label>
          <input type="password" id="au-pass" autocomplete="${signup ? 'new-password' : 'current-password'}" required minlength="6" placeholder="mínimo 6 caracteres">
          <div class="hint">Sua sessão fica salva neste dispositivo (não pede login toda vez).</div>
        </div>
        <button class="btn" id="au-submit" type="submit">${signup ? 'Criar conta' : 'Entrar'}</button>
      </form>
      <div class="auth-toggle">
        ${signup ? 'Já tem conta?' : 'Primeira vez?'}
        <button id="au-toggle">${signup ? 'Entrar' : 'Criar conta'}</button>
      </div>
      ${legalFooter()}
    </div></div>`;

  document.getElementById('au-toggle').onclick = () => {
    S.authMode = signup ? 'login' : 'signup'; renderAuth();
  };
  document.getElementById('auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('au-email').value.trim();
    const pass = document.getElementById('au-pass').value;
    const btn = document.getElementById('au-submit');
    const errBox = document.getElementById('auth-err');
    errBox.classList.add('hidden');
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    try {
      await (signup ? register(email, pass) : login(email, pass));
      // watchAuth cuida do redirecionamento
    } catch (err) {
      errBox.textContent = authErrorMessage(err.code);
      errBox.classList.remove('hidden');
      btn.disabled = false; btn.textContent = signup ? 'Criar conta' : 'Entrar';
    }
  };
}

// =============================================================================
//  LOADER
// =============================================================================
function renderLoader(msg) {
  root().innerHTML = `<div class="full-loader"><div style="text-align:center">
    <div class="spin"></div><div>${esc(msg)}</div></div></div>`;
}

// =============================================================================
//  ONBOARDING (primeira vez, após login)
// =============================================================================
function renderOnboarding() {
  root().innerHTML = `
    <div class="auth-screen"><div class="auth-card">
      <div class="brand">
        <div class="leaf">🌱</div>
        <div class="kicker">Vamos começar</div>
        <h1>Quando você plantou?</h1>
        <p>A data de plantio é a âncora de todo o cronograma.</p>
      </div>
      <form id="onb-form">
        <div class="field">
          <label>Data de plantio</label>
          <input type="date" id="onb-date" required max="${todayStr()}" value="${todayStr()}">
          <div class="hint">Dia em que a semente germinada foi pro vaso.</div>
        </div>
        <div class="field">
          <label>Nome do cultivo</label>
          <input type="text" id="onb-name" value="Auto Pineapple Express">
        </div>
        <div class="field">
          <label>Meta (gramas secos)</label>
          <input type="number" id="onb-goal" value="${GROW.defaultGoal}" min="1" step="1">
        </div>
        <button class="btn" id="onb-submit" type="submit">Começar o diário</button>
      </form>
      ${legalFooter()}
    </div></div>`;

  document.getElementById('onb-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('onb-submit');
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    const cfg = {
      plantingDate: document.getElementById('onb-date').value,
      name: document.getElementById('onb-name').value.trim() || 'Auto Pineapple Express',
      goalGrams: Number(document.getElementById('onb-goal').value) || GROW.defaultGoal,
      postHarvest: {},
    };
    try {
      await saveConfig(S.uid, cfg);
      S.config = { ...cfg };
      renderApp();
    } catch (err) {
      toast('Erro ao salvar. Tente de novo.', 'err');
      btn.disabled = false; btn.textContent = 'Começar o diário';
    }
  };
}

// =============================================================================
//  APP SHELL
// =============================================================================
function renderApp() {
  if (!S.config || !S.config.plantingDate) { renderOnboarding(); return; }
  const status = computeStatus(S.config.plantingDate);
  const activeCls = status.stage === 'veg' ? 'veg' : status.stage === 'mature' ? 'mature' : '';

  root().innerHTML = `
    <div class="app">
      <header class="topbar">
        <div class="grow-name">
          <b>${esc(S.config.name || 'Cultivo')}</b>
          <span class="mono">Dia ${status.day} · Sem ${status.week} · ${esc(status.phase)}</span>
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
  document.querySelectorAll('.tabbar button').forEach((b) => {
    b.onclick = () => { S.tab = b.dataset.tab; renderView(); };
  });
  updateSync();
  renderView();
}

function tabBtn(tab, ico, label, activeCls) {
  const active = S.tab === tab ? `active ${activeCls}` : '';
  return `<button class="${active}" data-tab="${tab}"><span class="ico">${ico}</span>${label}</button>`;
}

// Re-render preservando a aba atual (usado quando chega dado novo da nuvem).
function rerender() {
  if (!S.config || !S.config.plantingDate) { renderApp(); return; }
  // se o shell não existe ainda, monta tudo
  if (!document.getElementById('view')) { renderApp(); return; }
  // atualiza a linha do topo e re-renderiza a view atual
  const status = computeStatus(S.config.plantingDate);
  const sub = document.querySelector('.grow-name span');
  if (sub) sub.textContent = `Dia ${status.day} · Sem ${status.week} · ${status.phase}`;
  renderView();
}

// ---------------------- Indicador de sincronização --------------------------
function updateSync() {
  const el = document.getElementById('sync-ind');
  if (!el) return;
  el.classList.remove('is-synced', 'is-syncing', 'is-offline');
  let txt = 'Sincronizado';
  if (!S.online) { el.classList.add('is-offline'); txt = 'Offline'; }
  else if (S.syncing || S.pendingWrites) { el.classList.add('is-syncing'); txt = 'Sincronizando'; }
  else { el.classList.add('is-synced'); txt = 'Sincronizado'; }
  el.querySelector('.txt').textContent = txt;
}

// =============================================================================
//  ROTEADOR DE VIEWS
// =============================================================================
function renderView() {
  document.querySelectorAll('.tabbar button').forEach((b) =>
    b.classList.toggle('active', b.dataset.tab === S.tab));
  const v = document.getElementById('view');
  if (!v) return;
  v.scrollTop = 0; window.scrollTo(0, 0);
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

// =============================================================================
//  VIEW: HOJE (dashboard)
// =============================================================================
function viewToday() {
  const status = computeStatus(S.config.plantingDate);
  const wk = status.schedule;
  const reminders = allReminders(S.config.plantingDate, S.entries);
  const today = todayStr();
  const hasToday = !!S.entries[today];

  const barColor = status.stage === 'veg' ? 'bg-veg' : status.stage === 'flower' ? 'bg-flower' : 'bg-mature';
  const stageCls = `stage-${status.stage}`;

  const harvestCard = status.harvestReady ? `
    <div class="card accent" style="border-left-color:var(--amber)">
      <div class="card-label mature">Colheita &amp; pós-colheita</div>
      <p>Você entrou na janela de colheita. Abra o módulo pra seguir o passo a passo
         (colher → trim → secagem → cura) e registrar o peso final.</p>
      <button class="btn btn-sm" id="go-harvest" style="margin-top:12px">Abrir módulo de colheita →</button>
    </div>` : '';

  return `
    <div class="hero">
      <div class="day-num">${status.day}<small> / ~${status.totalDays}</small></div>
      <div class="phase-line ${stageCls}">Semana ${status.week} · ${esc(status.phase)}</div>
      <div class="to-harvest">${status.postHarvest
        ? 'Ciclo concluído — foco em secagem e cura.'
        : `~${status.daysToHarvest} dias até a colheita`}</div>
      <div class="progress"><span class="${barColor}" style="width:${status.progress}%"></span></div>
      <div class="progress-legend"><span>Plantio</span><span>${STAGE_LABEL[status.stage]}</span><span>Colheita</span></div>
    </div>

    ${reminders.map(reminderHtml).join('')}
    ${harvestCard}

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
        <p style="font-size:12px;color:var(--muted);margin-top:4px">LED → topo</p>
      </div>
      <div class="mini">
        <div class="card-label veg">💧 Rega</div>
        <div class="mono-val" style="font-size:15px">${esc(wk.water)}</div>
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
}

// =============================================================================
//  VIEW: REGISTRO DIÁRIO (formulário)
// =============================================================================
let formState = null; // { date, existingPhotos, newFiles:[{file,url}], removedPaths:[] }

function openEntryForm(date) {
  S.tab = 'entry';
  S._entryDate = date;
  renderView();
}

function renderEntryForm() {
  const v = document.getElementById('view');
  const date = S._entryDate || todayStr();
  const day = dayNumber(S.config.plantingDate, new Date(date + 'T12:00:00'));
  const wk = weekForDay(day);
  const existing = S.entries[date] || null;

  formState = {
    date,
    existingPhotos: existing && Array.isArray(existing.photos) ? [...existing.photos] : [],
    newFiles: [],
    removedPaths: [],
  };

  const checks = QUICK_CHECKS.filter((c) => day >= c.fromDay && day <= c.toDay);
  const showTrich = day >= TRICHOME_FROM_DAY;
  const ec = existing || {};
  const tri = ec.trichomes || {};

  v.innerHTML = `
    <button class="btn btn-ghost btn-sm" id="back-btn" style="margin-bottom:14px">← Voltar</button>
    <h2 class="section-title">${existing ? 'Editar registro' : 'Registrar dia'}</h2>
    <div class="section-sub">Dia ${day} · Semana ${wk.week} · ${esc(wk.phase)}</div>

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
          <input type="number" id="e-waterml" inputmode="numeric" value="${ec.waterMl ?? ''}" placeholder="${wk.waterMl}">
        </div>
        <div class="field">
          <label>Altura planta (cm)</label>
          <input type="number" id="e-height" inputmode="decimal" value="${ec.plantHeight ?? ''}" placeholder="ex: 42">
        </div>
      </div>

      <div class="form-row">
        <div class="field">
          <label>Altura da luz (cm)</label>
          <input type="number" id="e-light" inputmode="decimal" value="${ec.lightHeight ?? ''}" placeholder="${wk.lightCm}">
          <div class="hint">Recomendado agora: ${wk.light}</div>
        </div>
        <div class="field">
          <label>Temp. (°C)</label>
          <input type="number" id="e-temp" inputmode="decimal" value="${ec.temp ?? ''}" placeholder="ex: 25">
        </div>
      </div>

      <div class="field">
        <label>Umidade (%)</label>
        <input type="number" id="e-hum" inputmode="numeric" value="${ec.humidity ?? ''}" placeholder="ex: 55">
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
        <div class="hint">Comprimidas automaticamente (máx. 1280px) antes de subir pra nuvem.</div>
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

  // ---- interações do formulário ----
  document.getElementById('back-btn').onclick = () => { S.tab = 'today'; renderView(); };

  // segmento Sim/Não
  const wateredSeg = document.getElementById('e-watered');
  wateredSeg.querySelectorAll('button').forEach((b) => {
    b.onclick = () => { wateredSeg.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); };
  });
  // checkboxes visuais
  v.querySelectorAll('.check input').forEach((cb) => {
    cb.onchange = () => cb.closest('.check').classList.toggle('on', cb.checked);
  });

  // fotos
  renderPhotoInput();
  document.getElementById('photo-file').onchange = onPickPhotos;

  // deletar
  const del = document.getElementById('del-btn');
  if (del) del.onclick = () => confirmDelete(date);

  // salvar
  document.getElementById('entry-form').onsubmit = (e) => { e.preventDefault(); saveCurrentEntry(); };
}

function renderPhotoInput() {
  const box = document.getElementById('photo-input');
  if (!box) return;
  const existingHtml = formState.existingPhotos.map((p, i) => `
    <div class="photo-thumb"><img src="${esc(p.url)}" alt="foto">
      <button type="button" class="rm" data-rm-existing="${i}">×</button></div>`).join('');
  const newHtml = formState.newFiles.map((f, i) => `
    <div class="photo-thumb"><img src="${esc(f.url)}" alt="nova foto">
      <button type="button" class="rm" data-rm-new="${i}">×</button></div>`).join('');
  box.innerHTML = existingHtml + newHtml +
    `<button type="button" class="photo-add" id="photo-add">+</button>`;
  document.getElementById('photo-add').onclick = () => document.getElementById('photo-file').click();
  box.querySelectorAll('[data-rm-existing]').forEach((b) => b.onclick = () => {
    const i = +b.dataset.rmExisting;
    formState.removedPaths.push(formState.existingPhotos[i].path);
    formState.existingPhotos.splice(i, 1); renderPhotoInput();
  });
  box.querySelectorAll('[data-rm-new]').forEach((b) => b.onclick = () => {
    const i = +b.dataset.rmNew;
    URL.revokeObjectURL(formState.newFiles[i].url);
    formState.newFiles.splice(i, 1); renderPhotoInput();
  });
}

function onPickPhotos(e) {
  const files = Array.from(e.target.files || []);
  files.forEach((file) => {
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
    // 1) sobe as fotos novas (comprimidas dentro de uploadPhoto)
    const uploaded = [];
    for (const nf of formState.newFiles) {
      const p = await uploadPhoto(S.uid, date, nf.file);
      uploaded.push(p);
    }
    // 2) remove do Storage as fotos marcadas
    for (const path of formState.removedPaths) await deletePhoto(path);

    const photos = [...formState.existingPhotos, ...uploaded];

    const entry = {
      date,
      watered: wateredOn ? wateredOn.dataset.v === '1' : null,
      waterMl: num('e-waterml'),
      plantHeight: num('e-height'),
      lightHeight: num('e-light'),
      temp: num('e-temp'),
      humidity: num('e-hum'),
      notes: document.getElementById('e-notes').value.trim(),
      checks,
      trichomes,
      photos,
    };
    await saveEntry(S.uid, entry);
    S.entries[date] = { ...entry }; // otimista (o snapshot confirma depois)
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
      const e = S.entries[date];
      if (e && Array.isArray(e.photos)) for (const p of e.photos) await deletePhoto(p.path);
      await deleteEntry(S.uid, date);
      delete S.entries[date];
      toast('Registro apagado', 'ok');
      S.tab = 'history'; renderView();
    } catch (err) { toast('Erro ao apagar', 'err'); }
  };
}

// =============================================================================
//  VIEW: HISTÓRICO / LINHA DO TEMPO
// =============================================================================
function viewHistory() {
  const dates = Object.keys(S.entries).sort(); // crescente
  if (!dates.length) {
    return `<h2 class="section-title">Histórico</h2>
      <div class="empty"><span class="big">📖</span>Nenhum registro ainda.<br>Toque em "Registrar hoje" na aba Hoje.</div>${legalFooter()}`;
  }

  // fotos em ordem cronológica pra galeria "timelapse"
  const gallery = [];
  dates.forEach((d) => (S.entries[d].photos || []).forEach((p) => gallery.push({ ...p, date: d })));

  // agrupa por semana do cultivo
  const groups = {};
  dates.forEach((d) => {
    const day = dayNumber(S.config.plantingDate, new Date(d + 'T12:00:00'));
    const wk = weekForDay(day);
    (groups[wk.week] = groups[wk.week] || { wk, items: [] }).items.push({ date: d, day });
  });

  const galleryHtml = gallery.length ? `
    <div class="card">
      <div class="card-label">🎞️ Galeria de evolução</div>
      <div class="gallery-strip" id="gallery-strip">
        ${gallery.map((g, i) => `<img src="${esc(g.url)}" data-gi="${i}" alt="${esc(g.date)}">`).join('')}
      </div>
      <p style="font-size:12px;color:var(--muted)">Role para ver a planta crescendo · toque para ampliar</p>
    </div>` : '';

  const groupsHtml = Object.values(groups).sort((a, b) => b.wk.week - a.wk.week).map((g) => `
    <div class="week-group">
      <div class="week-head"><span class="stage-${g.wk.stage}">Semana ${g.wk.week}</span> · ${esc(g.wk.phase)}<span class="bar"></span></div>
      ${g.items.sort((a, b) => (a.date < b.date ? 1 : -1)).map((it) => entryCard(S.entries[it.date], it.day)).join('')}
    </div>`).join('');

  window._gallery = gallery; // pra lightbox
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
  if (e.trichomes && (e.trichomes.milky || e.trichomes.amber || e.trichomes.clear))
    stats.push(`<span>🔬 ${e.trichomes.clear || 0}/${e.trichomes.milky || 0}/${e.trichomes.amber || 0}</span>`);

  const chipLabels = { lst: 'LST', topdress: 'Top-dress', trichomes: 'Tricomas', support: 'Escora' };
  const chips = e.checks ? Object.entries(e.checks).filter(([, v]) => v).map(([k]) => `<span class="chip">✓ ${chipLabels[k] || k}</span>`).join('') : '';
  const thumbs = (e.photos || []).map((p) => {
    const gi = (window._gallery || []).findIndex((g) => g.url === p.url);
    return `<img src="${esc(p.url)}" data-gi="${gi}" alt="foto">`;
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
      <img src="${esc(g.url)}" alt="">
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
//  VIEW: GRÁFICOS  (Chart.js — carregado por CDN como global `Chart`)
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
  const labels = dates.map((d) => fmtBR(d).slice(0, 5)); // dd/mm
  const grid = 'rgba(255,255,255,.06)', tick = '#9a9a9a';
  const baseOpts = (extra = {}) => ({
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: { legend: { labels: { color: tick, font: { family: 'JetBrains Mono' } } } },
    scales: {
      x: { ticks: { color: tick, font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: grid } },
      y: { ticks: { color: tick, font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: grid }, ...extra },
    },
  });
  const val = (f) => dates.map((d) => (S.entries[d][f] != null && S.entries[d][f] !== '' ? Number(S.entries[d][f]) : null));

  new Chart(document.getElementById('chart-height'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'Altura (cm)', data: val('plantHeight'), borderColor: '#7cc36a', backgroundColor: 'rgba(124,195,106,.15)', tension: .3, spanGaps: true, fill: true, pointRadius: 3 }] },
    options: baseOpts(),
  });
  new Chart(document.getElementById('chart-env'), {
    type: 'line',
    data: { labels, datasets: [
      { label: 'Temp (°C)', data: val('temp'), borderColor: '#d9a441', backgroundColor: 'transparent', tension: .3, spanGaps: true, pointRadius: 3, yAxisID: 'y' },
      { label: 'Umidade (%)', data: val('humidity'), borderColor: '#e6398a', backgroundColor: 'transparent', tension: .3, spanGaps: true, pointRadius: 3, yAxisID: 'y1' },
    ] },
    options: {
      ...baseOpts(),
      scales: {
        x: { ticks: { color: tick, font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: grid } },
        y: { position: 'left', ticks: { color: '#d9a441', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: grid } },
        y1: { position: 'right', ticks: { color: '#e6398a', font: { family: 'JetBrains Mono', size: 10 } }, grid: { drawOnChartArea: false } },
      },
    },
  });
}

// =============================================================================
//  VIEW: CRONOGRAMA COMPLETO (guia semana-a-semana, semana atual destacada)
// =============================================================================
function viewSchedule() {
  const status = computeStatus(S.config.plantingDate);
  return `<h2 class="section-title">Cronograma</h2>
    <div class="section-sub">Guia completo · semana atual destacada</div>
    ${SCHEDULE.map((wk) => {
      const cur = wk.week === status.week;
      return `<div class="timeline-week ${cur ? 'current' : ''}">
        <div class="tw-head">
          <span class="num stage-${wk.stage}">${wk.week}</span>
          <span class="phase stage-${wk.stage}">${esc(wk.phase)}</span>
          ${cur ? '<span class="now">AGORA</span>' : ''}
          <span class="days">dias ${wk.dayStart}–${wk.dayEnd}</span>
        </div>
        <div class="tw-row"><b>Fazer</b>${esc(wk.do)}</div>
        <div class="tw-row"><b>Observe</b>${esc(wk.observe)}</div>
        <div class="tw-row"><b>Luz</b>${esc(wk.light)} · <b style="display:inline">Rega</b> ${esc(wk.water)}</div>
      </div>`;
    }).join('')}
    ${legalFooter()}`;
}

// =============================================================================
//  VIEW: REFERÊNCIAS
// =============================================================================
function viewRef() {
  const status = computeStatus(S.config.plantingDate);
  const wateringRow = (r, i) => {
    const cur = (status.week <= 2 && i === 0) || ((status.week === 3 || status.week === 4) && i === 1) || (status.week >= 5 && i === 2);
    return `<tr class="${cur ? 'current' : ''}"><td class="wk">${esc(r.phase)}</td><td>${esc(r.amount)}</td><td>${esc(r.when)}</td></tr>`;
  };
  const lightRow = (r, i) => {
    const cur = (status.stage === 'veg' && status.week <= 2 && i === 0) ||
      (status.stage === 'veg' && status.week > 2 && i === 1) ||
      ((status.stage === 'flower' || status.stage === 'mature') && i === 2);
    return `<tr class="${cur ? 'current' : ''}"><td class="wk">${esc(r.phase)}</td><td>${esc(r.distance)}</td><td>${esc(r.ppfd)}</td></tr>`;
  };

  return `<h2 class="section-title">Referências</h2>
    <div class="section-sub">Tabelas de consulta rápida</div>

    <h3 style="margin:6px 0 10px">💧 Rega por fase</h3>
    <div class="tbl-wrap"><table class="ref">
      <thead><tr><th>Fase</th><th>Quanto / onde</th><th>Quando</th></tr></thead>
      <tbody>${WATERING_REF.map(wateringRow).join('')}</tbody>
    </table></div>
    <div class="golden">${esc(WATERING_GOLDEN)}</div>

    <h3 style="margin:6px 0 10px">💡 Luz — altura e PPFD-alvo</h3>
    <div class="tbl-wrap"><table class="ref">
      <thead><tr><th>Fase</th><th>Distância (LED→topo)</th><th>PPFD-alvo</th></tr></thead>
      <tbody>${LIGHT_REF.map(lightRow).join('')}</tbody>
    </table></div>
    <div class="note-block">${esc(LIGHT_NOTE)}</div>

    <h3 style="margin:6px 0 10px">🩺 Troubleshooting</h3>
    <input type="text" id="ts-filter" class="field" style="width:100%;background:var(--surface);border:1px solid var(--line);border-radius:10px;color:var(--text);padding:11px 13px;margin-bottom:12px" placeholder="Filtrar por sintoma / causa…">
    <div class="tbl-wrap"><table class="ref" id="ts-table">
      <thead><tr><th>Sintoma</th><th>Causa provável</th><th>O que fazer</th></tr></thead>
      <tbody>${TROUBLESHOOTING.map((t) => `<tr><td>${esc(t.symptom)}</td><td>${esc(t.cause)}</td><td>${esc(t.action)}</td></tr>`).join('')}</tbody>
    </table></div>

    <h3 style="margin:6px 0 10px">🪢 LST — resumo</h3>
    <div class="note-block">${esc(LST_SUMMARY)}</div>

    <h3 style="margin:6px 0 10px">🌿 Ficha do cultivo</h3>
    <div class="card">
      ${[['Genética', GROW.strain], ['', GROW.strainDetail], ['Estufa', GROW.tent], ['Luz', GROW.light],
         ['Exaustão', GROW.exhaust], ['Vaso', GROW.pot], ['Substrato', GROW.substrate],
         ['Método', GROW.method], ['Ciclo', GROW.cycle], ['Clima', GROW.climate]]
        .map(([k, v]) => `<div class="tw-row">${k ? `<b>${esc(k)}</b>` : ''}${esc(v)}</div>`).join('')}
    </div>
    ${legalFooter()}`;
}

function mountRef() {
  const filter = document.getElementById('ts-filter');
  if (!filter) return;
  filter.oninput = () => {
    const q = filter.value.toLowerCase();
    document.querySelectorAll('#ts-table tbody tr').forEach((tr) => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
}

// =============================================================================
//  VIEW: COLHEITA & PÓS-COLHEITA (checklist + trackers de tempo)
// =============================================================================
function viewHarvest() {
  const ph = (S.config.postHarvest) || {};
  const goal = S.config.goalGrams || GROW.defaultGoal;

  const steps = ['Colher', 'Buckear', 'Trim (wet)', 'Secagem', 'Cura'];
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
  const pct = w ? Math.min(100, Math.round((w / goal) * 100)) : 0;

  return `<h2 class="section-title">Colheita &amp; pós-colheita</h2>
    <div class="section-sub">colher → trim (wet) → secagem → cura</div>

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
        <input type="number" id="final-weight" inputmode="decimal" value="${w ?? ''}" placeholder="ex: 58">
      </div>
      <div class="goal-compare">
        <div class="goal-bar">
          <div class="track"><div class="fill" style="width:${pct}%">${pct}%</div></div>
          <p style="font-size:12px;color:var(--muted);margin-top:6px">da meta de ${goal} g</p>
        </div>
        <div class="goal-num">${w != null ? w : '—'}<small> / ${goal} g</small></div>
      </div>
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
      S.config.postHarvest = ph;
      el.classList.toggle('done', ph.stepDone[i]);
      try { await saveConfig(S.uid, { postHarvest: ph }); } catch { toast('Erro ao salvar', 'err'); }
    };
  });
  const save = document.getElementById('save-harvest');
  if (save) save.onclick = async () => {
    const ph = { ...(S.config.postHarvest || {}) };
    ph.dryStart = document.getElementById('dry-start').value || null;
    ph.cureStart = document.getElementById('cure-start').value || null;
    const w = document.getElementById('final-weight').value;
    ph.finalWeight = w === '' ? null : Number(w);
    S.config.postHarvest = ph;
    save.disabled = true; save.innerHTML = '<span class="spin"></span>';
    try { await saveConfig(S.uid, { postHarvest: ph }); toast('Salvo na nuvem ✓', 'ok'); renderView(); }
    catch { toast('Erro ao salvar', 'err'); save.disabled = false; save.textContent = 'Salvar'; }
  };
}

// =============================================================================
//  MENU (sheet inferior): pós-colheita, config, export/import, logout
// =============================================================================
function openSheet(html) {
  closeSheet();
  const bd = document.createElement('div'); bd.className = 'sheet-backdrop'; bd.onclick = closeSheet;
  const sheet = document.createElement('div'); sheet.className = 'sheet'; sheet.innerHTML = html;
  document.body.appendChild(bd); document.body.appendChild(sheet);
}

function openMenu() {
  openSheet(`
    <h3>Menu</h3>
    <button class="menu-item" id="m-harvest"><span class="ico">✂️</span> Colheita &amp; pós-colheita</button>
    <button class="menu-item" id="m-edit"><span class="ico">🌿</span> Editar cultivo (data, nome, meta)</button>
    <button class="menu-item" id="m-export"><span class="ico">⬇️</span> Exportar backup (JSON)</button>
    <button class="menu-item" id="m-import"><span class="ico">⬆️</span> Importar backup (JSON)</button>
    <button class="menu-item danger" id="m-logout"><span class="ico">🚪</span> Sair da conta</button>`);

  document.getElementById('m-harvest').onclick = () => { closeSheet(); S.tab = 'harvest'; renderView(); };
  document.getElementById('m-edit').onclick = () => { closeSheet(); openEditConfig(); };
  document.getElementById('m-export').onclick = () => { closeSheet(); doExport(); };
  document.getElementById('m-import').onclick = () => { closeSheet(); doImport(); };
  document.getElementById('m-logout').onclick = async () => {
    closeSheet();
    try { await logout(); } catch { toast('Erro ao sair', 'err'); }
  };
}

function openEditConfig() {
  const c = S.config;
  openSheet(`
    <h3>Editar cultivo</h3>
    <div class="field"><label>Data de plantio</label><input type="date" id="c-date" value="${c.plantingDate}" max="${todayStr()}"></div>
    <div class="field"><label>Nome</label><input type="text" id="c-name" value="${esc(c.name || '')}"></div>
    <div class="field"><label>Meta (g)</label><input type="number" id="c-goal" value="${c.goalGrams || GROW.defaultGoal}" min="1"></div>
    <button class="btn" id="c-save">Salvar</button>
    <button class="btn btn-ghost" id="c-cancel" style="margin-top:10px">Cancelar</button>`);
  document.getElementById('c-cancel').onclick = closeSheet;
  document.getElementById('c-save').onclick = async () => {
    const upd = {
      plantingDate: document.getElementById('c-date').value,
      name: document.getElementById('c-name').value.trim() || 'Cultivo',
      goalGrams: Number(document.getElementById('c-goal').value) || GROW.defaultGoal,
    };
    try { await saveConfig(S.uid, upd); S.config = { ...S.config, ...upd }; closeSheet(); renderApp(); toast('Cultivo atualizado ✓', 'ok'); }
    catch { toast('Erro ao salvar', 'err'); }
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
      const data = JSON.parse(await file.text());
      const n = await importAll(S.uid, data);
      toast(`Importado ✓ (${n} registros)`, 'ok');
      // o snapshot em tempo real atualiza a tela sozinho
    } catch (e) { console.error(e); toast('Arquivo inválido', 'err'); }
  };
  inp.click();
}

// ------------------------------- start --------------------------------------
boot();
