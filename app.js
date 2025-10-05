// Daily Flame Tracker - polished responsive version
const DEFAULT_GOALS = [
  "Java theory & project",
  "Coding",
  "Health (exercise)",
  "Water (5 L)",
  "Sleep (≥6 hrs)"
];
const STORAGE_KEY = "dailyFlameTracker_v2";

let state = {
  data: {},
  view: { year: new Date().getFullYear(), month: new Date().getMonth() }
};

const $ = sel => document.querySelector(sel);

// storage
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try { state.data = JSON.parse(raw).data || {}; } catch(e){ state.data = {}; }
  }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: state.data })); }

function dateToKey(d){
  return d.toISOString().slice(0,10);
}
function keyToDate(k){ return new Date(k + "T00:00:00"); }

function getOrCreate(key){
  if(!state.data[key]) state.data[key] = { goals: [...DEFAULT_GOALS], progress: Array(DEFAULT_GOALS.length).fill(0) };
  // normalize
  if(!Array.isArray(state.data[key].goals)) state.data[key].goals = [...DEFAULT_GOALS];
  if(!Array.isArray(state.data[key].progress)) state.data[key].progress = state.data[key].goals.map(()=>0);
  return state.data[key];
}

function avg(arr){
  if(!arr || !arr.length) return 0;
  return Math.round(arr.reduce((a,b)=>a + Number(b),0)/arr.length);
}
function intensityClass(p){
  if(p <= 0) return "empty";
  if(p < 15) return "vlow";
  if(p < 40) return "low";
  if(p < 70) return "mid";
  return "high";
}

// calendar render
function renderCalendar(){
  const cal = $("#grid");
  cal.innerHTML = "";

  const year = state.view.year, month = state.view.month;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  $("#monthLabel").textContent = first.toLocaleString(undefined, { month:"long", year:"numeric" });

  // pad blanks
  for(let i=0;i<first.getDay();i++){
    const b = document.createElement("div");
    b.className = "day";
    b.style.visibility = "hidden";
    cal.appendChild(b);
  }

  for(let d=1; d<=last.getDate(); d++){
    const dateObj = new Date(year, month, d);
    const key = dateToKey(dateObj);
    const dayData = getOrCreate(key);

    const dayEl = document.createElement("div");
    dayEl.className = "day";

    const dateNum = document.createElement("div");
    dateNum.className = "date-num";
    dateNum.textContent = d;
    dayEl.appendChild(dateNum);

    const percent = avg(dayData.progress);
    const flame = document.createElement("div");
    flame.className = `flame ${intensityClass(percent)}`;
    flame.textContent = "🔥";
    flame.title = `${percent}% completed`;
    flame.dataset.key = key;
    flame.addEventListener("click", ()=> openModal(key));
    dayEl.appendChild(flame);

    const perc = document.createElement("div");
    perc.className = "perc";
    perc.textContent = `${percent}%`;
    dayEl.appendChild(perc);

    cal.appendChild(dayEl);
  }
}

// modal behavior
const modal = $("#dayModal");
const modalTitle = $("#modalDateTitle");
const goalsList = $("#goalsList");
const progressList = $("#progressList");
const dayPercentEl = $("#dayPercent");
let currentKey = null;

function openModal(key){
  currentKey = key;
  const date = keyToDate(key);
  modalTitle.textContent = date.toLocaleDateString(undefined, { weekday:"long", month:"short", day:"numeric", year:"numeric" });
  const day = getOrCreate(key);
  renderGoals(day);
  renderProgress(day);
  dayPercentEl.textContent = avg(day.progress) + "%";
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden","false");
}

function closeModal(){
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden","true");
  currentKey = null;
}

// render goals and progress
function renderGoals(day){
  goalsList.innerHTML = "";
  day.goals.forEach((g, idx)=>{
    const row = document.createElement("div");
    row.className = "goal-row";

    const input = document.createElement("input");
    input.type = "text";
    input.value = g;
    input.addEventListener("input", e=>{
      day.goals[idx] = e.target.value;
      renderProgress(day);
    });

    const rem = document.createElement("button");
    rem.className = "remove";
    rem.textContent = "Remove";
    rem.addEventListener("click", ()=>{
      day.goals.splice(idx,1);
      day.progress.splice(idx,1);
      renderGoals(day);
      renderProgress(day);
    });

    row.appendChild(input);
    row.appendChild(rem);
    goalsList.appendChild(row);
  });
}

function renderProgress(day){
  progressList.innerHTML = "";
  // align lengths
  while(day.progress.length < day.goals.length) day.progress.push(0);
  while(day.progress.length > day.goals.length) day.progress.pop();

  day.goals.forEach((g, idx)=>{
    const row = document.createElement("div");
    row.className = "prog-row";

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = g;

    const range = document.createElement("input");
    range.type = "range"; range.min = 0; range.max = 100; range.value = day.progress[idx] || 0;
    range.addEventListener("input", e=>{
      day.progress[idx] = Number(e.target.value);
      value.textContent = day.progress[idx] + "%";
      dayPercentEl.textContent = avg(day.progress) + "%";
      renderCalendar(); // live update
    });

    const value = document.createElement("div");
    value.className = "value";
    value.textContent = (day.progress[idx]||0) + "%";

    row.appendChild(label);
    row.appendChild(range);
    row.appendChild(value);
    progressList.appendChild(row);
  });
}

// UI wiring
$("#addGoalBtn").addEventListener("click", ()=>{
  if(!currentKey) return;
  const day = getOrCreate(currentKey);
  day.goals.push("New goal");
  day.progress.push(0);
  renderGoals(day);
  renderProgress(day);
});

$("#saveDay").addEventListener("click", ()=>{
  if(!currentKey) return;
  save();
  renderCalendar();
  closeModal();
});
$("#resetDay").addEventListener("click", ()=>{
  if(!currentKey) return;
  if(!confirm("Reset this day's goals?")) return;
  state.data[currentKey] = { goals: [...DEFAULT_GOALS], progress: Array(DEFAULT_GOALS.length).fill(0) };
  save();
  renderCalendar();
  closeModal();
});
$("#closeModal").addEventListener("click", closeModal);
modal.addEventListener("click", e=> { if(e.target === modal) closeModal(); });

$("#prevMonth").addEventListener("click", ()=>{
  state.view.month--;
  if(state.view.month < 0){ state.view.month = 11; state.view.year--; }
  renderCalendar();
});
$("#nextMonth").addEventListener("click", ()=>{
  state.view.month++;
  if(state.view.month > 11){ state.view.month = 0; state.view.year++; }
  renderCalendar();
});

// init
load();
renderCalendar();
