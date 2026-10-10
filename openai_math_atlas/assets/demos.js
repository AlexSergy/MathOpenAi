'use strict';
/* All algorithms below are small known baselines or finite illustrative models.
   They do not implement the new asymptotic algorithms claimed in the papers. */
(() => {
const $=(s,r=document)=>r.querySelector(s), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,d=4)=>Number(v).toLocaleString('ru-RU',{maximumFractionDigits:d});
const svg=(body,label,w=760,h=280)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const text=(x,y,t,cl='svg-text')=>`<text x="${x}" y="${y}" class="${cl}">${esc(t)}</text>`;
const note=t=>`<p class="demo-note"><strong>Граница демонстрации.</strong> ${t}</p>`;
const factorial=n=>{let v=1;for(let i=2;i<=n;i++)v*=i;return v;};
function tables(cols,row){
 const list=[];
 for(let a=0;a<=cols[0];a++)for(let b=0;b<=cols[1];b++){
  const c=row-a-b;if(c<0||c>cols[2])continue;
  const cells=[a,b,c,cols[0]-a,cols[1]-b,cols[2]-c];
  list.push({cells,weight:1/cells.reduce((p,x)=>p*factorial(x),1)});
 }
 const z=list.reduce((p,t)=>p+t.weight,0);return list.map(t=>({...t,uniform:1/list.length,fisher:t.weight/z}));
}
function overlap(a,b){for(let k=Math.min(a.length,b.length);k>0;k--)if(a.slice(-k)===b.slice(0,k))return k;return 0;}
function scs(input){
 let ss=[...new Set(input.filter(Boolean))].sort();ss=ss.filter(s=>!ss.some(t=>s!==t&&t.includes(s)));
 if(!ss.length)return {strings:[],exact:'',greedy:'',steps:[]};
 if(ss.length>8)throw Error('Не более 8 строк для точного эталона.');
 const n=ss.length,dp=Array.from({length:1<<n},()=>Array(n).fill(null));
 const better=(a,b)=>b===null||a.length<b.length||(a.length===b.length&&a<b);
 ss.forEach((s,i)=>dp[1<<i][i]=s);
 for(let m=1;m<(1<<n);m++)for(let i=0;i<n;i++)if(dp[m][i]!==null)for(let j=0;j<n;j++)if(!(m&(1<<j))){
  const z=dp[m][i]+ss[j].slice(overlap(ss[i],ss[j]));if(better(z,dp[m|(1<<j)][j]))dp[m|(1<<j)][j]=z;
 }
 const exact=dp[(1<<n)-1].reduce((a,b)=>a===null||better(b,a)?b:a,null);
 let work=ss.slice(),steps=[];
 while(work.length>1){
  let best=null;
  for(let i=0;i<work.length;i++)for(let j=0;j<work.length;j++)if(i!==j){
   const ov=overlap(work[i],work[j]),merged=work[i]+work[j].slice(ov),b={i,j,ov,merged,a:work[i],b:work[j]};
   if(!best||ov>best.ov||(ov===best.ov&&(merged<best.merged||(merged===best.merged&&(i<best.i||(i===best.i&&j<best.j))))))best=b;
  }
  steps.push(best);work=work.filter((_,i)=>i!==best.i&&i!==best.j);work.push(best.merged);work.sort();
 }
 return {strings:ss,exact,greedy:work[0],steps};
}
function edit(a,b){
 const aa=Array.from(a),bb=Array.from(b),D=Array.from({length:aa.length+1},()=>Array(bb.length+1).fill(0));
 for(let i=0;i<=aa.length;i++)D[i][0]=i;for(let j=0;j<=bb.length;j++)D[0][j]=j;
 for(let i=1;i<=aa.length;i++)for(let j=1;j<=bb.length;j++)D[i][j]=Math.min(D[i-1][j]+1,D[i][j-1]+1,D[i-1][j-1]+(aa[i-1]===bb[j-1]?0:1));
 const path=[];let i=aa.length,j=bb.length;
 while(i||j){path.push([i,j]);if(i&&j&&D[i][j]===D[i-1][j-1]+(aa[i-1]===bb[j-1]?0:1)){i--;j--;}else if(i&&D[i][j]===D[i-1][j]+1)i--;else j--;}
 path.push([0,0]);return {aa,bb,D,path:path.reverse(),distance:D[aa.length][bb.length]};
}
function schedule(n,edges){
 const pred=Array(n).fill(0);edges.forEach(([a,b])=>pred[b]|=1<<a);
 const goal=(1<<n)-1,prev=new Map([[0,null]]),queue=[0];
 for(let q=0;q<queue.length;q++){
  const m=queue[q];if(m===goal)break;
  const ready=[];for(let i=0;i<n;i++)if(!(m&(1<<i))&&(pred[i]&m)===pred[i])ready.push(i);
  const add=(sel,start)=>{
   if(sel.length){const z=m|sel.reduce((p,i)=>p|(1<<i),0);if(!prev.has(z)){prev.set(z,[m,sel.slice()]);queue.push(z);}}
   if(sel.length===3)return;for(let k=start;k<ready.length;k++)add([...sel,ready[k]],k+1);
  };add([],0);
 }
 if(!prev.has(goal))throw Error('Граф зависимостей не допускает расписания.');
 let m=goal,exact=[];while(m){const [p,sel]=prev.get(m);exact.push(sel);m=p;}exact.reverse();
 let greedy=[];m=0;while(m!==goal){let ready=[];for(let i=0;i<n;i++)if(!(m&(1<<i))&&(pred[i]&m)===pred[i])ready.push(i);ready=ready.slice(0,3);if(!ready.length)throw Error('Цикл');greedy.push(ready);ready.forEach(i=>m|=1<<i);}
 return {exact,greedy};
}
function area(v){return Math.abs(v.reduce((s,p,i)=>{const q=v[(i+1)%v.length];return s+p[0]*q[1]-p[1]*q[0];},0))/2;}
function polar(v){return v.map((p,i)=>{const q=v[(i+1)%v.length],det=p[0]*q[1]-p[1]*q[0];return [(q[1]-p[1])/det,(p[0]-q[0])/det];});}
function shape(c,s){const raw=[[1,1-c],[1-c,1],[-1+c,1],[-1,1-c],[-1,-1+c],[-1+c,-1],[1-c,-1],[1,-1+c]],uniq=[];raw.forEach(v=>{if(!uniq.some(w=>Math.abs(v[0]-w[0])<1e-10&&Math.abs(v[1]-w[1])<1e-10))uniq.push(v);});return uniq.map(([x,y])=>[x+s*y,y]);}
function switchLaws(start,max){const g=window.EXPERIMENTS.switch,n=g.states.length,first=Array(n).fill(0);first[start]=1;const laws=[first],tv=[1-1/n];for(let t=1;t<=max;t++){const next=Array(n).fill(0);for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(g.counts[i][j])next[j]+=laws[t-1][i]*g.counts[i][j]/g.denominator;laws.push(next);tv.push(next.reduce((s,x)=>s+Math.abs(x-1/n),0)/2);}return {laws,tv};}
window.MathAtlasCore={tables,overlap,scs,edit,schedule,area,polar,shape,switchLaws};

function drawTables(el){
 el.innerHTML=`<div class="demo-head"><span class="eyebrow">Эксперимент 01 · вероятностная мера</span><h2>Семь таблиц — два разных закона</h2></div><div class="controls"><label>Суммы столбцов<select id="table-cols"><option>2,2,2</option><option>1,2,3</option><option>1,1,4</option></select></label><label>Сумма первой строки: <output id="row-value">3</output><input id="table-row" type="range" min="0" max="6" step="1" value="3"></label><label>Выделить закон<select id="table-law"><option value="uniform">Равномерно по таблицам</option><option value="fisher">Условная независимость</option></select></label></div><p id="table-summary" class="metric" aria-live="polite"></p><div id="table-grid" class="table-models"></div>${note('Полное перечисление маленьких таблиц и вычисление их вероятностей. Это не реализация общего нового sampler и не механизм приватности. В выбранном условном законе вес равен 1/∏xᵢⱼ! с последующей нормировкой.')}`;
 const update=()=>{const cols=$('#table-cols',el).value.split(',').map(Number),r=+$('#table-row',el).value,law=$('#table-law',el).value,ts=tables(cols,r);$('#row-value',el).textContent=r;$('#table-summary',el).textContent=`Таблиц: ${ts.length} · строки: [${r}, ${6-r}] · сумма вероятностей: ${num(ts.reduce((s,t)=>s+t[law],0),8)}`;
 $('#table-grid',el).innerHTML=ts.map((t,i)=>`<div class="table-model"><span class="tiny">Таблица ${i+1}</span><table aria-label="Таблица ${i+1}"><tbody><tr>${t.cells.slice(0,3).map(x=>`<td>${x}</td>`).join('')}</tr><tr>${t.cells.slice(3).map(x=>`<td>${x}</td>`).join('')}</tr></tbody></table><div class="prob-label">Равномерно: ${num(t.uniform,4)}</div><div class="prob-track"><span style="width:${100*t.uniform}%" class="${law==='uniform'?'selected':''}"></span></div><div class="prob-label">Независимость: ${num(t.fisher,4)}</div><div class="prob-track alt"><span style="width:${100*t.fisher}%" class="${law==='fisher'?'selected':''}"></span></div></div>`).join('');};el.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',update));update();
}
function drawSwitch(el){
 const g=window.EXPERIMENTS.switch;let start=0,t=0,timer=null,cache=switchLaws(start,200);
 el.innerHTML=`<div class="demo-head"><span class="eyebrow">Эксперимент 02 · конечная цепь</span><h2>Как сеть забывает начальное состояние</h2></div><div class="controls"><label>Исходная сеть<select id="switch-start"><option value="0">Первое состояние каталога</option><option value="${g.states.length-1}">Последнее состояние каталога</option><option value="${g.triangles.findIndex(x=>x===2)}">Два отдельных треугольника</option></select></label><label>Число шагов: <output id="switch-time">0</output><input id="switch-step" type="range" min="0" max="200" value="0"></label><button id="switch-play" type="button">Воспроизвести</button><button id="switch-next" type="button">+1 шаг</button></div><p class="metric" id="switch-metric" aria-live="polite"></p><div id="switch-viz"></div><div id="switch-bars"></div><p class="tiny">Полностью перечислены 70 помеченных простых графов на 6 вершинах со степенями [2,2,2,2,2,2]. Матрица переходов хранится целыми весами со знаменателем 180. Эволюция вероятностей вычисляется с двойной точностью; это не случайно нарисованная траектория.</p>${note('TV показана для выбранного старта, а не как максимум по всем стартам. При n=6 заявленная общая граница 2n⁸ равна 3 359 232 шагам. Малый успешный пример не подтверждает универсальную теорему и не проверяет точный sampler из её следствия.')}`;
 const stop=()=>{if(timer)clearInterval(timer);timer=null;$('#switch-play',el).textContent='Воспроизвести';};
 const update=()=>{const law=cache.laws[t],tri=law.reduce((s,p,i)=>s+p*g.triangles[i],0);$('#switch-time',el).textContent=t;$('#switch-step',el).value=t;$('#switch-metric',el).textContent=`TV = ${num(cache.tv[t],6)} · E[треугольников] = ${num(tri,5)} · равномерный предел: 2/7`;
 let body=text(20,25,'Исходная сеть')+text(300,25,'TV-расстояние до равномерной меры');const pts=Array.from({length:6},(_,i)=>[125+78*Math.cos(i*Math.PI/3-Math.PI/2),145+78*Math.sin(i*Math.PI/3-Math.PI/2)]);
 g.edges.forEach(([a,b],i)=>{if(g.states[start]&(1<<i))body+=`<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}" class="graph-edge"/>`;});
 pts.forEach(([x,y],i)=>body+=`<circle cx="${x}" cy="${y}" r="17" class="graph-node"/>`+text(x-4,y+5,i+1,'node-label'));
 body+=`<path d="M300 50V242H725" class="axis"/><path d="M300 ${242-.25*180}H725" class="threshold"/>`+text(660,192,'TV = 1/4','svg-small')+text(294,265,'0','svg-small')+text(697,265,'200','svg-small');
 const path=cache.tv.map((v,i)=>`${i?'L':'M'}${300+i*2.1},${242-v*180}`).join(' ');body+=`<path d="${path}" class="curve"/><circle cx="${300+t*2.1}" cy="${242-cache.tv[t]*180}" r="6" class="cursor-dot"/>`;
 $('#switch-viz',el).innerHTML=svg(body,'Исходный граф и рассчитанное TV-расстояние');
 const max=Math.max(.03,...law),base=130,scale=100/max;let bars=text(12,18,'Вероятности всех 70 состояний; пунктир — 1/70','svg-small');law.forEach((p,i)=>{bars+=`<rect x="${15+i*10.4}" y="${base-p*scale}" width="7.8" height="${Math.max(.2,p*scale)}" class="prob-bar"/>`;});bars+=`<path d="M12 ${base-scale/70}H749" class="threshold"/>`;$('#switch-bars',el).innerHTML=svg(bars,'Распределение по всем состояниям',760,155);};
 $('#switch-start',el).addEventListener('change',()=>{stop();start=+$('#switch-start',el).value;cache=switchLaws(start,200);t=0;update();});$('#switch-step',el).addEventListener('input',()=>{stop();t=+$('#switch-step',el).value;update();});$('#switch-next',el).addEventListener('click',()=>{stop();t=Math.min(200,t+1);update();});$('#switch-play',el).addEventListener('click',()=>{if(timer){stop();return;}if(window.atlasMotionReduced){$('#switch-play',el).textContent='Движение выключено';return;}if(t===200)t=0;$('#switch-play',el).textContent='Пауза';timer=setInterval(()=>{t++;update();if(t>=200)stop();},150);});window.addEventListener('atlas-motion-change',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});update();
}
function drawSCS(el){
 el.innerHTML=`<div class="demo-head"><span class="eyebrow">Эксперимент 03 · известные базовые методы</span><h2>Greedy против маленького точного оптимума</h2></div><label>От 1 до 8 строк, по одной в строке; не более 18 символов в каждой<textarea id="scs-input" rows="5" spellcheck="false">BCCA\nCAB\nCACA\nCBC\nCCBBC</textarea></label><div class="controls"><button id="scs-run" type="button">Вычислить</button><button id="scs-step" type="button">Следующая склейка Greedy</button><button id="scs-reset" type="button">С начала склеек</button></div><p id="scs-error" role="alert"></p><div id="scs-output" aria-live="polite"></div><div id="scs-steps"></div>${note('Точный эталон — экспоненциальная динамика по подмножествам; Greedy — известное правило максимального перекрытия с фиксированным разрешением ничьих. Ни один из них не является новым полиномиальным алгоритмом с гарантией 2 из рукописи. Малый коэффициент в тесте не даёт универсальной гарантии.')}`;
 let result=null,step=0;
 const showStep=()=>{$('#scs-steps',el).innerHTML=result&&result.steps.length?`<div class="step-box"><strong>Склейка ${Math.min(step+1,result.steps.length)} из ${result.steps.length}</strong><p><code>${esc(result.steps[Math.min(step,result.steps.length-1)].a)}</code> + <code>${esc(result.steps[Math.min(step,result.steps.length-1)].b)}</code> → <code>${esc(result.steps[Math.min(step,result.steps.length-1)].merged)}</code></p><p>Перекрытие: ${result.steps[Math.min(step,result.steps.length-1)].ov} символов.</p></div>`:'';};
 const run=()=>{try{let input=$('#scs-input',el).value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(input.length>8||input.some(x=>x.length>18)||!input.length)throw Error('Введите 1–8 непустых строк длиной до 18 символов.');result=scs(input);step=0;$('#scs-error',el).textContent='';$('#scs-output',el).innerHTML=`<div class="two-stats"><div><span>Точный оптимум</span><strong>${result.exact.length}</strong><code class="string-result">${esc(result.exact)}</code></div><div><span>Greedy</span><strong>${result.greedy.length}</strong><code class="string-result">${esc(result.greedy)}</code></div></div><p class="metric">Отношение длин: ${num(result.greedy.length/result.exact.length,4)} · все исходные строки содержатся: ${input.every(s=>result.exact.includes(s)&&result.greedy.includes(s))?'да':'ОШИБКА'}</p><div class="substring-list">${input.map(s=>`<span><code>${esc(s)}</code> → позиция ${result.exact.indexOf(s)} в оптимуме</span>`).join('')}</div>`;showStep();}catch(e){$('#scs-error',el).textContent=e.message;}};
 $('#scs-run',el).addEventListener('click',run);$('#scs-step',el).addEventListener('click',()=>{if(result){step=Math.min(result.steps.length-1,step+1);showStep();}});$('#scs-reset',el).addEventListener('click',()=>{step=0;showStep();});run();
}
function drawEdit(el){
 el.innerHTML=`<div class="demo-head"><span class="eyebrow">Эксперимент 04 · точная динамика</span><h2>Путь через таблицу правок</h2></div><div class="controls"><label>Первая строка<input id="edit-a" value="kitten" maxlength="12"></label><label>Вторая строка<input id="edit-b" value="sitting" maxlength="12"></label><label>Раскрыть путь<input id="edit-reveal" type="range" min="0" max="100" value="100"></label></div><p id="edit-result" class="metric" aria-live="polite"></p><div id="edit-viz"></div><p>Клетка (i,j) — точное расстояние между первыми i и j символами. Вниз: удаление, вправо: вставка, по диагонали: совпадение или замена. Подсвечен один оптимальный путь.</p>${note('Здесь выполнен обычный O(mn)-алгоритм. Он показывает постановку и точный эталон, но не реализует почти линейное приближение из группы 121. Символы считаются Unicode-кодовыми точками, не пользовательскими графемами.')}`;
 const update=()=>{const r=edit($('#edit-a',el).value,$('#edit-b',el).value),count=Math.ceil(r.path.length*+$('#edit-reveal',el).value/100),shown=new Set(r.path.slice(0,count).map(x=>x.join(','))),cell=34,w=(r.bb.length+2)*cell+20,h=(r.aa.length+2)*cell+20;let b='';
 for(let j=0;j<r.bb.length;j++)b+=text((j+2)*cell+10,25,r.bb[j]);for(let i=0;i<r.aa.length;i++)b+=text(10,(i+2)*cell+24,r.aa[i]);
 for(let i=0;i<=r.aa.length;i++)for(let j=0;j<=r.bb.length;j++){const x=(j+1)*cell,y=(i+1)*cell;b+=`<rect x="${x}" y="${y}" width="${cell-2}" height="${cell-2}" class="${shown.has(i+','+j)?'dp-path':'dp-cell'}"/>`+text(x+10,y+22,r.D[i][j],'svg-small');}
 $('#edit-viz',el).innerHTML=svg(b,'Точная таблица расстояния редактирования',w,h);$('#edit-viz svg',el).style.maxHeight='460px';$('#edit-result',el).textContent=`ED = ${r.distance} · клеток: ${(r.aa.length+1)*(r.bb.length+1)} · стоимость каждой правки: 1`;};el.querySelectorAll('input').forEach(x=>x.addEventListener('input',update));update();
}
function drawSchedule(el){
 const hard=window.EXPERIMENTS.schedule;const samples=[hard,{n:9,edges:[[0,3],[1,3],[2,4],[3,5],[4,5],[5,6],[6,7],[6,8]]},{n:9,edges:[]}];
 el.innerHTML=`<div class="demo-head"><span class="eyebrow">Эксперимент 05 · небольшой точный эталон</span><h2>Три машины и зависимости</h2></div><div class="controls"><label>Набор задач<select id="schedule-input"><option value="0">Найденный пример: жадное расписание хуже</option><option value="1">Граф с узким местом</option><option value="2">Девять независимых задач</option></select></label><label>Показать тактов: <output id="schedule-count"></output><input id="schedule-time" type="range" min="0" max="6" value="6"></label></div><p id="schedule-result" class="metric" aria-live="polite"></p><div id="schedule-viz"></div><details><summary>Зависимости исходного графа</summary><p id="schedule-edges"></p></details>${note('Расписание найдено старым точным поиском по 2ⁿ подмножествам, а не заявленным полиномиальным алгоритмом степени 150020. Локальные примеры не доказывают класс сложности. Длительность каждой задачи — ровно один такт; машин всегда три.')}`;
 const update=()=>{const s=samples[+$('#schedule-input',el).value],r=schedule(s.n,s.edges),mx=Math.max(r.exact.length,r.greedy.length),slider=$('#schedule-time',el);slider.max=mx;const reveal=Math.min(mx,+slider.value);$('#schedule-count',el).textContent=reveal;$('#schedule-result',el).textContent=`Оптимум: ${r.exact.length} тактов · жадный выбор по номеру: ${r.greedy.length} · задач: ${s.n}`;$('#schedule-edges',el).textContent=s.edges.length?s.edges.map(([a,b])=>`${a+1} → ${b+1}`).join('; '):'Зависимостей нет.';
 let body='';const sw=600/mx;
 [r.exact,r.greedy].forEach((slots,k)=>{const y0=35+k*155;body+=text(15,y0-12,k?'Жадное расписание':'Оптимальное расписание');for(let lane=0;lane<3;lane++){body+=text(15,y0+lane*36+22,'М'+(lane+1),'svg-small');body+=`<path d="M60 ${y0+lane*36+32}H740" class="axis"/>`;}slots.forEach((jobs,t)=>{if(t>=reveal)return;jobs.forEach((job,l)=>{const x=65+t*sw,y=y0+l*36;body+=`<rect x="${x}" y="${y}" width="${sw-8}" height="29" rx="5" class="job job-${job%3}"/>`+text(x+9,y+21,job+1,'node-label');});});for(let t=0;t<mx;t++)body+=text(65+t*sw,y0+126,t+1,'svg-small');});$('#schedule-viz',el).innerHTML=svg(body,'Сравнение двух допустимых расписаний',760,340);};$('#schedule-input',el).addEventListener('change',()=>{$('#schedule-time',el).value=99;update();});$('#schedule-time',el).addEventListener('input',update);update();
}
function drawCrouzeix(el){
 el.innerHTML=`<div class="demo-head"><span class="eyebrow">Эксперимент 06 · точная геометрия 2×2</span><h2>Нулевой спектр, ненулевая норма</h2></div><div class="controls"><label>Внедиагональный элемент a: <output id="c-a-value"></output><input id="c-a" type="range" min="0" max="4" step="0.05" value="2"></label><label>Диагональный сдвиг b: <output id="c-b-value"></output><input id="c-b" type="range" min="0" max="2" step="0.05" value="0"></label></div><p class="math-line">A = [[b, a], [0, b]], p(z) = z</p><p id="c-metric" class="metric" aria-live="polite"></p><div id="c-viz"></div><p>W(A) — диск с центром b и радиусом a/2. Точная норма: (√(a²+4b²)+a)/2. При b=0 и a&gt;0 отношение равно 2; одни собственные значения ничего не сообщают о величине a.</p>${note('Это скалярный полином и известный двумерный случай. Он показывает необходимость константы 2, но не доказывает достаточность для всех матриц или полное матрично-значное усиление из коллекции. Область и норма здесь вычислены аналитически, не угаданы по сетке.')}`;
 const update=()=>{const a=+$('#c-a',el).value,b=+$('#c-b',el).value,r=a/2,norm=(Math.sqrt(a*a+4*b*b)+a)/2,max=b+r,ratio=max?norm/max:null;$('#c-a-value',el).textContent=num(a,2);$('#c-b-value',el).textContent=num(b,2);$('#c-metric',el).textContent=`||A|| = ${num(norm,5)} · max |z| на W(A) = ${num(max,5)} · отношение = ${ratio===null?'не определено (0/0)':num(ratio,5)}`;
 const sc=95/Math.max(1,r/1.1),sx=x=>180+x*sc,cy=140;let v=`<path d="M25 140H725M180 25V258" class="axis"/><circle cx="${sx(b)}" cy="${cy}" r="${r*sc}" class="numerical-disk"/><circle cx="${sx(b)}" cy="${cy}" r="5" class="cursor-dot"/>`+text(sx(b)+8,cy-10,'спектр: b','svg-small')+text(620,162,'Re z','svg-small')+text(195,33,'Im z','svg-small');if(r>0)v+=`<path d="M${sx(b)} ${cy}H${sx(b+r)}" class="radius-line"/>`+text(sx(b+r/2)-15,cy+23,'a/2','svg-small');for(let x=-1;x<=5;x++)v+=text(sx(x)-3,cy+18,x,'svg-small');$('#c-viz',el).innerHTML=svg(v,'Числовая область матрицы и её спектр');};el.querySelectorAll('input').forEach(x=>x.addEventListener('input',update));update();
}
function drawMahler(el){
 el.innerHTML=`<div class="demo-head"><span class="eyebrow">Эксперимент 07 · полярная двойственность</span><h2>Срезаем углы — меняем полярное тело</h2></div><div class="controls"><label>Срез углов c: <output id="m-c-value"></output><input id="m-c" type="range" min="0" max="1" step="0.01" value="0.35"></label><label>Сдвиг формы x ← x+s·y: <output id="m-s-value"></output><input id="m-s" type="range" min="-1" max="1" step="0.05" value="0"></label></div><p id="m-metric" class="metric" aria-live="polite"></p><div id="m-viz"></div><p>Слева K, справа K°={y: x·y≤1 для всех x∈K}. Линейный сдвиг с определителем 1 сохраняет площадь K; полярное преобразуется обратной транспонированной матрицей. При c=0 квадрат и ромб дают произведение 8.</p>${note('Вершины полярного многоугольника получаются пересечением соседних граничных прямых; площади — формулой ориентированной площади. Вычисления с плавающей точкой. Это двумерное семейство, известное задолго до коллекции, а не проверка гипотезы во всех размерностях или классификации Ханнера.')}`;
 const update=()=>{const c=+$('#m-c',el).value,s=+$('#m-s',el).value,K=shape(c,s),P=polar(K),a=area(K),b=area(P);$('#m-c-value',el).textContent=num(c,2);$('#m-s-value',el).textContent=num(s,2);$('#m-metric',el).textContent=`|K| = ${num(a,6)} · |K°| = ${num(b,6)} · произведение = ${num(a*b,6)} · 2D-граница: 8`;
 let v='';[K,P].forEach((poly,i)=>{const cx=i?565:195,cy=150,sc=65;v+=`<path d="M${cx-170} ${cy}H${cx+170}M${cx} 38V264" class="axis"/><polygon points="${poly.map(([x,y])=>`${cx+x*sc},${cy-y*sc}`).join(' ')}" class="${i?'polar-body':'convex-body'}"/>`+text(cx-12,24,i?'K°':'K');poly.forEach(([x,y])=>v+=`<circle cx="${cx+x*sc}" cy="${cy-y*sc}" r="3" class="cursor-dot"/>`);});$('#m-viz',el).innerHTML=svg(v,'Исходный выпуклый многоугольник и его полярное',760,285);};el.querySelectorAll('input').forEach(x=>x.addEventListener('input',update));update();
}
function drawAsymptotic(el){
 el.innerHTML=`<div class="demo-head"><span class="eyebrow">Эксперимент 08 · чтение асимптотики</span><h2>Улучшение показателя в увеличительном стекле</h2></div><label>Размер входа n = 2ᵇ бит; b = <output id="asym-b"></output><input id="asym-input" type="range" min="2" max="1024" value="64" step="1"></label><div class="equation-board"><p>κ = 2⁻¹⁸² ≈ <span id="asym-k"></span></p><p>Формальный множитель: (log₂n)ᵏ = bᵏ</p><p>Множитель минус 1: <strong id="asym-gain"></strong></p></div><p id="asym-result" class="metric" aria-live="polite"></p>${note('Здесь вычисляется expm1(κ·ln b), чтобы не потерять крошечную разницу при вычитании 1. Это отношение форм роста после искусственного удаления неизвестных констант и порога. Оно не является прогнозом реального ускорения, а измерений нового умножителя не проводилось.')}`;
 const update=()=>{const b=+$('#asym-input',el).value,k=2**-182,x=Math.expm1(k*Math.log(b));$('#asym-b',el).textContent=b;$('#asym-k',el).textContent=k.toExponential(5);$('#asym-gain',el).textContent=x.toExponential(7);$('#asym-result',el).textContent=`Даже для записи из 2^${b} бит добавка к единице составляет ${x.toExponential(3)}. Скрытая константа легко доминирует над ней.`;};$('#asym-input',el).addEventListener('input',update);update();
}
const init={tables:drawTables,switch:drawSwitch,superstring:drawSCS,edit:drawEdit,schedule:drawSchedule,crouzeix:drawCrouzeix,mahler:drawMahler,asymptotic:drawAsymptotic};
document.querySelectorAll('[data-demo]').forEach(el=>{try{init[el.dataset.demo](el);}catch(e){el.innerHTML='<p role="alert">Ошибка демонстрации: '+esc(e.message)+'</p>';console.error(e);}});
})();