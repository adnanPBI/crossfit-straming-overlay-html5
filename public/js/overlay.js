import {describeTimer,formatClock} from './timer-engine.js';
import {localeTag,t} from './i18n.js';
import {beep} from './api.js';

const $=(id)=>document.getElementById(id);
const stage=$('stage');
const params=new URLSearchParams(location.search);
const isPreview=params.has('preview');
const outputBg=['black','green'].includes(params.get('bg'))?params.get('bg'):'transparent';
stage.style.backgroundColor=outputBg==='green'?'#00ff00':outputBg==='black'?'#000':'transparent';
let latest=null,offset=0,lastPhase=null,lastStatus='idle',initialized=false;
let lang='de';
let previousClockText='',lastClockSecond=-1;
const typeColors={};
function show(element,visible){element.classList.toggle('is-hidden',!visible);element.setAttribute('aria-hidden',String(!visible));}
function style(el,style){Object.assign(el.style,style);}
function assignFont(target,font){target.classList.remove('font-sans','font-condensed','font-serif','font-mono');target.classList.add(`font-${font}`);}
function setText(id,value){const element=$(id);if(element)element.textContent=value||'';}
function settingsChanged(settings){
  const {appearance:a,left:l,middle:m,right:r,timerSettings:ts}=settings;
  lang=settings.language;previousClockText='';lastClockSecond=-1;
  document.documentElement.lang=lang;
  style(stage,{
    '--accent':a.accentColor,
    '--primary':ts.primaryColor,
    '--left-width':`${a.leftWidth}%`,
    '--right-width':`${a.rightWidth}%`,
    '--opacity':a.panelOpacity/100,
    '--timer-size':`${ts.fontSize}px`,
    '--left-font':`${l.fontSize}px`,
    '--right-font':`${r.fontSize}px`,
    '--left-color':l.color,
    '--right-color':r.color,
    '--scrim-left':a.leftScrim/100,
    '--scrim-center':a.centerScrim/100,
    '--scrim-right':a.rightScrim/100
  });
  stage.classList.toggle('no-panel-bg',a.hidePanelBackground);
  stage.classList.toggle('no-animation',!a.animations);
  stage.classList.toggle('no-text-shadow',!a.textShadow);
  style($('leftZone'),{textAlign:l.align});
  style($('rightZone'),{textAlign:r.align});
  assignFont($('brandTitle'),l.font);
  assignFont($('brandCustom'),l.font);
  assignFont($('wodText'),r.font);
  assignFont($('wodTitle'),r.font);
  const logo=l.logoDataUrl;
  show($('logoWrap'),l.showLogo && !!logo);
  if(logo && $('brandLogo').getAttribute('src')!==logo)$('brandLogo').src=logo;
  show($('brandLabel'),l.showBrand);setText('brandLabel',l.brand);
  show($('brandTitle'),l.showTitle);setText('brandTitle',l.title);
  show($('brandSubtitle'),l.showSubtitle);setText('brandSubtitle',l.subtitle);
  show($('brandCustom'),l.showCustom);setText('brandCustom',l.customText);
  show($('athleteBadge'),l.showAthlete && !!l.athlete);setText('athleteBadge',l.athlete);
  show($('timerBig'),m.showTimer);
  show($('phasePill'),m.showPhase);
  show($('roundLabel'),m.showRound);
  show($('progressWrap'),m.showProgress);
  show($('centerCaption'),m.showCaption);setText('centerCaption',m.caption);
  show($('capBadge'),m.showTimeCap && ts.timeCapSec>0);
  setText('capBadge',`${t(lang,'capLabel')} · ${formatClock(ts.timeCapSec*1000)}`);
  show($('wodSection'),r.showWod);setText('wodTitle',r.wodTitle);setText('wodText',r.wodText);
  show($('coachSection'),r.showCoach);setText('coachLabel',t(lang,'coachLabel'));setText('coachName',r.coach);
  show($('notesSection'),r.showNotes);setText('notesText',r.notes);
  show($('clockSection'),r.showClock);setText('localClockLabel',t(lang,'clockLabel'));
  show($('sponsorWrap'),r.showSponsor && !!r.sponsorDataUrl);
  if(r.sponsorDataUrl && $('sponsorLogo').getAttribute('src')!==r.sponsorDataUrl)$('sponsorLogo').src=r.sponsorDataUrl;
  $('sponsorLogo').style.maxHeight=`${r.sponsorHeight}px`;
  show($('tickerBar'),r.showTicker && !!r.tickerText.trim());setText('tickerText',r.tickerText);
  setText('progressLead',t(lang,'current'));
  setText('phaseKicker',`WOD / ${t(lang,'status').toUpperCase()}`);
  $('brandLogo').style.objectPosition=l.align==='right'?'right center':l.align==='center'?'center center':'left center';
}
function tick(){
  if(!latest)return;
  const {settings,timer}=latest;
  const now=Date.now()+offset;
  const d=describeTimer(timer,settings.timerSettings,now);
  const phase=d.phase;
  const mode=settings.timerSettings.mode;
  const state=d.status;
  const isFinished=d.finished;
  const title=state==='idle'?t(lang,'standby'):isFinished?t(lang,'completed'):state==='paused'?t(lang,'paused'):phase?t(lang,phase.type==='sequence'?'sequencePhase':phase.type):t(lang,'standby');
  setText('phasePill',title);
  const elapsed=d.displayMs;
  const clockText=formatClock(elapsed,d.countUp);
  setText('timerBig',clockText);
  if(clockText.length!==previousClockText.length){
    const timerNode=$('timerBig');
    const baseSize=settings.timerSettings.fontSize;
    timerNode.style.fontSize=`${baseSize}px`;
    const available=Math.max(80,$('middleZone').clientWidth-90);
    const textWidth=timerNode.getBoundingClientRect().width;
    if(textWidth>available)timerNode.style.fontSize=`${Math.max(32,Math.floor(baseSize*available/textWidth))}px`;
    previousClockText=clockText;
  }
  if(phase && phase.type!=='prepare')setText('roundLabel',`${t(lang,'roundLabel')} ${String(phase.index).padStart(2,'0')} / ${String(phase.count).padStart(2,'0')}`);
  else setText('roundLabel',t(lang,'standby'));
  const percent=Math.min(100,Math.max(0,Math.round(d.currentProgress*100)));
  $('progressFill').style.width=`${percent}%`;
  setText('progressPercent',`${percent}%`);
  let color=settings.timerSettings.primaryColor;
  if(phase?.type==='rest')color=settings.timerSettings.restColor;
  else if(phase?.type==='prepare')color=settings.timerSettings.warningColor;
  else if(settings.timerSettings.trafficLights && phase && Number.isFinite(phase.durationMs) && !isFinished){
    if(d.remainingMs<=settings.timerSettings.redSec*1000)color=settings.timerSettings.dangerColor;
    else if(d.remainingMs<=settings.timerSettings.yellowSec*1000)color=settings.timerSettings.warningColor;
  }
  if(isFinished)color=settings.timerSettings.primaryColor;
  stage.style.setProperty('--current-color',color);
  typeColors.current=color;
  const activeId=phase?.id||'none';
  if(initialized && timer.status==='running' && settings.timerSettings.sound && !isPreview && lastPhase!==null && activeId!==lastPhase) {
    beep(phase?.type==='rest'?520:phase?.type==='prepare'?650:830,.17,settings.timerSettings.beepVolume/100);
  }
  if(initialized && settings.timerSettings.sound && !isPreview && isFinished && lastStatus==='running')beep(1100,.3,settings.timerSettings.beepVolume/100);
  initialized=true;lastPhase=activeId;lastStatus=state;
  const date=new Date(now);
  if(lastClockSecond!==Math.floor(now/1000)){
    lastClockSecond=Math.floor(now/1000);
    try{setText('localClock',new Intl.DateTimeFormat(localeTag[lang]||'en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:!settings.appearance.clock24}).format(date));}
    catch{setText('localClock',date.toLocaleTimeString());}
  }
}
function applySnapshot(data){
  if(!data?.settings || !data?.timer)return;
  const changed=!latest || JSON.stringify(latest.settings)!==JSON.stringify(data.settings);
  latest=data;offset=data.serverNow-Date.now();
  if(changed)settingsChanged(data.settings);
  tick();
}
async function start(){
  try{
    const response=await fetch('/api/state',{cache:'no-store'});
    if(!response.ok)throw new Error('Server unavailable');
    applySnapshot(await response.json());
  }catch(e){console.warn('Initial state unavailable:',e);}
  const eventSource=new EventSource('/api/events');
  eventSource.addEventListener('snapshot',(event)=>{
    try{applySnapshot(JSON.parse(event.data));}catch(e){console.warn('Bad stream update',e);}
  });
  eventSource.addEventListener('error',()=>console.warn('Overlay sync reconnecting'));
  setInterval(tick,90);
}
void start();
