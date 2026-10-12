import http from 'node:http';
import {readFile,writeFile,mkdir,rename,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import os from 'node:os';
import {DEFAULT_SETTINGS,BUILTIN_SCENES,createInitialData,mergeKnown,normalizeSettings} from './public/js/defaults.js';
import {buildTimeline,describeTimer,effectiveElapsed} from './public/js/timer-engine.js';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC=path.join(ROOT,'public');
const CONTENT_TYPES={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png'};
const MAX_BODY=4_000_000;
const MAX_BACKUP_BODY=60_000_000;
const MAX_SCENES=20;
const safeName=(name)=>String(name??'').trim().slice(0,64);

function send(res,status,obj){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(obj));
}
function err(res,status,message){send(res,status,{error:message});}
async function jsonBody(req,maxBytes=MAX_BODY) {
  let size=0,buffers=[];
  for await (const chunk of req) {
    size+=chunk.length;
    if (size>maxBytes) {const error=new Error(`Request exceeds ${Math.floor(maxBytes/1000000)} MB`);error.status=413;throw error;}
    buffers.push(chunk);
  }
  try {return JSON.parse(Buffer.concat(buffers).toString('utf8'));}
  catch {const error=new Error('Invalid JSON');error.status=400;throw error;}
}
function hasCorrectKey(req,key) {
  const candidate=req.headers['x-overlay-key'];
  if(typeof candidate!=='string' || !candidate || Buffer.byteLength(candidate)>256) return false;
  const a=crypto.createHash('sha256').update(candidate).digest();
  const b=crypto.createHash('sha256').update(key).digest();
  return crypto.timingSafeEqual(a,b);
}
function validTimer(timer) {
  if(!timer || !['idle','running','paused','finished'].includes(timer.status)) return false;
  return Number.isFinite(timer.elapsedMs) && timer.elapsedMs>=0 && timer.elapsedMs<=10000000000
    && (timer.anchorMs===null || (Number.isFinite(timer.anchorMs) && timer.anchorMs>=0));
}
export async function createAppServer(options={}) {
  const host=options.host??process.env.HOST??'0.0.0.0';
  const port=options.port??Number(process.env.PORT??4173);
  const dataDir=path.resolve(options.dataDir??process.env.OVERLAY_DATA_DIR??path.join(ROOT,'data'));
  await mkdir(dataDir,{recursive:true,mode:0o700});
  const keyPath=path.join(dataDir,'control-key.txt');
  let key=options.key??process.env.OVERLAY_CONTROL_KEY;
  if(!key){
    if(existsSync(keyPath)) key=(await readFile(keyPath,'utf8')).trim();
    else {key=crypto.randomBytes(18).toString('hex');await writeFile(keyPath,`${key}\n`,{mode:0o600});}
  }
  if(key.length<12) throw new Error('Control key must have 12+ characters');
  const statePath=path.join(dataDir,'state.json');
  let data=createInitialData();
  if(existsSync(statePath)){
    try {
      const loaded=JSON.parse(await readFile(statePath,'utf8'));
      data.settings=normalizeSettings(loaded.settings);
      if(validTimer(loaded.timer))data.timer=loaded.timer;
      if(Array.isArray(loaded.scenes))data.scenes=normalizeScenes(loaded.scenes);
      if(typeof loaded.activeSceneId==='string' && data.scenes.some(s=>s.id===loaded.activeSceneId))data.activeSceneId=loaded.activeSceneId;
    } catch(e){console.warn('Stored data invalid; retaining defaults:',e.message);}
  }
  let clients=new Set();
  let writes=Promise.resolve();
  let revision=0;
  const snapshot=()=>({settings:data.settings,timer:data.timer,scenes:data.scenes.map(s=>({id:s.id,name:s.name,createdAt:s.createdAt})),activeSceneId:data.activeSceneId??null,revision,serverNow:Date.now()});
  const persist=()=>{
    const payload=JSON.stringify({settings:data.settings,timer:data.timer,scenes:data.scenes,activeSceneId:data.activeSceneId},null,2);
    writes=writes.then(async()=>{
      const tmp=`${statePath}.tmp`;
      await writeFile(tmp,payload,{mode:0o600});
      await rename(tmp,statePath);
    });
    return writes;
  };
  function broadcast(){
    revision++;
    const payload=`event: snapshot\ndata: ${JSON.stringify(snapshot())}\n\n`;
    for(const res of clients){
      try{res.write(payload);}catch{clients.delete(res);}
    }
  }
  const commit=async()=>{await persist();broadcast();};
  function finishIfRequired(now=Date.now()) {
    if(data.timer.status!=='running')return false;
    const d=describeTimer(data.timer,data.settings.timerSettings,now);
    if(!d.finished)return false;
    data.timer={status:'finished',elapsedMs:d.timeline.totalMs,anchorMs:null};
    void commit().catch(e=>console.error('Finish persist:',e));
    return true;
  }
  const monitor=setInterval(()=>finishIfRequired(),250);
  monitor.unref();

  async function handle(req,res) {
    try {
      res.setHeader('X-Content-Type-Options','nosniff');
      res.setHeader('Referrer-Policy','no-referrer');
      res.setHeader('X-Frame-Options','SAMEORIGIN');
      res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob: data:; object-src 'none'; base-uri 'none'; frame-ancestors 'self'");
      const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
      const pathname=url.pathname;
      if(pathname.startsWith('/api/')){
        if(req.method==='GET' && pathname==='/api/state') return send(res,200,snapshot());
        if(req.method==='GET' && pathname==='/api/health')return send(res,200,{ok:true,version:'1.1.0',uptimeSeconds:Math.round(process.uptime())});
        if(req.method==='GET' && pathname==='/api/events'){
          if(clients.size>=32)return err(res,503,'Too many overlay subscribers');
          res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'});
          res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot())}\n\n`);
          clients.add(res);req.on('close',()=>clients.delete(res));return;
        }
        if(!hasCorrectKey(req,key))return err(res,401,'Control key required or incorrect');
        if(req.method==='POST' && pathname==='/api/auth')return send(res,200,{ok:true});
        if(req.method==='GET' && pathname==='/api/scenes')return send(res,200,{scenes:data.scenes.map(s=>({id:s.id,name:s.name,createdAt:s.createdAt}))});
        if(req.method==='GET' && pathname==='/api/export')return send(res,200,{format:'crossfit-overlay-v1',settings:data.settings,scenes:data.scenes,activeSceneId:data.activeSceneId});
        if(req.method==='PATCH' && pathname==='/api/settings'){
          const body=await jsonBody(req);
          if(!body || !body.patch || typeof body.patch!=='object' || Array.isArray(body.patch))return err(res,400,'Expected patch object');
          const next=normalizeSettings(mergeKnown(data.settings,body.patch));
          const timerChanged=JSON.stringify(next.timerSettings)!==JSON.stringify(data.settings.timerSettings);
          data.settings=next;
          if(timerChanged)data.timer={status:'idle',elapsedMs:0,anchorMs:null};
          data.activeSceneId=null;
          await commit();return send(res,200,snapshot());
        }
        if(req.method==='POST' && pathname==='/api/timer'){
          const body=await jsonBody(req),action=body?.action;
          const t=data.timer, now=Date.now();
          const desc=describeTimer(t,data.settings.timerSettings,now);
          if(action==='start'){
            if(t.status==='running')return send(res,200,snapshot());
            data.timer=(t.status==='finished')?{status:'running',elapsedMs:0,anchorMs:now}:{status:'running',elapsedMs:t.elapsedMs,anchorMs:now};
          }else if(action==='pause'){
            if(t.status!=='running')return send(res,200,snapshot());
            data.timer={status:'paused',elapsedMs:desc.elapsedMs,anchorMs:null};
          }else if(action==='reset'){
            data.timer={status:'idle',elapsedMs:0,anchorMs:null};
          }else if(action==='next' || action==='previous'){
            const segments=desc.timeline.segments;
            const target=action==='next'
              ? segments.find(p=>p.startMs>desc.elapsedMs+1)
              : [...segments].reverse().find(p=>p.startMs<desc.elapsedMs-350);
            if(!target)return err(res,400,action==='next'?'No next segment':'No previous segment');
            data.timer={status:t.status==='running'?'running':'paused',elapsedMs:target.startMs,anchorMs:t.status==='running'?now:null};
          }else{return err(res,400,'Unknown timer action');}
          await commit();return send(res,200,snapshot());
        }
        if(req.method==='POST' && pathname==='/api/scenes'){
          const body=await jsonBody(req),name=safeName(body?.name);
          if(!name)return err(res,400,'Scene name required');
          if(data.scenes.length>=MAX_SCENES)return err(res,400,'Maximum 20 scenes');
          const scene={id:crypto.randomUUID(),name,createdAt:new Date().toISOString(),settings:structuredClone(data.settings)};
          data.scenes.push(scene);data.activeSceneId=scene.id;await commit();return send(res,201,{scene:{id:scene.id,name:scene.name,createdAt:scene.createdAt}});
        }
        if(req.method==='POST' && pathname==='/api/scenes/load'){
          const body=await jsonBody(req);
          const scene=data.scenes.find(s=>s.id===body?.id);
          if(!scene)return err(res,404,'Scene not found');
          data.settings=normalizeSettings(scene.settings);
          data.activeSceneId=scene.id;
          data.timer={status:'idle',elapsedMs:0,anchorMs:null};
          await commit();return send(res,200,snapshot());
        }
        if(req.method==='DELETE' && pathname.startsWith('/api/scenes/')){
          const id=decodeURIComponent(pathname.substring('/api/scenes/'.length));
          if(id.startsWith('preset-'))return err(res,403,'Built-in presets cannot be deleted');
          const index=data.scenes.findIndex(s=>s.id===id);
          if(index<0)return err(res,404,'Scene not found');
          data.scenes.splice(index,1);if(data.activeSceneId===id)data.activeSceneId=null;await commit();return send(res,200,{ok:true});
        }
        if(req.method==='POST' && pathname==='/api/defaults'){
          data.settings=normalizeSettings(DEFAULT_SETTINGS);
          data.activeSceneId='preset-competition';
          data.timer={status:'idle',elapsedMs:0,anchorMs:null};
          await commit();return send(res,200,snapshot());
        }
        if(req.method==='POST' && pathname==='/api/import'){
          const body=await jsonBody(req,MAX_BACKUP_BODY);
          if(body?.format!=='crossfit-overlay-v1')return err(res,400,'Unsupported import format');
          const nextSettings=normalizeSettings(body.settings);
          if(!Array.isArray(body.scenes))return err(res,400,'Missing scenes');
          const nextScenes=normalizeScenes(body.scenes);
          data.settings=nextSettings;data.scenes=nextScenes;
          data.activeSceneId=typeof body.activeSceneId==='string' && nextScenes.some(s=>s.id===body.activeSceneId)?body.activeSceneId:null;
          data.timer={status:'idle',elapsedMs:0,anchorMs:null};
          await commit();return send(res,200,snapshot());
        }
        return err(res,404,'API route not found');
      }
      if(req.method!=='GET' && req.method!=='HEAD')return err(res,405,'Method not allowed');
      const route={'/':'/index.html','/control':'/control.html','/overlay':'/overlay.html','/remote':'/remote.html'}[pathname]??pathname;
      const decoded=decodeURIComponent(route);
      const resolved=path.resolve(PUBLIC,`.${decoded}`);
      if(!resolved.startsWith(PUBLIC+path.sep) && resolved!==PUBLIC)return err(res,403,'Forbidden');
      if(!Object.hasOwn(CONTENT_TYPES,path.extname(resolved)))return err(res,404,'Not found');
      let info;
      try{info=await stat(resolved);}catch{return err(res,404,'Not found');}
      if(!info.isFile())return err(res,404,'Not found');
      const blob=await readFile(resolved);
      res.writeHead(200,{'Content-Type':CONTENT_TYPES[path.extname(resolved)],'Cache-Control':'no-cache'});
      if(req.method==='HEAD')return res.end();
      res.end(blob);
    }catch(e){
      console.error(`${req.method} ${req.url}:`,e.message);
      return err(res,e.status??(e instanceof RangeError?400:400),e.message||'Request failed');
    }
  }
  const server=http.createServer((req,res)=>void handle(req,res));
  server.headersTimeout=15_000;
  server.requestTimeout=30_000;
  server.keepAliveTimeout=5_000;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
  const boundPort=server.address().port;
  async function close(){clearInterval(monitor);for(const c of clients)c.end();clients.clear();await writes;await new Promise((resolve)=>server.close(resolve));}
  return {server,host,port:boundPort,dataDir,controlKey:key,close};
}
function normalizeScenes(scenes){
  if(scenes.length>MAX_SCENES)throw new Error('Maximum 20 scenes');
  const ids=new Set();
  return scenes.map(scene=>{
    const name=safeName(scene?.name);
    const id=typeof scene?.id==='string'?scene.id.slice(0,100):'';
    if(!name||!id||ids.has(id))throw new Error('Invalid scene');
    ids.add(id);
    return {id,name,createdAt:typeof scene.createdAt==='string'?scene.createdAt.slice(0,35):new Date().toISOString(),settings:normalizeSettings(scene.settings)};
  });
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const app=await createAppServer();
  const local=`http://localhost:${app.port}`;
  console.log('\n  ===== WOD STREAM STUDIO =====');
  console.log(`  Control: ${local}/control`);
  console.log(`  Overlay: ${local}/overlay`);
  console.log(`  Mobile remote: ${local}/remote`);
  console.log(`  Control key: ${app.controlKey}`);
  for(const inf of Object.values(os.networkInterfaces()).flat()) {
    if(inf && inf.family==='IPv4' && !inf.internal)console.log(`  Phone (same Wi-Fi): http://${inf.address}:${app.port}/remote`);
  }
  console.log('  For private/trusted local networks only; see SECURITY.md.\n');
  const shutdown=()=>{app.close().then(()=>process.exit(0));};
  process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
}
