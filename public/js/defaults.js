import {DEFAULT_TIMER_SETTINGS, normalizeTimerSettings} from './timer-engine.js';

export const LANGUAGES = ['de','en','fr','es','it','pt'];
const COLORS = /^#[0-9a-f]{6}$/i;
const FONT_OPTIONS = ['sans','condensed','serif','mono'];
const ALIGN_OPTIONS = ['left','center','right'];
export const DEFAULT_SETTINGS = {
  language:'de',
  appearance: {leftWidth:25,rightWidth:30,panelOpacity:77,animations:true,hidePanelBackground:false,accentColor:'#7cfaab'},
  left: {
    showLogo:true,logoDataUrl:'/sample-logo.png',showBrand:true,brand:'CROSSFIT / LIVE',
    showTitle:true,title:'THE DAILY GRIND',showSubtitle:true,subtitle:'STRENGTH · ENGINE · COMMUNITY',
    showCustom:true,customText:'PUSH YOUR LIMITS.\nOWN EVERY REP.',
    font:'condensed',fontSize:62,color:'#f5f7fc',align:'left'
  },
  middle:{showTimer:true,showPhase:true,showRound:true,showProgress:true,showCaption:true,
    caption:'EVERY SECOND COUNTS',showTimeCap:true},
  right:{showWod:true,wodTitle:'TODAY’S WOD',wodText:'5 ROUNDS FOR TIME\n20 Air Squats\n15 Burpees\n10 Pull-ups',
    showCoach:true,coach:'COACH ALEX',showNotes:true,notes:'Move well. Scale smart.\nStay hydrated.',
    showClock:true,font:'sans',fontSize:30,color:'#f5f7fc',align:'left'},
  timerSettings:{...DEFAULT_TIMER_SETTINGS}
};
export const BUILTIN_SCENES = [
  {id:'preset-competition',name:'Competition',createdAt:'2026-01-01T00:00:00.000Z',settings: structuredClone(DEFAULT_SETTINGS)},
  {id:'preset-minimal',name:'Minimal',createdAt:'2026-01-01T00:00:00.000Z',settings:{...structuredClone(DEFAULT_SETTINGS),
    appearance:{...DEFAULT_SETTINGS.appearance,leftWidth:22,rightWidth:22,panelOpacity:52},
    left:{...DEFAULT_SETTINGS.left,showSubtitle:false,showCustom:false,title:'WOD LIVE'},
    right:{...DEFAULT_SETTINGS.right,showNotes:false,showCoach:false}}}
];

const str=(s,max,fallback='')=>typeof s==='string'?s.slice(0,max):fallback;
const num=(s,min,max,fallback)=>Number.isFinite(Number(s))?Math.min(max,Math.max(min,Math.round(Number(s)))):fallback;
const choice=(s,choices,otherwise)=>choices.includes(s)?s:otherwise;
const color=(s,otherwise)=>typeof s==='string' && COLORS.test(s)?s:otherwise;
const bool=(s,otherwise)=>typeof s==='boolean'?s:otherwise;

/** Only schema-declared settings are accepted, blocking unknown keys/prototype pollution. */
export function mergeKnown(base,patch,schema=DEFAULT_SETTINGS) {
  if (!patch || typeof patch!=='object' || Array.isArray(patch)) return structuredClone(base);
  const out=structuredClone(base);
  for (const key of Object.keys(schema)) {
    if (!Object.prototype.hasOwnProperty.call(patch,key)) continue;
    const p=patch[key], reference=schema[key];
    if(reference && typeof reference==='object' && !Array.isArray(reference)) {
      if (p && typeof p==='object' && !Array.isArray(p)) out[key]=mergeKnown(out[key],p,reference);
    } else if(typeof p===typeof reference) out[key]=p;
  }
  return out;
}

export function validImageData(value) {
  if (value==='' || value==='/sample-logo.png') return true;
  if (typeof value!=='string' || value.length>3000000) return false;
  const match=/^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  const raw=Buffer.from(match[2],'base64');
  if(raw.length<24 || raw.length>2_000_000) return false;
  const type=match[1];
  if(type==='png') return raw.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
  if(type==='jpeg') return raw[0]===255 && raw[1]===216 && raw[2]===255;
  return raw.toString('ascii',0,4)==='RIFF' && raw.toString('ascii',8,12)==='WEBP';
}

export function normalizeSettings(input={}) {
  const d=DEFAULT_SETTINGS, x=mergeKnown(d,input);
  const a=x.appearance,l=x.left,r=x.right,m=x.middle;
  const leftWidth=num(a.leftWidth,15,45,d.appearance.leftWidth);
  const rightWidth=Math.min(num(a.rightWidth,15,45,d.appearance.rightWidth),75-leftWidth);
  if(!validImageData(l.logoDataUrl)) throw new Error('Logo must be a PNG, JPEG or WebP smaller than 2 MB');
  return {
    language:choice(x.language,LANGUAGES,d.language),
    appearance:{leftWidth,rightWidth,panelOpacity:num(a.panelOpacity,0,95,77),
      animations:bool(a.animations,true),hidePanelBackground:bool(a.hidePanelBackground,false),
      accentColor:color(a.accentColor,d.appearance.accentColor)},
    left:{showLogo:bool(l.showLogo,true),logoDataUrl:l.logoDataUrl,
      showBrand:bool(l.showBrand,true),brand:str(l.brand,120),
      showTitle:bool(l.showTitle,true),title:str(l.title,150),
      showSubtitle:bool(l.showSubtitle,true),subtitle:str(l.subtitle,180),
      showCustom:bool(l.showCustom,true),customText:str(l.customText,1500),
      font:choice(l.font,FONT_OPTIONS,'condensed'),fontSize:num(l.fontSize,24,120,62),
      color:color(l.color,'#f5f7fc'),align:choice(l.align,ALIGN_OPTIONS,'left')},
    middle:{showTimer:bool(m.showTimer,true),showPhase:bool(m.showPhase,true),
      showRound:bool(m.showRound,true),showProgress:bool(m.showProgress,true),
      showCaption:bool(m.showCaption,true),caption:str(m.caption,150),showTimeCap:bool(m.showTimeCap,true)},
    right:{showWod:bool(r.showWod,true),wodTitle:str(r.wodTitle,120),wodText:str(r.wodText,2500),
      showCoach:bool(r.showCoach,true),coach:str(r.coach,120),
      showNotes:bool(r.showNotes,true),notes:str(r.notes,1000),
      showClock:bool(r.showClock,true),font:choice(r.font,FONT_OPTIONS,'sans'),
      fontSize:num(r.fontSize,18,80,30),color:color(r.color,'#f5f7fc'),
      align:choice(r.align,ALIGN_OPTIONS,'left')},
    timerSettings:normalizeTimerSettings(x.timerSettings)
  };
}

export function createInitialData(){
  return {
    settings:normalizeSettings(DEFAULT_SETTINGS),
    timer:{status:'idle',elapsedMs:0,anchorMs:null},
    scenes:structuredClone(BUILTIN_SCENES)
  };
}
