'use strict';
(() => {
  const H = window.ATLAS_HUMAN || {};
  const entries = H.entries || H.groups || [];
  const worksObj = H.works || {};
  const worksList = Object.values(worksObj);
  const groups = window.ATLAS?.catalog?.groups || [];
  const worksCatalog = Object.fromEntries((window.ATLAS?.catalog?.works || []).map(w => [w.id, w]));

  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const grid = document.getElementById('human-grid');
  const searchInput = document.getElementById('human-search');
  const topicSelect = document.getElementById('human-topic');
  const tabWorks = document.getElementById('tab-works');
  const tabGroups = document.getElementById('tab-groups');
  const countLabel = document.getElementById('human-count');
  const pageInfo = document.getElementById('human-page-info');
  const prevBtn = document.getElementById('human-prev');
  const nextBtn = document.getElementById('human-next');

  let currentMode = 'works'; // 'works' | 'groups'
  let currentPage = 1;
  const pageSize = 24;

  // Build unique topics list
  const topicsSet = new Set();
  worksList.forEach(w => w.area && topicsSet.add(w.area));
  entries.forEach(e => e.topic && topicsSet.add(e.topic));
  for (const name of Array.from(topicsSet).sort()) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    topicSelect.append(opt);
  }

  function setMode(mode) {
    currentMode = mode;
    tabWorks.classList.toggle('active', mode === 'works');
    tabWorks.setAttribute('aria-selected', mode === 'works');
    tabGroups.classList.toggle('active', mode === 'groups');
    tabGroups.setAttribute('aria-selected', mode === 'groups');
    currentPage = 1;
    render();
  }

  tabWorks.addEventListener('click', () => setMode('works'));
  tabGroups.addEventListener('click', () => setMode('groups'));

  function renderWorkCard(w) {
    const cat = worksCatalog[w.work_id] || {};
    const pdfPath = w.local_href || cat.local_href || `../math/${cat.pdf || ''}`;
    const onlineUrl = cat.online_url || `https://github.com/openai/math/blob/fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb/${cat.pdf || ''}`;

    const sections = [
      ['question', 'В чём вопрос и почему он возникает', ''],
      ['example', 'Пример на пальцах', ''],
      ['claim', 'Что заявлено в статье', ''],
      ['novelty', 'Что нового по сравнению с прежним состоянием', ''],
      ['benefit', 'Какой выхлоп: что можно вычислять или гарантировать', ''],
      ['applications', 'Возможные применения (или их отсутствие)', ''],
      ['limit', 'Чего результат НЕ означает и ограничения', ' human-limit'],
      ['action', 'Что можно сделать сейчас', ' human-action']
    ];

    let html = `<article class="human-card work-card" id="work-${escape(w.work_id)}">`;
    html += `<div class="card-top">`;
    html += `  <span class="eyebrow">${escape(w.area || '')} · Рукопись ${escape(w.work_id)}</span>`;
    html += `  <div style="display:flex;gap:6px;flex-wrap:wrap">`;
    html += `    <span class="tag-role">${escape(w.role || 'Разбор')}</span>`;
    html += `    <span class="tag-level">Семейство ${escape(w.group_id)}</span>`;
    html += `  </div>`;
    html += `</div>`;

    html += `<h3>${escape(w.title_ru)}</h3>`;
    html += `<p class="original-title">${escape(w.title_original)}</p>`;

    for (const [key, label, extraClass] of sections) {
      if (w[key]) {
        html += `<div class="human-block${extraClass}"><h4>${label}</h4><p>${escape(w[key])}</p></div>`;
      }
    }

    html += `<details>`;
    html += `  <summary>Источники, охват чтения и проверка</summary>`;
    html += `  <p><strong>Реальный охват чтения:</strong> ${escape(w.read_scope || 'Каталог')} (${escape(w.source_pages || '')}).</p>`;
    html += `  <p><strong>Статус проверки:</strong> ${escape(w.verification_status || 'Авторский препринт')}.</p>`;
    if (w.dependencies && w.dependencies.length) {
      html += `  <p><strong>Связанные работы / группы:</strong> ${escape(w.dependencies.join(', '))}.</p>`;
    }
    html += `  <div class="source-links">`;
    html += `    <a href="${escape(pdfPath)}" target="_blank">Открыть локальный PDF (${cat.pages || '?'} с.)</a>`;
    html += `    <a href="${escape(onlineUrl)}" target="_blank" rel="noopener">GitHub (снимок fd4aeeb)</a>`;
    html += `    <a href="index.html?group=${escape(w.group_id)}&mode=all#catalog">Семейство ${escape(w.group_id)} в общем каталоге →</a>`;
    html += `  </div>`;
    html += `</details>`;
    html += `</article>`;
    return html;
  }

  function renderGroupCard(e) {
    const group = groups.find(g => g.id === e.id) || {};
    const groupWorks = (group.work_ids || []).map(id => worksCatalog[id] || { id });

    const sections = [
      ['question', 'В чём вопрос'],
      ['example', 'Пример на пальцах'],
      ['claim', 'Что заявляют авторы'],
      ['benefit', 'Что это меняет'],
      ['limit', 'Чего из этого НЕ следует'],
      ['action', 'Что можно сделать сейчас']
    ];

    let html = `<article class="human-card group-card" id="human-${escape(e.id)}">`;
    html += `<div class="card-top">`;
    html += `  <span class="eyebrow">${escape(e.topic || group.area || '')} · Семейство ${escape(e.id)}</span>`;
    html += `  <span class="tag-level">${escape(e.level || 'Вводный обзор')}</span>`;
    html += `</div>`;
    html += `<h3>${escape(e.title)}</h3>`;

    for (const [key, label] of sections) {
      if (e[key]) {
        html += `<div class="human-block${key === 'limit' ? ' human-limit' : ''}"><h4>${label}</h4><p>${escape(e[key])}</p></div>`;
      }
    }

    if (groupWorks.length) {
      html += `<div class="group-papers-box">`;
      html += `  <h5>Рукописи семейства (${groupWorks.length}):</h5>`;
      for (const pw of groupWorks) {
        const hasWorkExp = Boolean(worksObj[pw.id]);
        html += `  <div class="group-paper-item">`;
        html += `    <span><strong>${escape(pw.id)}:</strong> ${escape(pw.title || '')}</span>`;
        if (hasWorkExp) {
          html += `    <a href="#work-${escape(pw.id)}" class="tag-role jump-to-work" data-work="${escape(pw.id)}">Подробный разбор →</a>`;
        } else {
          html += `    <small style="color:#64748b">разбор готовится</small>`;
        }
        html += `  </div>`;
      }
      html += `</div>`;
    }

    html += `<details>`;
    html += `  <summary>Точное название и исходное заявление</summary>`;
    html += `  <p><strong>${escape(group.title_ru || '')}</strong></p>`;
    html += `  <p>${escape(group.claim_original || '')}</p>`;
    html += `  <p class="tiny">Источник: авторский каталог, группа ${escape(e.id)}. ${escape(H.coverage || '')}</p>`;
    html += `</details>`;

    html += `<div class="source-links">`;
    html += `  <a href="index.html?group=${escape(e.id)}&mode=all#catalog">Все работы и источники семейства →</a>`;
    if (group.review_href) {
      html += `  <a href="${escape(group.review_href)}">Технический аудит →</a>`;
    }
    html += `</div>`;
    html += `</article>`;
    return html;
  }

  function render() {
    const q = searchInput.value.trim().toLocaleLowerCase('ru');
    const selectedTopic = topicSelect.value;

    let items = [];
    if (currentMode === 'works') {
      items = worksList.filter(w => {
        const matchTopic = selectedTopic === 'all' || w.area === selectedTopic;
        if (!matchTopic) return false;
        if (!q) return true;
        const text = [
          w.work_id, w.group_id, w.title_ru, w.title_original,
          w.question, w.example, w.claim, w.novelty, w.benefit,
          w.applications, w.limit, w.action, w.role, w.area
        ].join(' ').toLocaleLowerCase('ru');
        return text.includes(q);
      });
      countLabel.textContent = `Индивидуальных разборов рукописей: ${items.length} из ${worksList.length} (всего в коллекции 719).`;
    } else {
      items = entries.filter(e => {
        const matchTopic = selectedTopic === 'all' || e.topic === selectedTopic;
        if (!matchTopic) return false;
        if (!q) return true;
        const text = Object.values(e).join(' ').toLocaleLowerCase('ru');
        return text.includes(q);
      });
      countLabel.textContent = `Вводных разборов семейств: ${items.length} из ${entries.length} (всего в коллекции 372).`;
    }

    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    currentPage = Math.max(1, Math.min(currentPage, totalPages));

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    pageInfo.textContent = `${currentPage} / ${totalPages}`;

    const slice = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (!slice.length) {
      grid.innerHTML = `<p class="empty-state">Ничего не найдено по этому запросу. Попробуйте изменить формулировку, выбрать другую тему или переключить режим.</p>`;
      return;
    }

    grid.innerHTML = slice.map(item => currentMode === 'works' ? renderWorkCard(item) : renderGroupCard(item)).join('');

    // Attach jump listeners
    grid.querySelectorAll('.jump-to-work').forEach(btn => {
      btn.addEventListener('click', evt => {
        evt.preventDefault();
        const wid = btn.dataset.work;
        setMode('works');
        searchInput.value = wid;
        render();
        const target = document.getElementById('work-' + wid);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  searchInput.addEventListener('input', () => { currentPage = 1; render(); });
  topicSelect.addEventListener('change', () => { currentPage = 1; render(); });

  prevBtn.addEventListener('click', () => {
    currentPage--;
    render();
    document.getElementById('human-count').scrollIntoView();
  });
  nextBtn.addEventListener('click', () => {
    currentPage++;
    render();
    document.getElementById('human-count').scrollIntoView();
  });

  // Handle URL hashes and query parameters
  const params = new URLSearchParams(location.search);
  const targetWork = params.get('work');
  const targetGroup = params.get('group');

  if (targetWork && worksObj[targetWork]) {
    setMode('works');
    searchInput.value = targetWork;
    render();
  } else if (targetGroup) {
    setMode('groups');
    searchInput.value = targetGroup;
    render();
  } else if (location.hash.startsWith('#work-')) {
    const wid = location.hash.replace('#work-', '');
    setMode('works');
    if (worksObj[wid]) {
      searchInput.value = wid;
      render();
    }
  } else if (location.hash.startsWith('#human-') || location.hash.startsWith('#group-')) {
    const gid = location.hash.replace(/#(human|group)-/, '');
    setMode('groups');
    searchInput.value = gid;
    render();
  } else {
    render();
  }
})();
