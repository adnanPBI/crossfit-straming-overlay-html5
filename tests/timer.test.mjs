import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDuration,parseFormula,normalizeTimerSettings,buildTimeline,describeTimer,formatClock} from '../public/js/timer-engine.js';
import {mergeKnown,normalizeSettings,DEFAULT_SETTINGS} from '../public/js/defaults.js';

test('duration expression supports seconds, minutes, and clock notation',()=>{
  assert.equal(parseDuration('30'),30);
  assert.equal(parseDuration('2m'),120);
  assert.equal(parseDuration('01:30'),90);
  assert.equal(parseDuration('1:02:03'),3723);
  assert.equal(parseDuration('1.5m'),90);
  assert.deepEqual(parseFormula('2m + 30 + 1:00'),[120,30,60]);
  assert.deepEqual(parseFormula('4*(1m+30)'),[60,30,60,30,60,30,60,30]);
  assert.deepEqual(parseFormula('2*(2*(10+20)+30)'),[10,20,10,20,30,10,20,10,20,30]);
  assert.deepEqual(parseFormula('3*1m'),[60,60,60]);
});

test('formula rejects malicious, invalid and oversized inputs',()=>{
  for(const input of ['','1m++20','(1m+20','2*(1m+20','x+30','99*(99*1m)','250*30','0','1:60','2m + alert(1)','2**1m'])
    assert.throws(()=>parseFormula(input),input);
});

test('intervals with pre-start and no final rest build correct timeline',()=>{
  const config=normalizeTimerSettings({mode:'intervals',leadSec:5,rounds:3,workSec:10,restSec:4,restLast:false});
  const timeline=buildTimeline(config);
  assert.equal(timeline.totalMs,43000);
  assert.deepEqual(timeline.segments.map(x=>x.type),['prepare','work','rest','work','rest','work']);
  const timer={status:'running',elapsedMs:0,anchorMs:10000};
  assert.equal(describeTimer(timer,config,14000).phase.type,'prepare');
  assert.equal(describeTimer(timer,config,16000).phase.type,'work');
  assert.equal(describeTimer(timer,config,25000).phase.type,'rest');
  assert.equal(describeTimer(timer,config,53000).status,'finished');
});

test('time cap clips intervals and countdown without removing preparation',()=>{
  const config={mode:'intervals',leadSec:8,rounds:10,workSec:60,restSec:30,timeCapSec:100};
  const timeline=buildTimeline(config);
  assert.equal(timeline.totalMs,108000);
  assert.equal(timeline.segments.at(-1).durationMs,10000);
  assert.equal(buildTimeline({...config,mode:'stopwatch',timeCapSec:0}).finite,false);
});

test('stopwatch counts upwards; countdown rounds only when complete',()=>{
  const config=normalizeTimerSettings({mode:'stopwatch',leadSec:0,timeCapSec:0});
  const d=describeTimer({status:'running',elapsedMs:3200,anchorMs:10000},config,11500);
  assert.equal(d.countUp,true);assert.equal(formatClock(d.displayMs,true),'00:04');
  assert.equal(formatClock(3200,false),'00:04');
  assert.equal(formatClock(3200,true),'00:03');
  assert.equal(formatClock(3600000),'01:00:00');
});

test('normalization clamps display settings and rejects unsupported injected logo',()=>{
  const result=normalizeSettings({appearance:{leftWidth:45,rightWidth:45,panelOpacity:500},left:{title:'X'.repeat(500),logoDataUrl:''},language:'fr'});
  assert.equal(result.appearance.leftWidth,45);
  assert.equal(result.appearance.rightWidth,30);
  assert.equal(result.appearance.panelOpacity,95);
  assert.equal(result.left.title.length,150);
  assert.equal(result.language,'fr');
  assert.throws(()=>normalizeSettings({left:{logoDataUrl:'data:image/svg+xml;base64,abc'}}));
  assert.equal(mergeKnown(DEFAULT_SETTINGS,JSON.parse('{"__proto__":{"evil":true},"rogue":42}')).rogue,undefined);
  assert.equal({}.evil,undefined);
});
