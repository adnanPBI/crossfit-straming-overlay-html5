"""Chromium smoke tests. Requires Python Playwright and local Chromium; not part of npm test."""
import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('WOD_URL','http://127.0.0.1:4173')
OUT=Path(os.environ.get('WOD_QA_OUT',str(ROOT/'qa-output')))
OUT.mkdir(exist_ok=True,parents=True)

async def main():
  async with async_playwright() as p:
    browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader'])
    ctx=await browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,accept_downloads=True)
    errors=[]
    control=await ctx.new_page()
    control.on('pageerror',lambda e:errors.append(f'control: {e}'))
    await control.goto(BASE+'/control',wait_until='domcontentloaded')
    await control.locator('#loginOverlay').wait_for(state='visible',timeout=5000)
    await control.screenshot(path=str(OUT/'control-locked.png'),full_page=True)
    key=os.environ.get('WOD_KEY') or (ROOT/'data/control-key.txt').read_text().strip()
    await control.locator('#keyInput').fill(key)
    await control.locator('#loginForm button[type=submit]').click()
    await control.locator('#loginOverlay').wait_for(state='hidden',timeout=5000)
    await control.screenshot(path=str(OUT/'control-desktop.png'),full_page=True)
    await control.locator('#languageSelect').select_option('fr')
    await control.wait_for_timeout(550)
    assert await control.locator('[data-t="navScenes"]').first.text_content()=='Scènes'
    await control.locator('[data-tab="right"]').click()
    await control.locator('[data-path="right.coach"]').fill('COACH FRANÇOIS')
    await control.wait_for_timeout(600)
    await control.locator('[data-tab="timer"]').click()
    await control.locator('[data-path="timerSettings.mode"]').select_option('countdown')
    await control.wait_for_timeout(550)
    await control.locator('[data-path="timerSettings.durationSec"]').fill('15')
    await control.locator('[data-path="timerSettings.durationSec"]').press('Tab')
    await control.wait_for_timeout(450)
    await control.locator('#startPauseBtn').click()
    await control.wait_for_timeout(800)
    live=await (await control.request.get(BASE+'/api/state')).json()
    assert live['settings']['language']=='fr',live
    assert live['settings']['right']['coach']=='COACH FRANÇOIS',live
    assert live['timer']['status']=='running',live
    overlay=await ctx.new_page()
    await overlay.set_viewport_size({'width':1920,'height':1080})
    overlay.on('pageerror',lambda e:errors.append(f'overlay: {e}'))
    await overlay.goto(BASE+'/overlay',wait_until='domcontentloaded')
    await overlay.wait_for_timeout(500)
    await overlay.screenshot(path=str(OUT/'overlay-desktop.png'),omit_background=True)
    assert await overlay.locator('html').get_attribute('lang')=='fr'
    assert await overlay.locator('#coachName').text_content()=='COACH FRANÇOIS'
    await control.locator('#startPauseBtn').click()
    await control.wait_for_timeout(300)
    assert (await (await control.request.get(BASE+'/api/state')).json())['timer']['status']=='paused'
    await control.locator('[data-tab="scenes"]').click()
    await control.locator('#sceneName').fill('QA Scene')
    await control.locator('#saveSceneBtn').click()
    await control.locator('.scene-row').last.wait_for()
    assert await control.get_by_text('QA Scene').is_visible()
    await control.locator('[data-tab="left"]').click()
    await control.locator('[data-path="left.title"]').fill('READY FOR TAKEOFF')
    await control.wait_for_timeout(500)
    assert await overlay.locator('#brandTitle').text_content()=='READY FOR TAKEOFF'
    # exercise logo upload with native input to demonstrate server persistence
    await control.locator('#logoFile').set_input_files(str(ROOT/'public/sample-logo.png'))
    await control.wait_for_timeout(500)
    assert (await (await control.request.get(BASE+'/api/state')).json())['settings']['left']['logoDataUrl'].startswith('data:image/png;base64,')
    mobile=await browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    phone=await mobile.new_page()
    phone.on('pageerror',lambda e:errors.append(f'mobile: {e}'))
    await phone.goto(BASE+'/control',wait_until='domcontentloaded')
    await phone.wait_for_timeout(700)
    await phone.screenshot(path=str(OUT/'control-mobile.png'),full_page=True)
    # Phone UI must be visible and not horizontally overflow
    overflow=await phone.evaluate('document.documentElement.scrollWidth > innerWidth+3')
    assert not overflow,'Phone UI has horizontal overflow'
    await phone.locator('#keyInput').fill(key)
    await phone.locator('#loginForm button[type=submit]').click()
    await phone.locator('#loginOverlay').wait_for(state='hidden',timeout=5000)
    await phone.locator('[data-tab="timer"]').click()
    await phone.locator('#resetBtn').click()
    await phone.wait_for_timeout(350)
    assert (await (await control.request.get(BASE+'/api/state')).json())['timer']['status']=='idle'
    await phone.screenshot(path=str(OUT/'control-mobile-unlocked.png'),full_page=True)
    # Browser-source alpha verified via computed styles (screenshot also has alpha)
    bg=await overlay.evaluate('getComputedStyle(document.body).backgroundColor')
    assert bg=='rgba(0, 0, 0, 0)',f'Overlay background not transparent: {bg}'
    print(json.dumps({'passed':True,'errors':errors,'overlayBodyBg':bg,'screenFiles':[p.name for p in OUT.glob('*.png')]},indent=2))
    await mobile.close();await ctx.close();await browser.close()
    assert not errors,'Browser errors: '+repr(errors)

if __name__=='__main__': asyncio.run(main())
