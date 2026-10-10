window.ATLAS_LABELS={"areas": {"Number theory": ["Теория чисел", "Простые числа, арифметические уравнения, L-функции и рациональные точки."], "Algebraic and complex geometry": ["Алгебраическая и комплексная геометрия", "Пространства, заданные уравнениями, их циклы, особенности и минимальные модели."], "Real and complex analysis": ["Вещественный и комплексный анализ", "Преобразования Фурье, сходимость, гладкость и геометрия функций."], "Convex and metric geometry": ["Выпуклая и метрическая геометрия", "Форма тел, объёмы, расстояния, вложения и искажения."], "Theoretical computer science": ["Теоретическая информатика", "Алгоритмы, приближения, память, случайность и нижние границы сложности."], "Dynamical systems and ergodic theory": ["Динамика и эргодическая теория", "Долговременное поведение систем, перемешивание и энтропия."], "Combinatorics": ["Комбинаторика", "Раскраски, разложения, графы, конфигурации и дискретные экстремумы."], "Algebra": ["Алгебра", "Кольца, модули, представления и структурные контрпримеры."], "Probability and statistical mechanics": ["Вероятность и статистическая механика", "Случайные структуры, фазовые переходы, масштабные пределы и смешивание."], "Mathematical logic": ["Математическая логика", "Вычислимость, аксиомы, разрешимость и независимость утверждений."], "Group theory": ["Теория групп", "Алгебраические симметрии и их геометрические модели."], "Mathematical physics": ["Математическая физика", "Идеализированные квантовые, гравитационные и статистические модели."], "Operator algebras": ["Операторные алгебры", "Алгебры операторов, следы, факторы, устойчивость и классификация."], "Topology": ["Топология", "Глобальная форма пространств, гомотопия, вложения и многообразия."], "Functional analysis": ["Функциональный анализ", "Нормированные пространства, операторы и геометрия бесконечной размерности."], "Differential geometry": ["Дифференциальная геометрия", "Кривизна, геодезические, геометрические потоки и симплектические структуры."], "Partial differential equations": ["Уравнения в частных производных", "Гладкость, единственность, особенности и обратные задачи."]}, "app": {"0": "Не оценено", "1": "Реализовать или испытать сейчас", "2": "Теоретическая гарантия / ограничение", "3": "Нужны исследования и инженерия", "4": "Фундаментально; прямое применение не выявлено"}};
'use strict';
(()=>{
const A=window.ATLAS, labels=window.ATLAS_LABELS;
const C=A.catalog, G=C.groups, W=Object.fromEntries(C.works.map(w=>[w.id,w]));
const R=Object.fromEntries(A.reviews.map(r=>[r.id,r]));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId=id=>document.getElementById(id);
const types={algorithm:'Алгоритм / подсчёт',bound:'Оценка / порог',limitation:'Трудность / ограничение',counterexample:'Контрпример',existence:'Существование',classification:'Классификация',other:'Тип не уточнён'};
const fields=['search','area-filter','app-filter','type-filter','trust-filter','selected-only'];
if(document.getElementById('human-only'))fields.push('human-only');
const H=Object.fromEntries((window.ATLAS_HUMAN?.entries||[]).map(e=>[e.id,e]));
const HW=window.ATLAS_HUMAN?.works||{};
let page=1;const size=24;
const texts=new Map(G.map(g=>[g.id,[g.id,g.title_ru,g.title_original,g.claim_original,g.area,labels.areas[g.area]?.[0],...Object.values(H[g.id]||{}),...g.work_ids.map(id=>[W[id].id,W[id].title,W[id].abstract_original,W[id].pdf,...(HW[id]?Object.values(HW[id]):[])].join(' '))].join(' ').toLocaleLowerCase('ru')]));
const areaSelect=byId('area-filter');
for(const [area,info] of Object.entries(labels.areas)){
 const num=G.filter(g=>g.area===area).length;
 const op=document.createElement('option');op.value=area;op.textContent=info[0]+' · '+num;areaSelect.append(op);
 const b=document.createElement('button');b.type='button';b.className='area-card';b.dataset.area=area;b.title=info[1];b.setAttribute('aria-pressed','false');b.innerHTML='<span>'+esc(info[0])+'</span><strong>'+num+'</strong>';
 b.addEventListener('click',()=>{areaSelect.value=areaSelect.value===area?'all':area;page=1;render();byId('catalog').scrollIntoView({behavior:document.documentElement.classList.contains('reduced-motion')?'auto':'smooth'});});byId('area-map').append(b);
}
function paper(w){
 const hw=HW[w.id];
 const cov=hw?('Разбор: '+hw.read_scope):(w.read_detail?'Просмотрены PDF с. '+w.read_detail.pages+'; не весь текст':'Только каталог');
 const hlink=hw?' <a href="human.html#work-'+esc(w.id)+'" style="font-weight:600;color:var(--teal)">Объяснение на пальцах →</a>':'';
 return '<div class="paper-row"><strong>'+esc(w.id)+'</strong> '+esc(w.title)+(hw?' <span class="tag" style="padding:2px 6px;font-size:0.75rem">'+esc(hw.role)+'</span>':'')+'<small>'+esc(cov)+' · '+w.pages+' с.</small>'+hlink+'<p class="source-links"><a href="'+esc(w.local_href||w.bundled_pdf)+'" target="_blank">PDF ('+w.pages+' с.)</a><a href="'+esc(w.online_url)+'" target="_blank" rel="noopener">GitHub (снимок fd4aeeb)</a></p><code class="source-path">'+esc(w.pdf)+'</code><small>CONTENTS.md, строка '+w.source_line+' · SHA-256 в catalog.json</small></div>';
}
function card(g){
  const r=R[g.id], h=H[g.id], title=h?'<a href="human.html#human-'+g.id+'">'+esc(h.title)+'</a>':g.review_href?'<a href="'+g.review_href+'">'+esc(g.title_ru)+'</a>':esc(g.title_ru);
 const source='<a href="sources/context/CONTENTS.md">CONTENTS.md</a>, строка '+g.source_line;
 let html='<article class="catalog-card'+(g.selected?' selected':'')+'" id="group-'+g.id+'"><div class="card-top"><span class="eyebrow">СЕМЕЙСТВО '+g.id+'</span><span class="tiny">'+g.work_ids.length+' рук.</span></div><h3>'+title+'</h3><p class="tiny">'+esc(labels.areas[g.area]?.[0]||g.area)+'</p><div class="tags"><span class="tag">'+esc(types[g.type]||g.type)+'</span><span class="tag gray">'+esc(labels.app[g.applicability])+'</span></div>';
  html+=h?'<p><strong>Вопрос.</strong> '+esc(h.question)+'</p><p><strong>Идея на примере.</strong> '+esc(h.example)+'</p><p><strong>Что заявлено.</strong> '+esc(h.claim)+'</p><p><strong>Выхлоп.</strong> '+esc(h.benefit)+'</p><details><summary>Что можно сделать и чего не стоит обещать</summary><p>'+esc(h.action)+'</p><p class="analysis-warning">'+esc(h.limit)+'</p></details><p><a href="human.html#human-'+g.id+'">Полное объяснение простыми словами →</a></p>':'<p>'+(r?esc(r.hook):'Простого объяснения этой работы пока нет: ниже только заявление каталога и источники, не оценка пользы.')+'</p>';
 html+='<p class="tiny">'+(g.selected?'Вводный разбор; полный аудит не выполнен.':'Не прочитано; тип результата — предварительная метка по заголовку.')+'</p>';
 html+='<p class="tiny">'+(g.scope_href?'<a href="'+g.scope_href+'">Есть описание формального охвата</a>; Lean не запускался.':'Отдельного scope note нет; это не заключение о корректности.')+'</p>';
 if(g.depends_on_catalog.length)html+='<p class="analysis-warning">Каталог явно ссылается на семейство '+g.depends_on_catalog.map(id=>'<a href="?group='+id+'#catalog">'+id+'</a>').join(', ')+'. Не считать следствие независимым прорывом.</p>';
 if(g.review_href)html+='<p><a href="'+g.review_href+'">Условия, интуиция, риски и практика →</a></p>';
 html+='<details><summary>Оригинал заявления и источники ('+g.work_ids.length+')</summary><p><strong>'+esc(g.title_original)+'</strong></p><p>'+esc(g.claim_original)+'</p><p class="tiny">Это заявление авторского каталога, не наше подтверждение. '+source+'.</p>'+g.work_ids.map(id=>paper(W[id])).join('')+'</details></article>';
 return html;
}
function extraCard(x){
 const title=x.folder.replace(/^preprints\//,'').replace(/-/g,' ');
 return '<article class="catalog-card"><span class="tag red">Отозвано · вне 719</span><h3>'+esc(title)+'</h3><p>Прочитано уведомление об отзыве, а не полное доказательство. Отзыв конструкции не доказывает ложность самого математического утверждения.</p><p><a href="'+esc(x.bundled_readme)+'">Локальное уведомление</a> · <a href="verification.html#withdrawals">Причина и зависимости</a></p><code class="source-path">math_sources/'+esc(x.archive.slice(0,-4))+'/'+esc(x.folder)+'</code></article>';
}
function render(){
 const q=byId('search').value.trim().toLocaleLowerCase('ru'),area=areaSelect.value,app=byId('app-filter').value,type=byId('type-filter').value,trust=byId('trust-filter').value,selected=byId('selected-only').checked;
 let arr;
 if(trust==='withdrawn')arr=C.extra_folders.filter(x=>x.status==='withdrawn'&&(!q||(x.folder+' '+x.readme).toLocaleLowerCase('ru').includes(q)));
  else arr=G.filter(g=>(!q||texts.get(g.id).includes(q))&&(area==='all'||g.area===area)&&(app==='all'||String(g.applicability)===app)&&(type==='all'||g.type===type)&&(trust==='all'||g.trust===trust)&&(!selected||g.selected)&&(!byId('human-only')?.checked||H[g.id]));
 const pages=Math.max(1,Math.ceil(arr.length/size));page=Math.max(1,Math.min(page,pages));
 byId('catalog-count').textContent=trust==='withdrawn'?'Отозванных папок: '+arr.length+' (отдельно от текущего каталога; остальные фильтры не применяются).':'Найдено семейств: '+arr.length+' из 372 · рукописей: '+arr.reduce((n,g)=>n+g.work_ids.length,0)+'.';
 const empty=trust==='independent'?'В выполненном ограниченном поиске независимое подтверждение новых главных теорем не установлено. Это не доказательство отсутствия таких проверок.':app==='1'?'Категория пока пуста: ни один новый алгоритм коллекции не воспроизведён здесь как готовая реализация. Известные методы для MVP описаны на странице проектов.':'Совпадений нет. Измените запрос или сбросьте фильтры.';
 byId('catalog-grid').innerHTML=arr.length?arr.slice((page-1)*size,page*size).map(trust==='withdrawn'?extraCard:card).join(''):'<div class="empty-state"><p>'+empty+'</p></div>';
 byId('prev-page').disabled=page===1;byId('next-page').disabled=page===pages;byId('page-count').textContent=page+' / '+pages;
 document.querySelectorAll('.area-card').forEach(b=>{const active=b.dataset.area===area;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
fields.forEach(id=>byId(id).addEventListener(id==='search'?'input':'change',()=>{page=1;render();}));
byId('reset-filters').addEventListener('click',()=>{byId('search').value='';['area-filter','app-filter','type-filter','trust-filter'].forEach(id=>byId(id).value='all');byId('selected-only').checked=false;if(byId('human-only'))byId('human-only').checked=false;page=1;render();});
byId('prev-page').addEventListener('click',()=>{page--;render();byId('catalog-count').scrollIntoView();});byId('next-page').addEventListener('click',()=>{page++;render();byId('catalog-count').scrollIntoView();});
const target=new URLSearchParams(location.search).get('group');if(target&&/^\d{3}$/.test(target))byId('search').value=target;
if(byId('human-only')&&(target||new URLSearchParams(location.search).get('mode')==='all'))byId('human-only').checked=false;
render();
})();
