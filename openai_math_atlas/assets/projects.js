/**
 * Interactive Client Logic for OpenAI Math Atlas Commercial Projects (SaaS)
 * 100% offline-compatible, works with file:// protocol via window.ATLAS_PROJECTS.
 */

(function () {
  'use strict';

  let currentCategory = 'all';
  let currentSearch = '';
  let currentTimeline = 'all';
  let projectsData = [];

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function init() {
    if (window.ATLAS_PROJECTS && Array.isArray(window.ATLAS_PROJECTS)) {
      projectsData = window.ATLAS_PROJECTS;
      setupUI();
    } else {
      // Fallback in case of server/fetch environment
      fetch('notes/projects.json')
        .then((res) => res.json())
        .then((data) => {
          projectsData = data;
          setupUI();
        })
        .catch((err) => {
          console.error('Failed to load projects data:', err);
          const grid = document.getElementById('projects-grid');
          if (grid) {
            grid.innerHTML = '<div class="p-empty"><h3>Ошибка загрузки проектов</h3><p>Не удалось загрузить данные из assets/projects-data.js или notes/projects.json.</p></div>';
          }
        });
    }
  }

  function setupUI() {
    renderCategoryTabs();
    setupEventListeners();
    applyFilters();
    checkHashAnchor();
  }

  function getCategories() {
    const counts = { all: projectsData.length };
    projectsData.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }

  function renderCategoryTabs() {
    const tabsContainer = document.getElementById('category-tabs');
    if (!tabsContainer) return;

    const counts = getCategories();
    const categories = [
      { key: 'all', label: 'Все проекты', count: counts.all || 0 },
      { key: 'DevTools и облачная инфраструктура', label: 'DevTools & Cloud AI', count: counts['DevTools и облачная инфраструктура'] || 0 },
      { key: 'Логистика, CAD и производство', label: 'Логистика & CAD', count: counts['Логистика, CAD и производство'] || 0 },
      { key: 'Финтех, трейдинг и квант-аналитика', label: 'Финтех & Кванты', count: counts['Финтех, трейдинг и квант-аналитика'] || 0 },
      { key: 'Медтех, сенсоры и физическое моделирование', label: 'Медтех & DeepTech', count: counts['Медтех, сенсоры и физическое моделирование'] || 0 },
      { key: 'Кибербезопасность, Web3 и криптография', label: 'Безопасность & Web3', count: counts['Кибербезопасность, Web3 и криптография'] || 0 }
    ];

    tabsContainer.innerHTML = categories.map((cat) => `
      <button type="button" class="cat-tab ${cat.key === currentCategory ? 'active' : ''}" data-cat="${escapeHtml(cat.key)}">
        ${escapeHtml(cat.label)}
        <span class="cat-badge">${cat.count}</span>
      </button>
    `).join('');

    tabsContainer.querySelectorAll('.cat-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentCategory = btn.getAttribute('data-cat');
        tabsContainer.querySelectorAll('.cat-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });
  }

  function setupEventListeners() {
    const searchInput = document.getElementById('project-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim().toLowerCase();
        applyFilters();
      });

      // Shortcut '/' to focus search
      window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      });
    }

    const timelineSelect = document.getElementById('timeline-filter');
    if (timelineSelect) {
      timelineSelect.addEventListener('change', (e) => {
        currentTimeline = e.target.value;
        applyFilters();
      });
    }

    window.addEventListener('hashchange', checkHashAnchor);
  }

  function applyFilters() {
    const filtered = projectsData.filter((p) => {
      // Category filter
      if (currentCategory !== 'all' && p.category !== currentCategory) {
        return false;
      }

      // Timeline filter
      if (currentTimeline !== 'all') {
        const weeks = parseInt(p.dev_timeline_weeks, 10);
        if (currentTimeline === '2' && weeks > 2) return false;
        if (currentTimeline === '3' && weeks !== 3) return false;
        if (currentTimeline === '4' && weeks < 4) return false;
      }

      // Search query
      if (currentSearch) {
        const query = currentSearch;
        const haystack = [
          p.id,
          p.title,
          p.tagline,
          p.target_audience,
          p.market_pain,
          p.secret_sauce,
          (p.product_features || []).join(' '),
          p.mvp_stack ? Object.values(p.mvp_stack).join(' ') : '',
          p.math_foundation ? p.math_foundation.core_theorem : '',
          (p.math_foundation && p.math_foundation.work_ids ? p.math_foundation.work_ids.join(' ') : '')
        ].join(' ').toLowerCase();

        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    });

    renderProjects(filtered);
  }

  function renderProjects(projects) {
    const grid = document.getElementById('projects-grid');
    const counter = document.getElementById('projects-count');

    if (counter) {
      counter.innerHTML = `Показано <strong>${projects.length}</strong> из <strong>${projectsData.length}</strong> проектов`;
    }

    if (!grid) return;

    if (projects.length === 0) {
      grid.innerHTML = `
        <div class="p-empty">
          <h3>Ничего не найдено</h3>
          <p>Попробуйте смягчить поисковый запрос или выбрать категорию «Все проекты».</p>
          <button type="button" class="button secondary" id="reset-filter-btn">Сбросить фильтры</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filter-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          currentCategory = 'all';
          currentSearch = '';
          currentTimeline = 'all';
          const searchInput = document.getElementById('project-search');
          if (searchInput) searchInput.value = '';
          const timelineSelect = document.getElementById('timeline-filter');
          if (timelineSelect) timelineSelect.value = 'all';
          renderCategoryTabs();
          applyFilters();
        });
      }
      return;
    }

    grid.innerHTML = projects.map((p) => renderCard(p)).join('');

    // Attach card toggle listeners
    grid.querySelectorAll('.p-details-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const deepContent = document.getElementById(targetId);
        if (!deepContent) return;

        const isOpen = deepContent.classList.contains('open');
        if (isOpen) {
          deepContent.classList.remove('open');
          btn.innerHTML = 'Развернуть детали (Стек, Цены, Плейбук продаж) ↓';
          btn.setAttribute('aria-expanded', 'false');
        } else {
          deepContent.classList.add('open');
          btn.innerHTML = 'Свернуть детали ↑';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Attach copy pitch buttons
    grid.querySelectorAll('.btn-copy-pitch').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pitchText = btn.getAttribute('data-pitch');
        navigator.clipboard.writeText(pitchText).then(() => {
          const original = btn.innerText;
          btn.innerText = 'Скопировано!';
          btn.style.color = '#16a34a';
          setTimeout(() => {
            btn.innerText = original;
            btn.style.color = '';
          }, 2000);
        }).catch(() => {
          alert('Не удалось скопировать в буфер обмена.');
        });
      });
    });
  }

  function renderCard(p) {
    const deepId = `deep-${p.id}`;

    // Math links
    const mathLinks = [];
    if (p.math_foundation && p.math_foundation.work_ids) {
      p.math_foundation.work_ids.forEach((wid) => {
        mathLinks.push(`<a class="math-link" href="human.html#work-${escapeHtml(wid)}" title="Объяснение на пальцах в Атласе">📖 Рукопись ${escapeHtml(wid)} →</a>`);
      });
    }
    if (p.math_foundation && p.math_foundation.group_ids) {
      p.math_foundation.group_ids.forEach((gid) => {
        mathLinks.push(`<a class="math-link" href="index.html#group-${escapeHtml(gid)}" title="Каталог группы">📚 Группа ${escapeHtml(gid)} →</a>`);
      });
    }

    // Pricing tiers
    let pricingHtml = '';
    if (p.monetization && p.monetization.pricing_tiers) {
      const tiers = Object.entries(p.monetization.pricing_tiers);
      pricingHtml = `
        <div class="pricing-tiers">
          ${tiers.map(([tierName, desc]) => `
            <div class="tier-card">
              <strong>${escapeHtml(tierName)}</strong>
              <p>${escapeHtml(desc)}</p>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Features list
    const featuresList = (p.product_features || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('');

    // Stack
    const stack = p.mvp_stack || {};

    const pitchSummary = `${p.title} (${p.category}): ${p.tagline}\nДля кого: ${p.target_audience}\nБоль: ${p.market_pain}\nСрок MVP: ${p.dev_timeline_weeks} нед.`;

    return `
      <article class="p-card" id="${escapeHtml(p.id)}">
        <div class="p-card-top">
          <div class="p-badges">
            <span class="p-id-tag">${escapeHtml(p.id)}</span>
            <span class="p-cat-tag">${escapeHtml(p.category)}</span>
          </div>
          <span class="p-timeline-badge">⚡ MVP: ${escapeHtml(p.dev_timeline_weeks)} нед.</span>
        </div>

        <h3>${escapeHtml(p.title)}</h3>
        <p class="p-tagline">${escapeHtml(p.tagline)}</p>

        <div class="p-audience">
          <div><strong>👤 Кто платит:</strong> ${escapeHtml(p.target_audience)}</div>
        </div>

        <div class="p-block">
          <div class="p-block-title p-pain-title">🔴 Проблема рынка</div>
          <p>${escapeHtml(p.market_pain)}</p>
        </div>

        <div class="p-block">
          <div class="p-block-title p-sauce-title">💡 Математический ров (Secret Sauce)</div>
          <div class="p-sauce-box">
            <p>${escapeHtml(p.secret_sauce)}</p>
          </div>
        </div>

        <div class="p-block">
          <div class="p-block-title p-features-title">📦 Ключевой функционал MVP</div>
          <ul class="p-features-list">
            ${featuresList}
          </ul>
        </div>

        <div class="p-deep-dive">
          <button type="button" class="p-details-toggle" data-target="${deepId}" aria-expanded="false">
            Развернуть детали (Стек, Цены, Плейбук продаж) ↓
          </button>

          <div class="p-deep-content" id="${deepId}">
            <div class="deep-section">
              <h4>🛠 Технический стек реализации MVP</h4>
              <div class="stack-grid">
                <div class="stack-item"><strong>Backend</strong>${escapeHtml(stack.backend || '—')}</div>
                <div class="stack-item"><strong>Frontend</strong>${escapeHtml(stack.frontend || '—')}</div>
                <div class="stack-item"><strong>Math Core</strong>${escapeHtml(stack.math_core || '—')}</div>
                <div class="stack-item"><strong>Deployment</strong>${escapeHtml(stack.deployment || '—')}</div>
              </div>
            </div>

            <div class="deep-section">
              <h4>💰 Монетизация: ${escapeHtml(p.monetization ? p.monetization.model : '')}</h4>
              ${pricingHtml}
            </div>

            <div class="deep-section">
              <h4>🎯 Стратегия и плейбук первых продаж</h4>
              <div class="playbook-steps">
                ${escapeHtml(p.first_sales_playbook || '')}
              </div>
            </div>

            <div class="deep-section">
              <h4>📐 Теоретический базис OpenAI Math</h4>
              <p style="font-size:0.88rem;line-height:1.5;margin:0 0 10px;">
                ${escapeHtml(p.math_foundation ? p.math_foundation.core_theorem : '')}
              </p>
              <div class="math-refs">
                ${mathLinks.join('')}
              </div>
            </div>

            <div style="margin-top:14px;display:flex;justify-content:flex-end;">
              <button type="button" class="button secondary btn-copy-pitch" data-pitch="${escapeHtml(pitchSummary)}" style="font-size:0.8rem;min-height:36px;padding:6px 12px;">
                📋 Копировать питч проекта
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function checkHashAnchor() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    // Check if card matches hash
    const targetCard = document.getElementById(hash);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetCard.style.outline = '3px solid var(--teal)';
      targetCard.style.outlineOffset = '4px';

      // Automatically open details
      const deepContent = targetCard.querySelector('.p-deep-content');
      const toggleBtn = targetCard.querySelector('.p-details-toggle');
      if (deepContent && !deepContent.classList.contains('open')) {
        deepContent.classList.add('open');
        if (toggleBtn) {
          toggleBtn.innerHTML = 'Свернуть детали ↑';
          toggleBtn.setAttribute('aria-expanded', 'true');
        }
      }
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
