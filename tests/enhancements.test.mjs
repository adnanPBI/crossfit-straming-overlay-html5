import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {parseWorkoutFormula} from '../public/js/formula-v2.js';
import {parseFormula,buildTimeline,normalizeTimerSettings,describeTimer} from '../public/js/timer-engine.js';
import {normalizeSettings} from '../public/js/defaults.js';
import {createAppServer} from '../server.mjs';

const SECRET='integration-enhancement-control-key-321';

const cases=[
  ['20/10*8',16,[20,10,20,10],['work','rest','work','rest']],
  ['(arbeit 40 + pause 20)*8',16,[40,20,40,20],['work','rest','work','rest']],
  ['(travail 40 + repos 20) * 2',4,[40,20,40,20],['work','rest','work','rest']],
  ['1h2m3s',1,[3723],['sequence']],
  ['2m30',1,[150],['sequence']],
  ['1:00*12',12,[60,60,60,60],['sequence','sequence','sequence','sequence']],
  ['4*(1m+30)',8,[60,30,60,30],['sequence','sequence','sequence','sequence']],
];
test('imported Grok sequence grammar accepts labeled, paired and shorthand workouts',()=>{
  for(const [formula,length,sec,type] of cases){
    const phases=parseWorkoutFormula(formula);
    assert.equal(phases.length,length,formula);
    assert.deepEqual(phases.slice(0,4).map(p=>p.seconds),sec,formula);
    assert.deepEqual(phases.slice(0,4).map(p=>p.type),type,formula);
    assert.deepEqual(parseFormula(formula),phases.map(p=>p.seconds));
  }
});
test('grammar rejects unbounded repeat, invalid labels, bad clocks and abuse',()=>{
  for(const value of ['', '0','20/10*300','100*(1m+1m+1m)','(40+30', '1:99', 'pause 0', 'evil 20','2m + alert(1)','1m**2', '1h2m3s4','x+20','work 20/ rest 20/3'])assert.throws(()=>parseWorkoutFormula(value),value);
});
test('new timer modes have deterministic schedule, direction and interval bounds',()=>{
  const a=buildTimeline({mode:'tabata',leadSec:0,timeCapSec:0});
  assert.equal(a.segments.length,16);assert.equal(a.totalMs,240000);
  assert.deepEqual(a.segments.slice(0,4).map(x=>x.seconds),[20,10,20,10]);
  const e=buildTimeline({mode:'emom',leadSec:0,emomSec:90,emomRounds:3,timeCapSec:0});
  assert.equal(e.totalMs,270000);assert.deepEqual(e.segments.map(x=>x.index),[1,2,3]);
  const m=buildTimeline({mode:'amrap',leadSec:0,durationSec:720,timeCapSec:0});
  assert.equal(m.totalMs,720000);
  assert.equal(describeTimer({status:'running',elapsedMs:10000,anchorMs:1000},m.config,1000).countUp,false);
  const f=buildTimeline({mode:'fortime',leadSec:0,timeCapSec:0});
  assert.equal(f.finite,false);
  assert.equal(describeTimer({status:'running',elapsedMs:10000,anchorMs:1000},f.config,1000).countUp,true);
  assert.equal(normalizeTimerSettings({mode:'emom',emomRounds:1000}).emomRounds,99);
  const thresholds=normalizeTimerSettings({yellowSec:66,redSec:-1,beepVolume:103});
  assert.deepEqual([thresholds.yellowSec,thresholds.redSec,thresholds.beepVolume],[60,0,100]);
});
test('visual enhancements normalize safely and protect sponsor uploads',()=>{
  const s=normalizeSettings({appearance:{leftScrim:-100,centerScrim:160,rightScrim:44,clock24:false,textShadow:false},left:{athlete:'HEAT 3'},right:{tickerText:'NEXT CLASS',showTicker:true,showSponsor:false}});
  assert.equal(s.appearance.leftScrim,0);assert.equal(s.appearance.centerScrim,85);
  assert.equal(s.appearance.rightScrim,44);assert.equal(s.appearance.clock24,false);
  assert.equal(s.left.athlete,'HEAT 3');assert.equal(s.right.showTicker,true);
  assert.throws(()=>normalizeSettings({right:{sponsorDataUrl:'javascript:alert(1)'}}));
  assert.throws(()=>normalizeSettings({right:{sponsorDataUrl:'data:image/svg+xml;base64,abc'}}));
});
test('authenticated remote rewind, new assets, saved scenes and persistence',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'wod-enhanced-test-'));
  const app=await createAppServer({host:'127.0.0.1',port:0,key:SECRET,dataDir:dir});
  const base=`http://127.0.0.1:${app.port}`;
  const req=async(path,data,auth=true,method='POST')=>{
    const r=await fetch(base+path,{method,headers:{...(auth?{'X-Overlay-Key':SECRET}:{}),'Content-Type':'application/json'},body:JSON.stringify(data)});
    return {status:r.status,body:await r.json()};
  };
  try{
    assert.equal((await fetch(base+'/api/health').then(x=>x.json())).version,'2.0.0');
    for(const route of ['/remote','/js/remote.js','/css/remote.css','/js/formula-v2.js','/overlay?bg=green','/overlay?bg=black'])assert.equal((await fetch(base+route)).status,200,route);
    assert.equal((await req('/api/timer',{action:'previous'},false)).status,401);
    const patch={timerSettings:{mode:'emom',emomSec:2,emomRounds:4,leadSec:0,timeCapSec:0},left:{athlete:'HEAT 2'},right:{tickerText:'HEAT 2 UP NEXT',showTicker:true}};
    const updated=await req('/api/settings',{patch},true,'PATCH');assert.equal(updated.status,200);
    assert.equal(updated.body.settings.timerSettings.mode,'emom');
    assert.equal((await req('/api/timer',{action:'previous'})).status,400);
    assert.equal((await req('/api/timer',{action:'start'})).status,200);
    const forward=await req('/api/timer',{action:'next'});assert.equal(forward.status,200);assert.equal(forward.body.timer.elapsedMs,2000);
    const backward=await req('/api/timer',{action:'previous'});assert.equal(backward.status,200);assert.equal(backward.body.timer.elapsedMs,0);
    const saved=await req('/api/scenes',{name:'Heat scene'});assert.equal(saved.status,201);
    const exported=await fetch(base+'/api/export',{headers:{'X-Overlay-Key':SECRET}}).then(x=>x.json());
    assert.equal(exported.activeSceneId,saved.body.scene.id);
    assert.equal(exported.scenes.at(-1).settings.left.athlete,'HEAT 2');
    assert.equal(exported.scenes.at(-1).settings.right.tickerText,'HEAT 2 UP NEXT');
  }finally{await app.close();await rm(dir,{recursive:true,force:true});}
});

test('Timer-only preset strips side graphics while preserving the interval engine',async()=>{
  const {BUILTIN_SCENES}=await import('../public/js/defaults.js');
  const scene=BUILTIN_SCENES.find(x=>x.id==='preset-timer-only');
  assert.ok(scene);assert.equal(scene.settings.left.showAthlete,false);assert.equal(scene.settings.right.showWod,false);
  const phase=buildTimeline(scene.settings.timerSettings);assert.equal(phase.segments.length,2);
});
