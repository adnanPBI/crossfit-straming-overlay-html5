"""Offline Chromium smoke test for mobile remote without external HTTP/browser navigation."""
from pathlib import Path
import re,json,subprocess,asyncio,os
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]; OUT=Path(os.environ.get('WOD_QA_OUT',ROOT/'qa-output'));OUT.mkdir(exist_ok=True,parents=True)

def bundle(*names):
 s=''
 for name in names:
  value=(ROOT/'public/js'/name).read_text()
  s+=re.sub(r'^import .*?;\s*$','',value,flags=re.M).replace('export ','')+'\n'
 return s
MOCK='''
const token='remote-ui-test-key';const storage={};
Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]}});
window.__db=__STATE__;window.__events=[];
window.EventSource=class {constructor(){this.listeners={};window.__events.push(this);setTimeout(()=>this.fire('snapshot',{data:JSON.stringify({...window.__db,serverNow:Date.now()})}),50)}addEventListener(k,cb){(this.listeners[k]??=[]).push(cb)}fire(k,arg){for(const cb of this.listeners[k]||[])cb(arg)}};
const send=(o,status=200)=>new Response(JSON.stringify(o),{status,headers:{'Content-Type':'application/json'}});
window.fetch=async(path,opt={})=>{
 if(path==='/api/state')return send({...window.__db,serverNow:Date.now()});
 if(opt.headers?.['X-Overlay-Key']!==token)return send({error:'Invalid key'},401);
 if(path==='/api/auth')return send({ok:true});
 if(path==='/api/timer'){
  const action=JSON.parse(opt.body).action;
  if(action==='start')window.__db.timer.status='running';
  if(action==='pause')window.__db.timer.status='paused';
  if(action==='reset')window.__db.timer.status='idle';
  for(const c of window.__events)c.fire('snapshot',{data:JSON.stringify({...window.__db,serverNow:Date.now()})});
  return send({...window.__db,serverNow:Date.now()});
 }
 if(path==='/api/scenes/load'){
  window.__db.activeSceneId=JSON.parse(opt.body).id;
  for(const c of window.__events)c.fire('snapshot',{data:JSON.stringify({...window.__db,serverNow:Date.now()})});
  return send({...window.__db,serverNow:Date.now()});
 }
 return send({ok:true});
};
'''
async def run():
 state=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {createInitialData} from './public/js/defaults.js';console.log(JSON.stringify(createInitialData()))"],cwd=ROOT))
 state['scenes']=[{key:row[key] for key in ('id','name','createdAt')} for row in state['scenes']]
 html=(ROOT/'public/remote.html').read_text()
 html=re.sub(r'<script[^>]*>.*?</script>','',html,flags=re.S)
 html=re.sub(r'<link[^>]*rel="stylesheet"[^>]*>','',html)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [390,768]:
   page=await browser.new_page(viewport={'width':width,'height':844},is_mobile=width==390,has_touch=width==390)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   await page.set_content(html)
   await page.add_style_tag(content=(ROOT/'public/css/remote.css').read_text())
   await page.add_script_tag(content=MOCK.replace('__STATE__',json.dumps(state)))
   await page.add_script_tag(content=bundle('formula-v2.js','timer-engine.js','i18n.js','api.js','remote.js'))
   await page.wait_for_timeout(170)
   assert await page.locator('#loginOverlay').is_visible()
   await page.locator('#keyInput').fill('remote-ui-test-key')
   await page.locator('#loginForm button').click()
   await page.locator('#loginOverlay').wait_for(state='hidden',timeout=2500)
   assert await page.locator('#scenesList button').count()==3
   await page.locator('#toggleBtn').click()
   await page.wait_for_timeout(80)
   assert await page.locator('#toggleBtn').inner_text()=='Pause'
   await page.locator('#remoteLanguage').select_option('fr')
   await page.wait_for_timeout(100)
   assert await page.locator('#resetBtn').inner_text()=='Réinitialiser'
   await page.locator('#scenesList button').last.click()
   await page.wait_for_timeout(100)
   assert await page.locator('#scenesList button.active').count()==1
   await page.screenshot(path=str(OUT/f'remote-{width}.png'),full_page=True)
   geometry=await page.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})')
   assert geometry['scroll']<=geometry['width']+3,geometry
   assert not errors,errors
   print('REMOTE UI PASS',width,geometry,'live timer, scene switch, fr, auth')
   await page.close()
  await browser.close()
asyncio.run(run())
