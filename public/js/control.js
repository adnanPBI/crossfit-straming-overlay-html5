import {Api,beep} from './api.js';
import {describeTimer,formatClock} from './timer-engine.js';
import {t,translateDocument} from './i18n.js';

const api=new Api();
const $=(s)=>document.querySelector(s);
const $$=(s)=>[...document.querySelectorAll(s)];
let current=null,offset=0,lang='de',scenes=[],authorized=false,lastScenes='',toastTimeout=null;
let pending={},pendingTimer=null,patchQueue=Promise.resolve();

function notify(message,isError=false){
  const box=$('#toast');box.textContent=message;box.classList.toggle('error',isError);box.classList.add('show');
  clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>box.classList.remove('show'),3200);
}
function setConnected(online){
  $('#connectionDot').classList.toggle('online',online);
  $('#connectionText').textContent=t(lang,online?'live':'offline');
}
function switchTab(id){
  $$('.nav-button').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));
  $$('.editor-panel').forEach(x=>x.classList.toggle('hidden',x.id!==`panel-${id}`));
  $('#breadcrumbActive').textContent=$(`[data-tab="${id}"] [data-t]`)?.textContent.toUpperCase()||id.toUpperCase();
  if(id==='scenes' && authorized)void refreshScenes();
}
function deepGet(obj,path){return path.split('.').reduce((v,key)=>v?.[key],obj);}
function deepPatch(path,value){
  const pieces=path.split('.'), out={};let current=out;
  for(let i=0;i<pieces.length-1;i++){current[pieces[i]]={};current=current[pieces[i]];}
  current[pieces.at(-1)]=value;
  return out;
}
function assignPatch(target,src){
  for(const [k,v] of Object.entries(src)){
    if(v && typeof v==='object' && !Array.isArray(v)) {target[k]??={};assignPatch(target[k],v);}
    else target[k]=v;
  }
}
function updateOutputs(){
  if(!current)return;
  const {leftWidth,rightWidth}=current.settings.appearance;
  const middle=100-leftWidth-rightWidth;
  $('#middleWidthOutput').textContent=`${middle}%`;
  $('#leftBar').style.width=`${leftWidth}%`;
  $('#centerBar').style.width=`${middle}%`;
  $('#rightBar').style.width=`${rightWidth}%`;
  for(const element of $$('[data-output]')){
    const val=deepGet(current.settings,element.dataset.output);
    element.textContent=element.dataset.output.startsWith('appearance.')?`${val}%`:String(val);
  }
}
function updateLogo(){
  const url=current?.settings?.left?.logoDataUrl;
  const box=$('#logoPreview');
  if(url){const img=document.createElement('img');img.src=url;img.alt='Selected logo';box.replaceChildren(img);}
  else {const span=document.createElement('span');span.textContent='+';box.replaceChildren(span);}
}
function updateMode(){
  const mode=current?.settings?.timerSettings?.mode||'intervals';
  $$('.mode-field').forEach(element=>element.classList.toggle('hidden',!element.dataset.modes.split(' ').includes(mode)));
}
function populate(){
  if(!current)return;
  lang=current.settings.language||'de';
  translateDocument(document,lang);
  $('#languageSelect').value=lang;
  for(const element of $$('[data-path]')){
    const value=deepGet(current.settings,element.dataset.path);
    if(value===undefined || element===document.activeElement)continue;
    if(element.type==='checkbox')element.checked=!!value;
    else element.value=String(value);
  }
  updateOutputs();updateMode();updateLogo();setConnected($('#connectionDot').classList.contains('online'));
}
function updateTransport(){
  if(!current)return;
  const d=describeTimer(current.timer,current.settings.timerSettings,Date.now()+offset);
  const status=d.status;
  $('#statusLabel').textContent=t(lang,status);
  $('#timerIndicator').style.background=status==='paused'?'#ffd26b':status==='finished'?'#ff7587':'#b5fa69';
  $('#mainTime').textContent=formatClock(d.displayMs,d.countUp);
  const phase=d.phase;
  const name=status==='idle'?t(lang,'standby'):status==='finished'?t(lang,'completed'):phase?t(lang,phase.type==='sequence'?'sequencePhase':phase.type):t(lang,'standby');
  $('#phaseLabel').textContent=name;
  $('#roundDisplay').textContent=phase && phase.type!=='prepare'?`${t(lang,'round')} ${String(phase.index).padStart(2,'0')} / ${String(phase.count).padStart(2,'0')}`:'—';
  const running=status==='running';
  $('#startPauseText').textContent=t(lang,running?'pause':status==='paused'?'resume':'start');
  $('#startPauseIcon').textContent=running?'Ⅱ':'▶';
}
function renderScenes(){
  const container=$('#sceneList');container.replaceChildren();
  for(const scene of scenes){
    const item=document.createElement('div');item.className='scene-row';
    const glyph=document.createElement('div');glyph.className='scene-glyph';glyph.textContent='▤';
    const desc=document.createElement('div');desc.className='scene-detail';
    const strong=document.createElement('strong');strong.textContent=scene.name;
    const small=document.createElement('small');small.textContent=t(lang,scene.id.startsWith('preset-')?'builtin':'saved');
    desc.append(strong,small);
    const load=document.createElement('button');load.className='control-btn';load.textContent=t(lang,'loadScene');load.addEventListener('click',()=>void run(async()=>{await flushPatch();await api.loadScene(scene.id);notify(t(lang,'sceneLoaded'));}));
    item.append(glyph,desc,load);
    if(!scene.id.startsWith('preset-')){
      const del=document.createElement('button');del.className='control-btn delete-scene';del.textContent='×';del.setAttribute('aria-label',t(lang,'deleteScene'));
      del.addEventListener('click',()=>void run(async()=>{
        if(!confirm(t(lang,'confirmDelete')))return;
        await api.deleteScene(scene.id);await refreshScenes();notify(t(lang,'sceneDeleted'));
      }));item.append(del);
    }
    container.append(item);
  }
  if(!scenes.length){const empty=document.createElement('p');empty.textContent=t(lang,'noScenes');container.append(empty);}
}
async function refreshScenes(){
  if(!authorized)return;
  try{const reply=await api.getScenes();scenes=reply.scenes;lastScenes=JSON.stringify(scenes);renderScenes();}catch(e){notify(e.message,true);}
}
function applySnapshot(data){
  if(!data?.settings)return;
  current=data;
  offset=data.serverNow-Date.now();
  populate();updateTransport();
  if(Array.isArray(data.scenes)){
    const next=JSON.stringify(data.scenes);
    if(next!==lastScenes){scenes=data.scenes;lastScenes=next;renderScenes();}
  }
}
async function run(fn){
  if(!authorized){notify(t(lang,'notConnected'),true);$('#loginOverlay').classList.remove('hidden');return;}
  try{await fn();}catch(e){notify(e.message||t(lang,'error'),true);}
}
function schedulePatch(path,value){
  if(!authorized){notify(t(lang,'notConnected'),true);return;}
  assignPatch(pending,deepPatch(path,value));
  // Numeric timer fields are committed on change; text is debounced for live editing.
  clearTimeout(pendingTimer);pendingTimer=setTimeout(()=>void flushPatch(),330);
}
function flushPatch(){
  clearTimeout(pendingTimer);
  if(!Object.keys(pending).length)return patchQueue;
  const patch=pending;pending={};
  patchQueue=patchQueue.catch(()=>{}).then(async()=>{
    try{const result=await api.patch(patch);applySnapshot(result);}
    catch(e){notify(`${t(lang,'saveFail')}: ${e.message}`,true); if(current)populate();}
  });
  return patchQueue;
}
function valueFromInput(element){
  if(element.type==='checkbox')return element.checked;
  if(element.type==='number'||element.type==='range'){
    if(element.value==='')return null;
    return Number(element.value);
  }
  return element.value;
}
function setupInputs(){
  for(const element of $$('[data-path]')){
    const onInput=()=>{
      const value=valueFromInput(element);
      if(value===null || (typeof value==='number'&&!Number.isFinite(value)))return;
      const path=element.dataset.path;
      if(path==='timerSettings.mode' && current){current.settings.timerSettings.mode=value;updateMode();}
      if(path.startsWith('appearance.')&&current){
        current.settings.appearance[path.split('.')[1]]=value;
        if(current.settings.appearance.leftWidth+current.settings.appearance.rightWidth>75){
          const other=path.endsWith('leftWidth')?'rightWidth':'leftWidth';
          current.settings.appearance[other]=75-value;
          schedulePatch(`appearance.${other}`,75-value);
        }
        updateOutputs();
      }
      if(path==='timerSettings.fontSize'){};
      schedulePatch(path,value);
    };
    const event=(element.type==='checkbox'||element.type==='color'||element.tagName==='SELECT'||element.type==='number')?'change':'input';
    element.addEventListener(event,onInput);
    if(element.type==='range')element.addEventListener('input',onInput);
  }
  $('#languageSelect').addEventListener('change',(e)=>{
    if(!current)return;
    lang=e.target.value;
    current.settings.language=lang;
    translateDocument(document,lang);updateTransport();renderScenes();
    schedulePatch('language',lang);
  });
}
function setupPreview(){
  const frame=$('.video-frame');
  const update=()=>frame.style.setProperty('--preview-scale',String(frame.clientWidth/1920));
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(update).observe(frame);
  window.addEventListener('resize',update);update();
}
async function setupLogin(){
  if(api.key){
    try{await api.auth(api.key);authorized=true;$('#loginOverlay').classList.add('hidden');await refreshScenes();return;}
    catch{api.key='';sessionStorage.removeItem('wod-control-key');}
  }
  $('#loginOverlay').classList.remove('hidden');
  $('#loginForm').addEventListener('submit',async(event)=>{
    event.preventDefault();$('#loginError').textContent='';
    try{
      await api.auth($('#keyInput').value.trim());authorized=true;
      $('#loginOverlay').classList.add('hidden');notify(t(lang,'connected'));await refreshScenes();
    }catch{api.key='';$('#loginError').textContent=t(lang,'invalidKey');}
  });
}
function setupButtons(){
  $('#startPauseBtn').addEventListener('click',()=>void run(async()=>{await flushPatch();await api.timer(current?.timer?.status==='running'?'pause':'start');}));
  $('#resetBtn').addEventListener('click',()=>void run(async()=>{await flushPatch();await api.timer('reset');}));
  $('#nextBtn').addEventListener('click',()=>void run(async()=>{await flushPatch();await api.timer('next');}));
  $('#beepBtn').addEventListener('click',()=>beep());
  $('#saveSceneBtn').addEventListener('click',()=>void run(async()=>{
    await flushPatch();const input=$('#sceneName');const name=input.value.trim();if(!name)return input.focus();
    await api.scene(name);input.value='';await refreshScenes();notify(t(lang,'sceneSaved'));
  }));
  $('#restoreBtn').addEventListener('click',()=>void run(async()=>{
    if(!confirm(t(lang,'restoreConfirm')))return;
    pending={};await patchQueue.catch(()=>{});await api.restore();notify(t(lang,'savedMessage'));
  }));
  $('#exportBtn').addEventListener('click',()=>void run(async()=>{
    await flushPatch();const backup=await api.export();const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`wod-overlay-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }));
  $('#importBtn').addEventListener('click',()=>$('#importFile').click());
  $('#importFile').addEventListener('change',(e)=>void run(async()=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>58_000_000)throw new Error('Backup exceeds 58 MB limit');
    const data=JSON.parse(await file.text());await api.import(data);await refreshScenes();notify(t(lang,'imported'));e.target.value='';
  }));
  $('#uploadLogoBtn').addEventListener('click',()=>$('#logoFile').click());
  $('#logoFile').addEventListener('change',(e)=>void run(async()=>{
    const file=e.target.files?.[0];if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2_000_000){notify(t(lang,'badImage'),true);return;}
    const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
    await flushPatch();await api.patch({left:{logoDataUrl:base64,showLogo:true}});e.target.value='';notify(t(lang,'savedMessage'));
  }));
  $('#removeLogoBtn').addEventListener('click',()=>void run(async()=>{await flushPatch();await api.patch({left:{logoDataUrl:''}});notify(t(lang,'savedMessage'));}));
  $('#copyOverlayBtn').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(`${location.origin}/overlay`);notify(t(lang,'copied'));}
    catch{notify(`${location.origin}/overlay`);}
  });
  $$('.nav-button').forEach(button=>button.addEventListener('click',()=>switchTab(button.dataset.tab)));
  document.addEventListener('keydown',(e)=>{
    const tag=document.activeElement?.tagName;
    if(['INPUT','TEXTAREA','SELECT'].includes(tag)||e.altKey||e.metaKey||e.ctrlKey||!authorized)return;
    const key=e.key.toLowerCase();
    if(key===' '){e.preventDefault();$('#startPauseBtn').click();}
    else if(key==='r'){$('#resetBtn').click();}
    else if(key==='n'){$('#nextBtn').click();}
  });
}
function connectStream(){
  const events=new EventSource('/api/events');
  events.addEventListener('snapshot',(event)=>{
    try{applySnapshot(JSON.parse(event.data));setConnected(true);}catch(e){console.warn('Invalid SSE snapshot',e);}
  });
  events.addEventListener('open',()=>setConnected(true));
  events.addEventListener('error',()=>setConnected(false));
}

async function start(){
  setupInputs();setupPreview();setupButtons();
  try{applySnapshot(await api.getState());setConnected(true);}catch(e){notify(e.message,true);}
  connectStream();await setupLogin();
  setInterval(updateTransport,110);
}
void start();
