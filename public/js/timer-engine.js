/** Timer calculation shared unchanged by the HTTP server and browser overlay. No dependencies. */
export const DEFAULT_TIMER_SETTINGS = Object.freeze({
  mode: 'intervals',
  durationSec: 600,
  leadSec: 5,
  rounds: 5,
  workSec: 60,
  restSec: 20,
  restLast: false,
  timeCapSec: 0,
  formula: '2m + 30 + 1:00',
  sound: true,
  trafficLights: true,
  fontSize: 150,
  primaryColor: '#7cfaab',
  warningColor: '#ffd26b',
  dangerColor: '#ff697a',
  restColor: '#66d9f7'
});

const LIMIT_SEGMENTS = 240;
const LIMIT_TOTAL_SEC = 24 * 3600;
export function parseDuration(token) {
  const t = String(token).trim().toLowerCase();
  if (/^\d{1,3}:\d{1,2}(?::\d{1,2})?$/.test(t)) {
    const nums = t.split(':').map(Number);
    if (nums.some((n, i) => (i > 0 && n > 59))) throw new Error('Invalid clock duration');
    const sec = nums.length === 3 ? nums[0] * 3600 + nums[1] * 60 + nums[2] : nums[0] * 60 + nums[1];
    if (sec <= 0 || sec > LIMIT_TOTAL_SEC) throw new Error('Duration out of range');
    return sec;
  }
  const m = /^(\d+(?:\.\d{1,2})?)(s|m|h)?$/.exec(t);
  if (!m) throw new Error('Invalid duration');
  const sec = Math.round(Number(m[1]) * ({s:1,m:60,h:3600}[m[2] || 's']));
  if (sec <= 0 || sec > LIMIT_TOTAL_SEC) throw new Error('Duration out of range');
  return sec;
}

/** Accept 2m + 30 + 1:00 and nested repeats such as 4*(1m+30). */
export function parseFormula(input) {
  const src = String(input ?? '').replace(/\s+/g, '').toLowerCase();
  if (!src || src.length > 500) throw new Error('Formula must be 1-500 characters');
  let pos = 0;
  function expr() {
    let result = term();
    while (src[pos] === '+') { pos++; result = result.concat(term()); check(result); }
    return result;
  }
  function term() {
    const start = pos;
    const times = /^(\d+)\*/.exec(src.slice(pos));
    if (times) {
      const count = Number(times[1]);
      if (count < 1 || count > 99) throw new Error('Repeat count must be 1-99');
      pos += times[0].length;
      let parts;
      if (src[pos] === '(') {
        pos++;
        parts = expr();
        if (src[pos] !== ')') throw new Error('Missing closing parenthesis');
        pos++;
      } else {
        parts = [duration()];
      }
      const expanded = Array.from({length:count}, () => parts).flat();
      check(expanded);
      return expanded;
    }
    if (src[pos] === '(') {
      pos++;
      const parts = expr();
      if (src[pos] !== ')') throw new Error('Missing closing parenthesis');
      pos++;
      return parts;
    }
    if (pos === start && src[pos] === ')') throw new Error('Unexpected parenthesis');
    return [duration()];
  }
  function duration() {
    const token = /^(?:\d{1,3}:\d{1,2}(?::\d{1,2})?|\d+(?:\.\d{1,2})?[smh]?)/.exec(src.slice(pos));
    if (!token) throw new Error(`Expected time at position ${pos + 1}`);
    pos += token[0].length;
    return parseDuration(token[0]);
  }
  function check(parts) {
    if (parts.length > LIMIT_SEGMENTS) throw new Error('Too many intervals (max 240)');
    if (parts.reduce((a,b)=>a+b,0) > LIMIT_TOTAL_SEC) throw new Error('Sequence exceeds 24 hours');
  }
  const result = expr();
  if (pos !== src.length) throw new Error(`Unexpected input at position ${pos + 1}`);
  check(result);
  return result;
}

const cleanInt = (v, min, max, fallback) => Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Math.round(Number(v)))) : fallback;
export function normalizeTimerSettings(raw = {}) {
  const d = DEFAULT_TIMER_SETTINGS;
  const mode = ['countdown','stopwatch','intervals','sequence'].includes(raw.mode) ? raw.mode : d.mode;
  const hex = (val, def) => typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val) ? val : def;
  const config = {
    mode,
    durationSec:cleanInt(raw.durationSec,1,86400,d.durationSec),
    leadSec:cleanInt(raw.leadSec,0,600,d.leadSec),
    rounds:cleanInt(raw.rounds,1,99,d.rounds),
    workSec:cleanInt(raw.workSec,1,86400,d.workSec),
    restSec:cleanInt(raw.restSec,0,86400,d.restSec),
    restLast:typeof raw.restLast === 'boolean' ? raw.restLast : d.restLast,
    timeCapSec:cleanInt(raw.timeCapSec,0,86400,d.timeCapSec),
    formula:typeof raw.formula === 'string' ? raw.formula.slice(0,500) : d.formula,
    sound:typeof raw.sound === 'boolean' ? raw.sound : d.sound,
    trafficLights:typeof raw.trafficLights === 'boolean' ? raw.trafficLights : d.trafficLights,
    fontSize:cleanInt(raw.fontSize,70,240,d.fontSize),
    primaryColor:hex(raw.primaryColor,d.primaryColor),
    warningColor:hex(raw.warningColor,d.warningColor),
    dangerColor:hex(raw.dangerColor,d.dangerColor),
    restColor:hex(raw.restColor,d.restColor)
  };
  if (mode === 'sequence') parseFormula(config.formula);
  return config;
}

export function buildTimeline(raw) {
  const c = normalizeTimerSettings(raw);
  let phases = [];
  if (c.leadSec) phases.push({type:'prepare', seconds:c.leadSec, index:0, count:1});
  if (c.mode === 'countdown') phases.push({type:'work',seconds:c.durationSec,index:1,count:1});
  if (c.mode === 'stopwatch') phases.push({type:'work',seconds:c.timeCapSec || Infinity,index:1,count:1});
  if (c.mode === 'intervals') {
    for(let i=0;i<c.rounds;i++) {
      phases.push({type:'work',seconds:c.workSec,index:i+1,count:c.rounds});
      if (c.restSec && (c.restLast || i < c.rounds-1)) phases.push({type:'rest',seconds:c.restSec,index:i+1,count:c.rounds});
    }
  }
  if (c.mode === 'sequence') {
    const entries = parseFormula(c.formula);
    entries.forEach((seconds,i)=>phases.push({type:'sequence',seconds,index:i+1,count:entries.length}));
  }
  if (c.timeCapSec && c.mode !== 'stopwatch') {
    const cap = c.timeCapSec + c.leadSec;
    let consumed = 0;
    phases = phases.flatMap(p => {
      const allowed = Math.min(p.seconds, Math.max(0, cap - consumed));
      consumed += allowed;
      return allowed > 0 ? [{...p,seconds:allowed}] : [];
    });
  }
  let offset = 0;
  const segments = phases.map((p,i) => {
    const startMs=offset;
    const durationMs=p.seconds * 1000;
    offset += durationMs;
    return {...p,id:`${p.type}-${i}`,startMs,endMs:offset,durationMs};
  });
  return {segments,totalMs:offset,finite:Number.isFinite(offset),config:c};
}

export function effectiveElapsed(timer, now = Date.now()) {
  const saved = Number.isFinite(timer?.elapsedMs) ? timer.elapsedMs : 0;
  const active = timer?.status === 'running' && Number.isFinite(timer.anchorMs);
  return Math.max(0, saved + (active ? Math.max(0,now - timer.anchorMs) : 0));
}

export function describeTimer(timer, settings, now=Date.now()) {
  const timeline = buildTimeline(settings);
  let elapsedMs = effectiveElapsed(timer,now);
  if(timeline.finite) elapsedMs = Math.min(elapsedMs,timeline.totalMs);
  const finished = timeline.finite && elapsedMs >= timeline.totalMs && timer?.status !== 'idle';
  const status = finished ? 'finished' : (timer?.status || 'idle');
  let phase=timeline.segments.find((p)=>elapsedMs < p.endMs);
  if (!phase && timeline.segments.length) phase=timeline.segments[timeline.segments.length-1];
  let elapsedInPhase = phase ? Math.max(0,elapsedMs-phase.startMs):0;
  let remainingMs = phase ? Math.max(0,phase.durationMs-elapsedInPhase):0;
  let countUp = settings.mode === 'stopwatch' && phase?.type === 'work';
  let displayMs = countUp ? elapsedInPhase : remainingMs;
  let currentProgress = phase && Number.isFinite(phase.durationMs) ? Math.min(1,elapsedInPhase/phase.durationMs) : 0;
  return {status,phase,elapsedMs,remainingMs,displayMs,countUp,currentProgress,finished,timeline};
}

/** Counts down using ceil, counts up using floor: 00:00 displays only at actual completion. */
export function formatClock(ms, countUp = false) {
  const total = countUp ? Math.floor(Math.max(0,ms)/1000) : Math.ceil(Math.max(0,ms)/1000);
  const sec=total%60, min=Math.floor(total/60)%60, hours=Math.floor(total/3600);
  const pad=(n)=>String(n).padStart(2,'0');
  return hours ? `${pad(hours)}:${pad(min)}:${pad(sec)}` : `${pad(Math.floor(total/60))}:${pad(sec)}`;
}
