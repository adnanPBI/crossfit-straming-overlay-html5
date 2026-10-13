/** Netlify stateless HTTP adapter: same public API as the local Node server. */
import { createHash, timingSafeEqual, randomUUID, scryptSync } from 'node:crypto';
import {DEFAULT_SETTINGS,createInitialData,mergeKnown,normalizeSettings} from '../public/js/defaults.js';
import {describeTimer} from '../public/js/timer-engine.js';

const MAX_BODY=4_000_000;
const MAX_SCENES=20;
const safeName=name=>String(name??'').trim().slice(0,64);
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const error=(status,message)=>json({error:message},status);
const equalKey=(supplied,secret)=>{
  if(typeof supplied!=='string'||!supplied||Buffer.byteLength(supplied)>256||!secret)return false;
  const a=createHash('sha256').update(supplied).digest(), b=createHash('sha256').update(secret).digest();
  return timingSafeEqual(a,b);
};
// Netlify's runtime environment variable propagation differs across accounts.
 // A salted, server-bundled scrypt verifier permits secure login even when the
 // runtime lacks OVERLAY_CONTROL_KEY. Its plaintext value is never bundled.
const decodeVerifier=value=>{
  if(!value||typeof value.salt!=='string'||typeof value.hash!=='string')return null;
  const salt=Buffer.from(value.salt,'base64'), digest=Buffer.from(value.hash,'base64');
  if(salt.length!==16||digest.length!==32)return null;
  return {salt,digest};
};
const validTimer=t=>t && ['idle','running','paused','finished'].includes(t.status)
  && Number.isFinite(t.elapsedMs)&&t.elapsedMs>=0&&t.elapsedMs<=10000000000
  && (t.anchorMs===null||(Number.isFinite(t.anchorMs)&&t.anchorMs>=0));
const normalizeScenes=scenes=>{
  if(!Array.isArray(scenes)||scenes.length>MAX_SCENES)throw Object.assign(new Error('Invalid scene collection'),{status:400});
  const seen=new Set();
  return scenes.map(x=>{
    const id=typeof x?.id==='string'?x.id.slice(0,100):'';
    const name=safeName(x?.name);
    if(!id||!name||seen.has(id))throw Object.assign(new Error('Invalid scene'),{status:400});
    seen.add(id);
    return {id,name,createdAt:typeof x.createdAt==='string'?x.createdAt.slice(0,35):new Date().toISOString(),settings:normalizeSettings(x.settings)};
  });
};
const validData=loaded=>{
  const data=createInitialData();
  if(!loaded||typeof loaded!=='object')return data;
  data.settings=normalizeSettings(loaded.settings);
  if(validTimer(loaded.timer))data.timer=loaded.timer;
  if(Array.isArray(loaded.scenes)){
    try{data.scenes=normalizeScenes(loaded.scenes);}catch{ /* keep built-in defaults */ }
  }
  if(typeof loaded.activeSceneId==='string'&&data.scenes.some(s=>s.id===loaded.activeSceneId))data.activeSceneId=loaded.activeSceneId;
  data.revision=Number.isSafeInteger(loaded.revision)&&loaded.revision>=0?loaded.revision:0;
  return data;
};
const snapshot=(data,now)=>({settings:data.settings,timer:data.timer,scenes:data.scenes.map(({id,name,createdAt})=>({id,name,createdAt})),activeSceneId:data.activeSceneId??null,revision:data.revision??0,serverNow:now});
async function readJson(req){
  const body=await req.text();
  if(Buffer.byteLength(body)>MAX_BODY)throw Object.assign(new Error('Request exceeds 4 MB'),{status:413});
  try{return JSON.parse(body);}catch{throw Object.assign(new Error('Invalid JSON'),{status:400});}
}
export function createHandler({getStore,controlKey,controlVerifier}){
  if(typeof getStore!=='function')throw new TypeError('getStore must be a function');
  const verifier=decodeVerifier(controlVerifier);
  const configured=!!verifier||(typeof controlKey==='string'&&controlKey.length>=12);
  const verifyKey=supplied=>{
    if(typeof supplied!=='string'||!supplied||Buffer.byteLength(supplied)>256)return false;
    if(verifier){
      const actual=scryptSync(supplied,verifier.salt,32);
      return timingSafeEqual(actual,verifier.digest);
    }
    return equalKey(supplied,controlKey);
  };
  return async function handle(req){
    const url=new URL(req.url);
    const pathname=url.pathname.startsWith('/api/')?url.pathname.slice(5):url.searchParams.get('route')||'';
    const now=Date.now();
    try{
      if(req.method==='GET'&&pathname==='health')return json({ok:true,version:'1.2.0',mode:'netlify',controllerConfigured:configured});
      if(req.method==='GET'&&pathname==='events')return error(409,'Serverless deployment uses polling; use /api/state');
      const store=getStore();
      const loaded=await store.get('current',{type:'json',consistency:'strong'});
      const data=validData(loaded);
      if(req.method==='GET'&&pathname==='state')return json(snapshot(data,now));
      if(!configured)return error(503,'Controller not configured: set OVERLAY_CONTROL_KEY in repository secrets and redeploy');
      if(!verifyKey(req.headers.get('x-overlay-key')))return error(401,'Control key required or incorrect');
      if(req.method==='POST'&&pathname==='auth')return json({ok:true});
      if(req.method==='GET'&&pathname==='scenes')return json({scenes:snapshot(data,now).scenes});
      if(req.method==='GET'&&pathname==='export')return json({format:'crossfit-overlay-v1',settings:data.settings,scenes:data.scenes,activeSceneId:data.activeSceneId});
      let result=null,status=200,updated=false;
      if(req.method==='PATCH'&&pathname==='settings'){
        const body=await readJson(req);
        if(!body?.patch||typeof body.patch!=='object'||Array.isArray(body.patch))return error(400,'Expected patch object');
        const next=normalizeSettings(mergeKnown(data.settings,body.patch));
        if(JSON.stringify(next.timerSettings)!==JSON.stringify(data.settings.timerSettings))data.timer={status:'idle',elapsedMs:0,anchorMs:null};
        data.settings=next;data.activeSceneId=null;updated=true;
      }else if(req.method==='POST'&&pathname==='timer'){
        const body=await readJson(req),action=body?.action, t=data.timer;
        const d=describeTimer(t,data.settings.timerSettings,now);
        if(action==='start'){
          if(t.status!=='running')data.timer={status:'running',elapsedMs:t.status==='finished'?0:t.elapsedMs,anchorMs:now};
        }else if(action==='pause'){
          if(t.status==='running')data.timer={status:'paused',elapsedMs:d.elapsedMs,anchorMs:null};
        }else if(action==='reset')data.timer={status:'idle',elapsedMs:0,anchorMs:null};
        else if(action==='next'||action==='previous'){
          const p=action==='next'?d.timeline.segments.find(x=>x.startMs>d.elapsedMs+1):[...d.timeline.segments].reverse().find(x=>x.startMs<d.elapsedMs-350);
          if(!p)return error(400,action==='next'?'No next segment':'No previous segment');
          data.timer={status:t.status==='running'?'running':'paused',elapsedMs:p.startMs,anchorMs:t.status==='running'?now:null};
        }else return error(400,'Unknown timer action');
        updated=true;
      }else if(req.method==='POST'&&pathname==='scenes'){
        const body=await readJson(req),name=safeName(body?.name);
        if(!name)return error(400,'Scene name required');
        if(data.scenes.length>=MAX_SCENES)return error(400,'Maximum 20 scenes');
        const scene={id:randomUUID(),name,createdAt:new Date(now).toISOString(),settings:structuredClone(data.settings)};
        data.scenes.push(scene);data.activeSceneId=scene.id;status=201;result={scene:{id:scene.id,name:scene.name,createdAt:scene.createdAt}};updated=true;
      }else if(req.method==='POST'&&pathname==='scenes/load'){
        const body=await readJson(req),scene=data.scenes.find(x=>x.id===body?.id);
        if(!scene)return error(404,'Scene not found');
        data.settings=normalizeSettings(scene.settings);data.activeSceneId=scene.id;data.timer={status:'idle',elapsedMs:0,anchorMs:null};updated=true;
      }else if(req.method==='DELETE'&&pathname.startsWith('scenes/')){
        const id=decodeURIComponent(pathname.slice('scenes/'.length));
        if(id.startsWith('preset-'))return error(403,'Built-in presets cannot be deleted');
        const index=data.scenes.findIndex(x=>x.id===id);
        if(index<0)return error(404,'Scene not found');
        data.scenes.splice(index,1);if(data.activeSceneId===id)data.activeSceneId=null;
        updated=true;result={ok:true};
      }else if(req.method==='POST'&&pathname==='defaults'){
        data.settings=normalizeSettings(DEFAULT_SETTINGS);data.activeSceneId='preset-competition';data.timer={status:'idle',elapsedMs:0,anchorMs:null};updated=true;
      }else if(req.method==='POST'&&pathname==='import'){
        const body=await readJson(req);
        if(body?.format!=='crossfit-overlay-v1'||!Array.isArray(body.scenes))return error(400,'Invalid or unsupported import format');
        data.settings=normalizeSettings(body.settings);data.scenes=normalizeScenes(body.scenes);
        data.activeSceneId=typeof body.activeSceneId==='string'&&data.scenes.some(s=>s.id===body.activeSceneId)?body.activeSceneId:null;
        data.timer={status:'idle',elapsedMs:0,anchorMs:null};updated=true;
      }else return error(404,'API route not found');
      if(updated){
        data.revision=(data.revision||0)+1;
        // Blob storage is last-write-wins; one controlling operator is recommended.
        await store.setJSON('current',data);
      }
      return json(result??snapshot(data,now),status);
    }catch(e){
      console.error('Netlify API request failed:',pathname,e?.message);
      return error(e.status??500,e.status?e.message:'Storage or server error');
    }
  };
}
