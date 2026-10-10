"""Optional UI test. Install Playwright separately. Set CHROMIUM_EXECUTABLE if needed.
The saved report states that normal URL navigation was blocked in the analysis environment.
"""
from pathlib import Path
import os,shutil
import json,re
from playwright.sync_api import sync_playwright
O=Path(__file__).resolve().parents[1];q=O/'experiments/browser_qa.json';report=json.loads(q.read_text());shots=O/'experiments/screenshots'
def load(page,f):
 raw=f.read_text();raw=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(f.parent/m.group(1)).resolve().read_text()+'</style>',raw);scripts=[]
 def take(m):scripts.append((f.parent/m.group(1)).resolve().read_text());return ''
 raw=re.sub(r'<script src="([^"]+)" defer></script>',take,raw);raw=raw.replace('</body>',''.join('<script>'+s+'</script>' for s in scripts)+'</body>');page.set_content(raw,wait_until='load')
def test(name,passed,detail=None):report['tests'].append({'name':name,'passed':bool(passed),'detail':detail});print(name,passed)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1440,'height':1050},reduced_motion='no-preference');page=ctx.new_page()
 load(page,O/'deep/131.html');play=page.locator('#switch-play');play.click();page.wait_for_timeout(520);v=int(page.locator('#switch-step').input_value());play.click();page.wait_for_timeout(400);test('animation-play-and-pause',v>=2 and int(page.locator('#switch-step').input_value())==v)
 play.click();page.locator('#motion-toggle').click();page.wait_for_timeout(50);v=int(page.locator('#switch-step').input_value());page.wait_for_timeout(400);test('reduced-motion-stops-animation',int(page.locator('#switch-step').input_value())==v and page.evaluate('window.atlasMotionReduced'))
 page.locator('#switch-next').click();test('single-step-remains-usable',int(page.locator('#switch-step').input_value())==v+1)
 load(page,O/'index.html');page.evaluate('scrollTo(0,0)');page.screenshot(path=str(shots/'home-hero-desktop.png'))
 page.set_viewport_size({'width':390,'height':844});page.evaluate('scrollTo(0,0)');page.screenshot(path=str(shots/'home-hero-mobile.png'))
 page.set_viewport_size({'width':1440,'height':1050});load(page,O/'deep/115.html');page.locator('#demo').scroll_into_view_if_needed();page.screenshot(path=str(shots/'115-desktop.png'))
 b.close()
report['static_file_mode_design_check']={'fetch_calls':False,'xhr_calls':False,'module_imports':False,'mandatory_remote_assets':False,'data_loading':'classic relative script assets/data.js; no JSON fetch','caveat':'Design inspection, not a successful file-origin browser test.'}
report['all_passed']=all(x['passed'] for x in report['tests']);q.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('TOTAL',len(report['tests']),report['all_passed'])
