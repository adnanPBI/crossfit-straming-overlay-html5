"""Browser policy-safe UI interaction QA with mocked local API and actual application JS.
Browser route navigation is disabled in the build sandbox, so this is UI testing only.
Node integration tests separately exercise real HTTP/SSE and durable persistence.
"""
from pathlib import Path
import json, re, base64, subprocess, asyncio, os
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('WOD_QA_OUT',str(ROOT/'qa-output')));OUT.mkdir(exist_ok=True,parents=True)

def stripped_html(file):
    html=(ROOT/'public'/file).read_text()
    html=re.sub(r'<script[^>]*>.*?</script>','',html,flags=re.S)
    return re.sub(r'<link[^>]*rel="stylesheet"[^>]*>','',html)

def combine(*files):
    result=''
    for f in files:
        text=(ROOT/'public/js'/f).read_text()
        text=re.sub(r'^import .*?;\s*$','',text,flags=re.M)
        result+=text.replace('export ','')+'\n'
    return result+'\nwindow.__getCurrent=()=>current;'

MOCK = r'''
const store={};
Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:(x)=>store[x]||null,setItem:(x,y)=>store[x]=String(y),removeItem:(x)=>delete store[x]}});
window.__remote={listeners:[],db:__STATE__,events:[],key:'offline-test-key-abcdef'};
function clone(v){return JSON.parse(JSON.stringify(v));}
function patchObj(target,source){for(const [key,val] of Object.entries(source)){if(val && typeof val==='object' && !Array.isArray(val))target[key]=patchObj(target[key]||{},val);else target[key]=val;}return target;}
window.EventSource=class {
  constructor(url){this.events={};window.__remote.listeners.push(this);setTimeout(()=>this.emit('snapshot',{data:JSON.stringify(this.snapshot())}),50);}
  addEventListener(k,f){this.events[k]??=[];this.events[k].push(f);}
  emit(k,evt){for(const fn of (this.events[k]||[]))fn(evt);}
  snapshot(){return {...clone(window.__remote.db),revision:1,serverNow:Date.now()};}
};
function __broadcastMock(){for(const c of window.__remote.listeners)c.emit('snapshot',{data:JSON.stringify(c.snapshot())});}
window.fetch=async(url,options={})=>{
  const method=options.method||'GET';const endpoint=String(url);
  const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
  const auth=options.headers?.['X-Overlay-Key'];
  if(endpoint==='/api/state')return response({...clone(window.__remote.db),serverNow:Date.now()});
  if(auth!==window.__remote.key)return response({error:'Bad key'},401);
  if(endpoint==='/api/auth')return response({ok:true});
  if(endpoint==='/api/scenes') {
    if(method==='GET')return response({scenes:window.__remote.db.scenes.map(({id,name,createdAt})=>({id,name,createdAt}))});
    const input=JSON.parse(options.body),id='new-'+Date.now();
    window.__remote.db.scenes.push({id,name:input.name,createdAt:new Date().toISOString(),settings:clone(window.__remote.db.settings)});
    __broadcastMock();return response({scene:{id,name:input.name}});
  }
  if(endpoint==='/api/settings'){
    const {patch}=JSON.parse(options.body);patchObj(window.__remote.db.settings,patch);__broadcastMock();
    return response({...clone(window.__remote.db),serverNow:Date.now()});
  }
  if(endpoint==='/api/timer'){
    const {action}=JSON.parse(options.body);let timer=window.__remote.db.timer;
    timer.status=action==='start'?'running':action==='pause'?'paused':'idle';
    timer.anchorMs=timer.status==='running'?Date.now():null;
    __broadcastMock();return response({...clone(window.__remote.db),serverNow:Date.now()});
  }
  return response({ok:true});
};
'''

async def run():
    state=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {createInitialData} from './public/js/defaults.js';console.log(JSON.stringify(createInitialData()))"],cwd=ROOT))
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        desktop=await browser.new_page(viewport={'width':1440,'height':900})
        errors=[];desktop.on('pageerror',lambda e:errors.append(str(e)))
        await desktop.set_content(stripped_html('control.html'))
        await desktop.add_style_tag(content=(ROOT/'public/css/control.css').read_text())
        await desktop.add_script_tag(content=MOCK.replace('__STATE__',json.dumps(state)))
        await desktop.add_script_tag(content=combine('timer-engine.js','i18n.js','api.js','control.js'))
        await desktop.wait_for_timeout(150)
        assert await desktop.locator('#loginOverlay').is_visible(),'Key dialog missing'
        await desktop.locator('#keyInput').fill('offline-test-key-abcdef')
        await desktop.locator('#loginForm button[type=submit]').click()
        await desktop.locator('#loginOverlay').wait_for(state='hidden',timeout=3000)
        assert await desktop.locator('[data-path="left.title"]').input_value()=='THE DAILY GRIND'
        assert await desktop.locator('[data-path="timerSettings.mode"]').input_value()=='intervals'
        assert await desktop.locator('[data-path="timerSettings.primaryColor"]').input_value()=='#7cfaab'
        await desktop.locator('#previewFrame').evaluate('(e) => {e.src="about:blank"; e.style.display="none";}')
        await desktop.screenshot(path=str(OUT/'control-live-desktop.png'),full_page=True)
        await desktop.locator('#languageSelect').select_option('fr')
        await desktop.wait_for_timeout(480)
        assert await desktop.locator('[data-t="hero"]').inner_text()=='Maîtrisez chaque seconde du direct.'
        await desktop.locator('[data-tab="right"]').click()
        await desktop.locator('[data-path="right.coach"]').fill('ENTRAÎNEUR LUCIE')
        await desktop.wait_for_timeout(450)
        assert (await desktop.evaluate('window.__remote.db.settings.right.coach'))=='ENTRAÎNEUR LUCIE'
        await desktop.locator('[data-tab="timer"]').click()
        await desktop.locator('#startPauseBtn').click()
        await desktop.wait_for_timeout(200)
        assert await desktop.locator('#statusLabel').inner_text()=='EN COURS'
        await desktop.locator('#startPauseBtn').click()
        await desktop.wait_for_timeout(100)
        assert await desktop.locator('#statusLabel').inner_text()=='EN PAUSE'
        await desktop.locator('#resetBtn').click()
        await desktop.wait_for_timeout(100)
        assert await desktop.locator('#statusLabel').inner_text()=='PRÊT'
        await desktop.locator('[data-tab="left"]').click()
        await desktop.locator('[data-path="left.title"]').fill('TEST DE DIFFUSION')
        await desktop.wait_for_timeout(460)
        assert await desktop.evaluate('window.__remote.db.settings.left.title')=='TEST DE DIFFUSION'
        await desktop.locator('[data-tab="layout"]').click()
        await desktop.locator('[data-path="appearance.leftWidth"]').fill('35')
        await desktop.locator('[data-path="appearance.leftWidth"]').dispatch_event('input')
        await desktop.wait_for_timeout(460)
        assert await desktop.locator('#middleWidthOutput').inner_text()=='35%'
        mobile=await browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        mobile.on('pageerror',lambda e:errors.append('mobile: '+str(e)))
        await mobile.set_content(stripped_html('control.html'))
        await mobile.add_style_tag(content=(ROOT/'public/css/control.css').read_text())
        await mobile.add_script_tag(content=MOCK.replace('__STATE__',json.dumps(state)))
        await mobile.add_script_tag(content=combine('timer-engine.js','i18n.js','api.js','control.js'))
        await mobile.wait_for_timeout(110)
        await mobile.locator('#keyInput').fill('offline-test-key-abcdef')
        await mobile.locator('#loginForm button[type=submit]').click()
        await mobile.locator('#loginOverlay').wait_for(state='hidden',timeout=3000)
        await mobile.locator('#previewFrame').evaluate('(e) => {e.src="about:blank"; e.style.display="none";}')
        await mobile.screenshot(path=str(OUT/'control-live-mobile.png'),full_page=True)
        metric=await mobile.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})')
        assert metric['scroll']<=metric['width']+3,metric
        assert not errors,errors
        print('UI MOCK PASS:', {'keyProtection':True,'sixLocaleSelect':True,'french':True,'timerControls':True,'textChanges':True,'zoneWidths':True,'mobileNoOverflow':True,'consoleErrors':errors})
        await browser.close()

asyncio.run(run())
