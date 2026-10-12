"""Offline visual checks for environments where Chromium enterprise policy blocks URL navigation.
Uses HTML/CSS source and the same overlay render JS, with a local test snapshot.
This is *not* a substitute for actual OBS/Zoom integration testing.
"""
from pathlib import Path
from playwright.async_api import async_playwright
import asyncio, json, re, base64, os
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('WOD_QA_OUT',str(ROOT/'qa-output')));OUT.mkdir(exist_ok=True)

def clean_html(path):
    html=path.read_text()
    html=re.sub(r'<script[^>]*>.*?</script>','',html,flags=re.S)
    html=re.sub(r'<link[^>]*rel="stylesheet"[^>]*>','',html)
    return html

def inline_modules(*files):
    s=''
    for f in files:
        data=(ROOT/'public/js'/f).read_text()
        data=re.sub(r'^import .*?;\s*$', '', data, flags=re.M)
        data=data.replace('export ','')
        if f=='overlay.js':
            data=data.replace('void start();','window.__applySnapshot=applySnapshot;')
        s+=data+'\n'
    return 'const beep=()=>{};\n'+s

async def run():
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        page=await browser.new_page(viewport={'width':1920,'height':1080})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        await page.set_content(clean_html(ROOT/'public/overlay.html'))
        await page.add_style_tag(content=(ROOT/'public/css/overlay.css').read_text())
        await page.add_script_tag(content=inline_modules('timer-engine.js','i18n.js','overlay.js'))
        logo='data:image/png;base64,'+base64.b64encode((ROOT/'public/sample-logo.png').read_bytes()).decode()
        snap=json.loads((ROOT/'data/state.json').read_text()) if (ROOT/'data/state.json').exists() else None
        if not snap:
            # seed from production defaults without relying on browser networking
            import subprocess
            snap=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {createInitialData} from './public/js/defaults.js';console.log(JSON.stringify(createInitialData()))"],cwd=ROOT))
        snap['settings']['language']='en'
        snap['settings']['left']['logoDataUrl']=logo
        snap['settings']['left']['title']='THE DAILY GRIND'
        snap['settings']['right']['wodText']='5 ROUNDS FOR TIME\n20 Air Squats\n15 Burpees\n10 Pull-ups'
        snap['settings']['timerSettings'].update({'mode':'intervals','leadSec':0,'rounds':5,'workSec':60,'restSec':20})
        snap['timer']={'status':'running','elapsedMs':82000,'anchorMs':1690000000000}
        snap['serverNow']=1690000000000
        await page.evaluate('(s) => window.__applySnapshot(s)',snap)
        await page.screenshot(path=str(OUT/'overlay-visual.png'),omit_background=True)
        geometry=await page.evaluate('''() => ({scrollWidth: document.body.scrollWidth, scrollHeight: document.body.scrollHeight, viewport:[innerWidth,innerHeight], stage:document.getElementById('stage').getBoundingClientRect().toJSON(), bg:getComputedStyle(document.body).backgroundColor})''')
        print('overlay qa',geometry,'errors',errors)
        # Add a subtle backdrop just for inspection, not part of overlay output.
        img=Image.open(OUT/'overlay-visual.png').convert('RGBA')
        bg=Image.new('RGBA',img.size);draw=ImageDraw.Draw(bg)
        for y in range(img.height):
            c=int(21+15*y/img.height);draw.line((0,y,img.width,y),fill=(c,c+7,c+11,255))
        bg.alpha_composite(img);bg.convert('RGB').save(OUT/'overlay-on-video-preview.jpg',quality=90)
        assert not errors,errors
        assert geometry['bg']=='rgba(0, 0, 0, 0)',geometry
        ctl=await browser.new_page(viewport={'width':1440,'height':900})
        ctlErrors=[];ctl.on('pageerror',lambda e:ctlErrors.append(str(e)))
        await ctl.set_content(clean_html(ROOT/'public/control.html'))
        await ctl.add_style_tag(content=(ROOT/'public/css/control.css').read_text())
        await ctl.evaluate('''() => { document.getElementById('loginOverlay').classList.add('hidden'); const e=document.getElementById('previewFrame');e.remove(); document.querySelector('.video-frame').style.background='#26322b'; }''')
        await ctl.screenshot(path=str(OUT/'control-visual-desktop.png'),full_page=True)
        await ctl.set_viewport_size({'width':390,'height':844})
        await ctl.screenshot(path=str(OUT/'control-visual-mobile.png'),full_page=True)
        metric=await ctl.evaluate('''() => ({width:innerWidth,scroll:document.documentElement.scrollWidth,sidebar:document.querySelector('.sidebar').getBoundingClientRect().toJSON()})''')
        print('mobile metrics',metric,'errors',ctlErrors)
        assert metric['scroll']<=metric['width']+4
        await browser.close()

asyncio.run(run())
