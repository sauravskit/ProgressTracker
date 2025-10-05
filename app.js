/* Daily Flame Tracker with hardcoded GitHub Gist sync */
const STORAGE_KEY='dailyFlameTracker';
const DEFAULT_GOALS=['Java theory & project','Coding','Health','Water (5L)','Sleep (6h)'];
let state={data:{},view:{year:new Date().getFullYear(),month:new Date().getMonth()}};
const $=s=>document.querySelector(s);
function load(){try{state.data=JSON.parse(localStorage.getItem(STORAGE_KEY))?.data||{}}catch(e){state.data={}}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify({data:state.data}))}
function dateKey(d){return d.toISOString().slice(0,10)}
function avg(a){return Math.round(a.reduce((x,y)=>x+Number(y),0)/a.length)||0}
function getOrCreate(k){if(!state.data[k])state.data[k]={goals:[...DEFAULT_GOALS],progress:Array(DEFAULT_GOALS.length).fill(0)};return state.data[k]}
function renderCalendar(){const g=$('#grid');g.innerHTML='';const y=state.view.year,m=state.view.month;const f=new Date(y,m,1),l=new Date(y,m+1,0);$('#monthLabel').textContent=f.toLocaleString(undefined,{month:'long',year:'numeric'});for(let i=0;i<f.getDay();i++){const b=document.createElement('div');b.className='day';b.style.visibility='hidden';g.appendChild(b)}for(let d=1;d<=l.getDate();d++){const dt=new Date(y,m,d);const k=dateKey(dt);const info=getOrCreate(k);const day=document.createElement('div');day.className='day';const n=document.createElement('div');n.className='date-num';n.textContent=d;day.appendChild(n);const p=avg(info.progress);const fdiv=document.createElement('div');fdiv.className='flame '+(p>=70?'high':p>=40?'mid':p>=15?'low':p>0?'vlow':'empty');fdiv.textContent='🔥';fdiv.onclick=()=>openModal(k);day.appendChild(fdiv);const pl=document.createElement('div');pl.textContent=p+'%';pl.style.textAlign='center';day.appendChild(pl);g.appendChild(day)}};
/* ---- Hardcoded GitHub Gist token ---- */
function getToken(){return "ghp_YOUR_TOKEN_HERE";} // Replace with your token locally
async function callGitHub(p,m='GET',body=null){const t=getToken();const h={'Accept':'application/vnd.github.v3+json','Authorization':'token '+t};const r=await fetch('https://api.github.com'+p,{method:m,headers:h,body:body?JSON.stringify(body):undefined});if(!r.ok)throw new Error('GitHub API error '+r.status);return r.json()}
async function createGist(){const b={description:'Daily Flame Tracker backup',public:false,files:{'daily-flame-tracker-backup.json':{content:JSON.stringify({data:state.data},null,2)}}};const j=await callGitHub('/gists','POST',b);$('#gistId').value=j.id;$('#gistStatus').textContent='Created gist '+j.id}
async function pushGist(){const id=$('#gistId').value.trim();if(!id)return alert('Enter or create gist ID');const b={files:{'daily-flame-tracker-backup.json':{content:JSON.stringify({data:state.data},null,2)}}};await callGitHub('/gists/'+id,'PATCH',b);$('#gistStatus').textContent='Pushed to gist.'}
async function loadGist(){const id=$('#gistId').value.trim();if(!id)return alert('Enter gist ID');const j=await callGitHub('/gists/'+id,'GET');const c=j.files['daily-flame-tracker-backup.json'].content;const d=JSON.parse(c);if(d.data){state.data=d.data;save();renderCalendar();$('#gistStatus').textContent='Loaded from gist.'}}
$('#createGist').onclick=createGist;$('#pushGist').onclick=pushGist;$('#loadGist').onclick=loadGist;
function openModal(k){alert('This demo omits modal logic for brevity. Focus is on gist sync.');}
load();renderCalendar();
