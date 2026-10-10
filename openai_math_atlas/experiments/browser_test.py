"""Optional UI test. Install Playwright separately. Set CHROMIUM_EXECUTABLE if needed.
The saved report states that normal URL navigation was blocked in the analysis environment.
"""
from pathlib import Path
import os,shutil
from playwright.sync_api import sync_playwright
import json,math,re,threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from html.parser import HTMLParser
O=Path(__file__).resolve().parents[1];Q=O/'experiments'; shots=Q/'screenshots';shots.mkdir(exist_ok=True)
def load(page,f):
 raw=f.read_text()
 raw=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(f.parent/m.group(1)).resolve().read_text()+'</style>',raw)
 scripts=[]
 def take(m):
  scripts.append((f.parent/m.group(1)).resolve().read_text());return ''
 raw=re.sub(r'<script src="([^"]+)" defer></script>',take,raw)
 raw=raw.replace('</body>',''.join('<script>'+x+'</script>' for x in scripts)+'</body>')
 page.set_content(raw,wait_until='load')
report={'file_scheme_test':'Both file:// and localhost HTTP navigation were attempted and blocked by the Chromium environment (ERR_BLOCKED_BY_ADMINISTRATOR). Functional/visual tests inject the actual HTML plus inlined local CSS/JS with Playwright set_content. Normal URL loading, links in a browser, and file:// origin behavior are NOT verified here. Local paths are checked separately on disk.', 'date':'2026-10-08','scope':'Browser behavior and small known mathematical baselines, NOT proofs or new algorithm implementations','tests':[],'errors':[],'network_requests':[]}
def test(name,ok,detail=None):
 report['tests'].append({'name':name,'passed':bool(ok),'detail':detail});print(name, bool(ok), str(detail)[:140])
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 report['browser']=browser.version
 context=browser.new_context(viewport={'width':1440,'height':1050},locale='ru-RU',reduced_motion='reduce')
 page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
 page.on('request',lambda r:report['network_requests'].append(r.url) if r.url.startswith(('http:','https:')) and not r.url.startswith('http://127.0.0.1:') else None)
 for f in sorted(O.glob('*.html'))+sorted((O/'deep').glob('*.html')):
  load(page,f);page.wait_for_timeout(100)
  test('page:'+str(f.relative_to(O)),page.locator('h1').count()==1 and not any(x.strip() for x in page.locator('[role=alert]').all_text_contents()),{'title':page.title(),'horizontal_overflow':page.evaluate('document.documentElement.scrollWidth > innerWidth')})
 load(page,O/'index.html');page.wait_for_timeout(150)
 test('catalog-initial-372', '372' in page.locator('#catalog-count').inner_text(),page.locator('#catalog-count').inner_text())
 test('area-map-17',page.locator('.area-card').count()==17)
 test('page-size-24',page.locator('.catalog-card').count()==24)
 page.locator('#selected-only').check();test('selected-14',page.locator('.catalog-card').count()==14)
 page.locator('#reset-filters').click();page.locator('#app-filter').select_option('0');test('unreviewed-358','358' in page.locator('#catalog-count').inner_text())
 page.locator('#reset-filters').click();page.locator('#trust-filter').select_option('scope_description_only');test('scope-notes-242','242' in page.locator('#catalog-count').inner_text())
 page.locator('#trust-filter').select_option('independent');test('no-established-independent',page.locator('.catalog-card').count()==0)
 page.locator('#trust-filter').select_option('withdrawn');test('withdrawn-three',page.locator('.catalog-card').count()==3)
 page.locator('#reset-filters').click();page.locator('#search').fill('131');test('search-131',page.locator('#group-131').count()==1)
 page.locator('#group-131 details').evaluate('(x)=>x.open=true');test('source-path-present',page.locator('#group-131 .source-path').count()>0)
 page.locator('#reset-filters').click();page.screenshot(path=str(shots/'home-desktop.png'),full_page=False)
 # Core mathematical checks run in a demo page.
 load(page,O/'deep/131.html');page.wait_for_timeout(100)
 results=page.evaluate(r'''() => {
 const C=window.MathAtlasCore, E=window.EXPERIMENTS;
 const ts=C.tables([2,2,2],3), center=ts.find(x=>x.cells.every(z=>z===1));
 const sc=C.scs(['BCCA','CAB','CACA','CBC','CCBBC']);
 const ed=C.edit('kitten','sitting');
 const sche=C.schedule(E.schedule.n,E.schedule.edges);
 const valid=slots=>{const times={};slots.forEach((x,t)=>x.forEach(j=>times[j]=t));return Object.keys(times).length===E.schedule.n && slots.every(x=>x.length<=3) && E.schedule.edges.every(([a,b])=>times[a]<times[b]);};
 const polars=[];
 for(const c of [0,.1,.35,.5,.9,1])for(const s of [-1,-.4,0,.7,1]){const k=C.shape(c,s),v=C.polar(k),prod=C.area(k)*C.area(v);polars.push({c,s,prod,valid:v.every(y=>k.every(x=>x[0]*y[0]+x[1]*y[1]<=1+1e-12))});}
 const laws=C.switchLaws(0,200),g=E.switch;
 return {tables:{n:ts.length,sumU:ts.reduce((n,x)=>n+x.uniform,0),sumF:ts.reduce((n,x)=>n+x.fisher,0),center: center.fisher},scs:{...sc,exactLength:sc.exact.length,greedyLength:sc.greedy.length,covers:sc.strings.every(s=>sc.exact.includes(s)&&sc.greedy.includes(s))},edit:ed.distance,unicode:C.edit('A\u{1f600}','A').distance,schedule:{exact:sche.exact.length,greedy:sche.greedy.length,valid:valid(sche.exact)&&valid(sche.greedy)},polars,switch:{rows:g.counts.every(row=>row.reduce((n,x)=>n+x,0)===g.denominator),symmetric:g.counts.every((row,i)=>row.every((x,j)=>x===g.counts[j][i])),tv38:laws.tv[38],tv37:laws.tv[37],tv200:laws.tv[200],mass:laws.laws[200].reduce((n,x)=>n+x,0)}};
 }''')
 report['computed_browser_results']=results
 test('tables-exact-enumeration',results['tables']['n']==7 and abs(results['tables']['center']-.4)<1e-12,results['tables'])
 test('scs-12-vs-14',results['scs']['exactLength']==12 and results['scs']['greedyLength']==14 and results['scs']['covers'],results['scs'])
 test('edit-known-and-unicode',results['edit']==3 and results['unicode']==1)
 test('schedule-valid-4-vs-5',results['schedule']=={'exact':4,'greedy':5,'valid':True},results['schedule'])
 test('polar-family-constraints',all(x['valid'] and x['prod']>=8-1e-10 for x in results['polars']))
 test('polar-volume-invariance',all(max(x['prod'] for x in results['polars'] if x['c']==c)-min(x['prod'] for x in results['polars'] if x['c']==c)<1e-10 for c in [0,.1,.35,.5,.9,1]))
 sw=results['switch'];test('switch-kernel-exact-row-symmetry',sw['rows'] and sw['symmetric']);test('switch-tv-selected-start-crossing',sw['tv37']>.25 and sw['tv38']<=.25 and abs(sw['tv200']-.0004618271757478)<1e-12,sw)
 # Every slider responds to native input; no animation auto-start.
 for f in sorted((O/'deep').glob('*.html')):
  load(page,f);page.wait_for_timeout(60)
  sliders=page.locator('input[type=range]');total=sliders.count()
  for i in range(total):sliders.nth(i).evaluate('(x)=>{x.value=x.max;x.dispatchEvent(new Event("input",{bubbles:true}));}')
  if total:test('sliders:'+f.stem,not any(x.strip() for x in page.locator('[role=alert]').all_text_contents()),{'sliders':total})
  if f.stem in ['131','115']:
   page.locator('#demo').scroll_into_view_if_needed();page.screenshot(path=str(shots/(f.stem+'-desktop.png')),full_page=False)
 # Small screen static overflow and natural keyboard navigation.
 page.set_viewport_size({'width':390,'height':844})
 for name in ['index.html','projects.html','inventory.html','verification.html','deep/131.html','deep/115.html','deep/325.html']:
  load(page,O/name);page.wait_for_timeout(50)
  test('mobile-no-overflow:'+name,page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 load(page,O/'index.html');page.keyboard.press('Tab');test('keyboard-skip-link',page.evaluate('document.activeElement.classList.contains("skip-link")'))
 page.screenshot(path=str(shots/'home-mobile.png'),full_page=False)
 test('prefers-reduced-motion',page.evaluate('document.documentElement.classList.contains("reduced-motion")'))
 context.close();browser.close()
report['external_requests_count']=len(report['network_requests']);test('no-external-requests',not report['network_requests']);test('no-javascript-errors',not report['errors'],report['errors'])
# Resolve local links in authored HTML, excluding anchors and external URLs.
from urllib.parse import urlsplit,unquote
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  for k in ('href','src'):
   if k in a:self.links.append(a[k])
missing=[];count=0
for f in O.rglob('*.html'):
 parser=Links();parser.feed(f.read_text())
 for s in parser.links:
  u=urlsplit(s)
  if u.scheme or not u.path:continue
  q=(f.parent/unquote(u.path)).resolve();count+=1
  if not q.exists() and q!=Q/'browser_qa.json':missing.append({'page':str(f.relative_to(O)),'link':s})
report['local_link_audit']={'checked':count,'missing':missing}
test('authored-local-links-exist',not missing,{'count':count,'missing':missing})
report['all_passed']=all(x['passed'] for x in report['tests'])
(Q/'browser_qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('ALL PASSED',report['all_passed'])
