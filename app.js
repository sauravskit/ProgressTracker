const STORAGE_KEY = 'dailyFlameTracker';
const DEFAULT_GOALS = ['Java theory & project', 'Coding', 'Health', 'Water (5L)', 'Sleep (6h)', 'NMC'];
let state = { data: {}, view: { year: new Date().getFullYear(), month: new Date().getMonth() } };

const $ = s => document.querySelector(s);

// Optional static token. Keep empty to force using the input field (safer).
const GIST_TOKEN = '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';

// Returns the GitHub Gist token to use. Priority: GIST_TOKEN constant (if set) -> #gistToken input -> ''
function getGistToken() {
  try {
    const input = $('#gistToken');
    const fromInput = input ? (input.value || '') : '';
    return (GIST_TOKEN || fromInput || '').toString();
  } catch (e) {
    return (GIST_TOKEN || '').toString();
  }
}

function load() {
  try {
    state.data = JSON.parse(localStorage.getItem(STORAGE_KEY))?.data || {};
  } catch (e) {
    state.data = {};
  }
}
function save() { 
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: state.data }));
    return true;
  } catch (e) {
    console.error('Failed to save data:', e);
    alert('Failed to save data. Storage might be full or unavailable.');
    return false;
  }
}

function exportData() {
  const data = JSON.stringify({ data: state.data });
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `progress-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported && imported.data) {
        state.data = imported.data;
        save();
        render();
        alert('Data imported successfully!');
      } else {
        throw new Error('Invalid file format');
      }
    } catch (e) {
      alert('Failed to import data. Please make sure the file is valid.');
    }
  };
  reader.readAsText(file);
}

function key(d) { return d.toISOString().slice(0, 10) }
function getDay(k) { if (!state.data[k]) state.data[k] = { goals: [...DEFAULT_GOALS], progress: Array(6).fill(0) }; return state.data[k] }
function avg(a) { return Math.round(a.reduce((x, y) => x + +y, 0) / a.length) }
function cls(p) { if (p <= 0) return 'empty'; if (p < 15) return 'vlow'; if (p < 40) return 'low'; if (p < 70) return 'mid'; return 'high' }

function render() {
  const g = $('#grid');
  if (!g) return;
  g.innerHTML = '';
  const y = state.view.year, m = state.view.month;
  const f = new Date(y, m, 1), l = new Date(y, m + 1, 0);
  $('#monthLabel').textContent = f.toLocaleString('default', { month: 'long', year: 'numeric' });
  for (let i = 0; i < f.getDay(); i++) g.appendChild(document.createElement('div'));
  for (let d = 1; d <= l.getDate(); d++) {
    const date = new Date(y, m, d), k = key(date), day = getDay(k), p = avg(day.progress);
    const el = document.createElement('div');
    el.className = 'day';
    el.innerHTML = `<div class=date-num>${d}</div><div class="flame ${cls(p)}" data-k="${k}">🔥</div><div>${p}%</div>`;
    const flame = el.querySelector('.flame');
    if (flame) flame.onclick = () => openModal(k);
    g.appendChild(el);
  }
}

const modal = $('#dayModal'), title = $('#modalDateTitle'), goalsList = $('#goalsList'), progressList = $('#progressList'), dayP = $('#dayPercent');
let cur = null;

function openModal(k) {
  cur = k;
  const d = new Date(k + 'T00:00');
  if (title) title.textContent = d.toDateString();
  const x = getDay(k);
  if (goalsList) {
    goalsList.innerHTML = '';
    x.goals.forEach((g, i) => {
      const r = document.createElement('div');
      r.className = 'goal-row';
      r.innerHTML = `<input value="${g}"> <button class="small">❌</button>`;
      const input = r.querySelector('input');
      const btn = r.querySelector('button');
      if (input) input.oninput = e => { x.goals[i] = e.target.value };
      if (btn) btn.onclick = () => { x.goals.splice(i, 1); x.progress.splice(i, 1); openModal(k) };
      goalsList.appendChild(r);
    });
  }

  if (progressList) {
    progressList.innerHTML = '';
    x.goals.forEach((g, i) => {
      const r = document.createElement('div');
      r.className = 'progress-row';
      const val = x.progress[i] || 0;
      r.innerHTML = `${g}: <input type=range min=0 max=100 value=${val}> <span>${val}%</span>`;
      const rng = r.querySelector('input'), sp = r.querySelector('span');
      if (rng) rng.oninput = e => { x.progress[i] = +e.target.value; if (sp) sp.textContent = x.progress[i] + '%'; if (dayP) dayP.textContent = avg(x.progress) + '%'; render() };
      progressList.appendChild(r);
    });
  }

  if (dayP) dayP.textContent = avg(x.progress) + '%';
  if (modal) modal.classList.remove('hidden');
}

if ($('#closeModal')) $('#closeModal').onclick = () => modal.classList.add('hidden');
if ($('#addGoalBtn')) $('#addGoalBtn').onclick = () => { if (!cur) return; const d = getDay(cur); d.goals.push('New goal'); d.progress.push(0); openModal(cur) };
if ($('#saveDay')) $('#saveDay').onclick = () => { save(); render(); modal.classList.add('hidden') };
if ($('#resetDay')) $('#resetDay').onclick = () => { if (!cur) return; if (confirm('Reset this day?')) { state.data[cur] = { goals: [...DEFAULT_GOALS], progress: Array(5).fill(0) }; save(); render(); modal.classList.add('hidden') } };
if ($('#prevMonth')) $('#prevMonth').onclick = () => { state.view.month--; if (state.view.month < 0) { state.view.month = 11; state.view.year-- } render() };
if ($('#nextMonth')) $('#nextMonth').onclick = () => { state.view.month++; if (state.view.month > 11) { state.view.month = 0; state.view.year++ } render() };
if ($('#exportData')) $('#exportData').onclick = exportData;
if ($('#importData')) $('#importData').onchange = (e) => { if (e.target.files.length > 0) importData(e.target.files[0]); };

// Auto-save when modifying goals or progress
function setupAutoSave() {
  const observer = new MutationObserver(() => {
    if (!modal.classList.contains('hidden')) {
      save();
    }
  });
  
  if (goalsList) observer.observe(goalsList, { childList: true, subtree: true });
  if (progressList) observer.observe(progressList, { childList: true, subtree: true });
}

load();
render();
setupAutoSave();

/* GIST backup */
async function api(p, m = 'GET', t, b) {
  const h = { 'Accept': 'application/vnd.github.v3+json' };
  if (t) h['Authorization'] = 'token ' + t;
  const r = await fetch('https://api.github.com' + p, { method: m, headers: h, body: b ? JSON.stringify(b) : undefined });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function status(m) { const el = $('#gistStatus'); if (el) el.textContent = m }

$('#createGist').onclick = async () => {
  const t = getGistToken().trim();
  if (!t) return alert('Token needed');
  status('Creating gist...');
  try {
    const b = { description: 'Daily Flame Tracker backup', public: false, files: { 'daily-flame.json': { content: JSON.stringify({ data: state.data }, null, 2) } } };
    const j = await api('/gists', 'POST', t, b);
    const gistEl = $('#gistId'); if (gistEl) gistEl.value = j.id;
    status('Created gist ' + j.id);
  } catch (e) {
    alert('Error: ' + e.message);
    status('Failed');
  }
};

$('#pushGist').onclick = async () => {
  const t = getGistToken().trim();
  const id = ( $('#gistId') && $('#gistId').value.trim() ) || '';
  if (!t || !id) return alert('Token and gist id needed');
  status('Pushing...');
  try {
    await api('/gists/' + id, 'PATCH', t, { files: { 'daily-flame.json': { content: JSON.stringify({ data: state.data }, null, 2) } } });
    status('Push done');
  } catch (e) {
    alert('Push failed ' + e.message);
    status('Error');
  }
};

$('#loadGist').onclick = async () => {
  const t = getGistToken().trim();
  const id = ( $('#gistId') && $('#gistId').value.trim() ) || '';
  if (!t || !id) return alert('Token and gist id needed');
  status('Loading...');
  try {
    const j = await api('/gists/' + id, 'GET', t);
    const f = j.files['daily-flame.json'];
    if (!f) return alert('No file in gist');
    const d = JSON.parse(f.content);
    if (d.data) {
      state.data = Object.assign({}, state.data, d.data);
      save(); render(); status('Loaded from gist');
    }
  } catch (e) {
    alert('Load failed ' + e.message);
    status('Error');
  }
};

// If a GIST_TOKEN constant is set, pre-fill the input to make UX easier (but only locally)
if (GIST_TOKEN && $('#gistToken')) {
  try { $('#gistToken').value = GIST_TOKEN } catch (e) { }
}
