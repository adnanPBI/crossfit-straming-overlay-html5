import {Api,subscribeSnapshots} from './api.js';
import {describeTimer,formatClock} from './timer-engine.js';
import {t,translateDocument} from './i18n.js';
const api=new Api();
const $=id=>document.getElementById(id);
const LANGS=['de','en','fr','es','it','pt'];
let state=null,connected=false,authenticated=false,serverOffset=0,selectedLang='de',toastTimer=0;
function toast(message){const target=$('toast');target.textContent=message;target.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>target.classList.remove('visible'),3200);}
function online(next){connected=next;$('syncDot').classList.toggle('online',next);$('syncText').textContent=t(selectedLang,next?'live':'offline');}
function translate(lang){selectedLang=LANGS.includes(lang)?lang:'en';translateDocument(document,selectedLang);$('remoteLanguage').value=selectedLang;online(connected);renderSceneButtons();}
function renderSceneButtons(){
  const list=$('scenesList');list.replaceChildren();
  for(const item of state?.scenes||[]){
    const button=document.createElement('button');button.type='button';button.textContent=item.name;
    button.classList.toggle('active',item.id===state?.activeSceneId);
    button.setAttribute('aria-label',`${t(selectedLang,'loadScene')}: ${item.name}`);
    button.addEventListener('click',()=>void command(async()=>{await api.loadScene(item.id);toast(t(selectedLang,'sceneLoaded'));}));
    list.append(button);
  }
}
function snapshot(value){
  if(!value?.timer||!value?.settings)return;
  const changed=JSON.stringify(state?.scenes)!==JSON.stringify(value.scenes) || state?.activeSceneId!==value.activeSceneId;
  state=value;serverOffset=value.serverNow-Date.now();
  if(!authenticated && $('loginOverlay').hidden===true)void loginFromStorage();
  if(changed)renderSceneButtons();
  tick();
}
function tick(){
  if(!state)return;
  const config=state.settings.timerSettings;
  const desc=describeTimer(state.timer,config,Date.now()+serverOffset);
  const phase=desc.phase;
  const name=desc.status==='idle'?t(selectedLang,'standby'):desc.finished?t(selectedLang,'completed'):desc.status==='paused'?t(selectedLang,'paused'):phase?t(selectedLang,phase.type==='sequence'?'sequencePhase':phase.type):t(selectedLang,'standby');
  $('phaseName').textContent=name;
  $('timerReadout').textContent=formatClock(desc.displayMs,desc.countUp);
  $('roundReadout').textContent=phase?.type==='prepare'?'–':`${t(selectedLang,'round')} ${phase?.index||1} / ${phase?.count||1}`;
  const progress=Math.max(0,Math.min(100,Math.round(desc.currentProgress*100)));
  $('progressMeter').style.width=`${progress}%`;
  const danger=desc.remainingMs<=config.redSec*1000;const warning=desc.remainingMs<=config.yellowSec*1000;
  const color=phase?.type==='rest'?config.restColor:config.trafficLights && danger?config.dangerColor:config.trafficLights && warning?config.warningColor:config.primaryColor;
  $('timerReadout').style.color=color;$('phaseName').style.color=color;
  const running=state.timer.status==='running'&&!desc.finished;
  $('toggleBtn').textContent=t(selectedLang,running?'pause':state.timer.status==='paused'?'resume':'start');
}
async function command(task){
  if(!authenticated){$('loginOverlay').hidden=false;return;}
  try{await task();}catch(error){toast(error.message||t(selectedLang,'error'));if(error.status===401){authenticated=false;$('loginOverlay').hidden=false;}}
}
async function login(key){
  await api.auth(key);authenticated=true;$('loginOverlay').hidden=true;$('loginError').textContent='';toast(t(selectedLang,'connected'));
}
async function loginFromStorage(){
  if(!api.key)return;
  try{await login(api.key);}catch{authenticated=false;api.key='';sessionStorage.removeItem('wod-control-key');$('loginOverlay').hidden=false;}
}
async function main(){
  $('loginOverlay').hidden=false;
  try{const response=await api.getState();snapshot(response);translate(response.settings.language);}catch{online(false);}
  await loginFromStorage();
  $('loginForm').addEventListener('submit',async event=>{
    event.preventDefault();
    try{await login($('keyInput').value.trim());$('keyInput').value='';}catch{$('loginError').textContent=t(selectedLang,'invalidKey');}
  });
  $('remoteLanguage').addEventListener('change',event=>translate(event.target.value));
  $('toggleBtn').addEventListener('click',()=>void command(()=>api.timer(state?.timer?.status==='running'?'pause':'start')));
  $('resetBtn').addEventListener('click',()=>void command(()=>api.timer('reset')));
  $('nextBtn').addEventListener('click',()=>void command(()=>api.timer('next')));
  $('previousBtn').addEventListener('click',()=>void command(()=>api.timer('previous')));
  document.addEventListener('keydown',event=>{
    if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)||event.ctrlKey||event.metaKey||event.altKey)return;
    const key=event.key.toLowerCase();
    if(key===' '){event.preventDefault();$('toggleBtn').click();}
    else if(key==='r')$('resetBtn').click();
    else if(key==='n')$('nextBtn').click();
    else if(key==='b')$('previousBtn').click();
  });
  await subscribeSnapshots(value=>snapshot(value),value=>online(value));
  setInterval(tick,100);
}
void main();
