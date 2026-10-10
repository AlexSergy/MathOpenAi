"""UI smoke tests with local HTML/CSS/JS injected into installed Chromium."""
import json
from pathlib import Path
import re
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]

# Load current counts dynamically
human_data = json.loads((root / "notes/human_explanations.json").read_text(encoding="utf-8"))
works_data = json.loads((root / "notes/work_explanations.json").read_text(encoding="utf-8")) if (root / "notes/work_explanations.json").exists() else {"works": {}}

total_groups_explained = len(human_data["entries"])
total_works_explained = len(works_data.get("works", {}))

def content(name):
    text = (root / name).read_text(encoding="utf-8")
    scripts = re.findall(r'<script src="([^"]+)" defer></script>', text)
    text = re.sub(r'<script src="([^"]+)" defer></script>', '', text)
    text = text.replace('</body>', ''.join('<script>' + (root / s).read_text(encoding="utf-8") + '</script>' for s in scripts) + '</body>')
    return re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: '<style>' + (root / m[1]).read_text(encoding="utf-8") + '</style>', text)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    # 1. Test index.html
    page.set_content(content('index.html'))
    assert page.locator('.catalog-card').count() == total_groups_explained
    assert 'Вопрос.' in page.locator('.catalog-card').first.inner_text()
    page.locator('#search').fill('355/113')
    assert page.locator('.catalog-card').count() == 1
    page.locator('#reset-filters').click()
    assert page.locator('.catalog-card').count() == 24
    assert '372' in page.locator('#catalog-count').inner_text()

    # 2. Test human.html (Works mode by default)
    page.set_content(content('human.html'))
    expected_first_page_works = min(24, total_works_explained)
    assert page.locator('.work-card').count() == expected_first_page_works, f"Expected {expected_first_page_works} work cards, got {page.locator('.work-card').count()}"
    assert 'Индивидуальных разборов рукописей:' in page.locator('#human-count').inner_text()

    # Search in works mode
    page.locator('#human-search').fill('Сельмер')
    assert page.locator('.work-card').count() >= 3

    # Clear search
    page.locator('#human-search').fill('')
    if total_works_explained > 24:
        page.locator('#human-next').click()
        expected_p2 = min(24, total_works_explained - 24)
        assert page.locator('.work-card').count() == expected_p2
        page.locator('#human-prev').click()
        assert page.locator('.work-card').count() == 24

    # 3. Test human.html (Groups mode tab)
    page.locator('#tab-groups').click()
    assert page.locator('.group-card').count() == total_groups_explained
    assert 'Вводных разборов семейств:' in page.locator('#human-count').inner_text()

    page.locator('#human-topic').select_option('Физические модели')
    assert page.locator('.group-card').count() == 2
    page.locator('#human-topic').select_option('all')

    page.locator('#human-search').fill('355/113')
    assert page.locator('.group-card').count() == 1
    page.locator('#human-search').fill('')

    # Mobile viewport test
    page.set_viewport_size({'width': 390, 'height': 844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    assert not errors, f"Page errors: {errors}"
    browser.close()

for name in ['index.html', 'human.html']:
    for href in re.findall(r'(?:href|src)="([^"]+)"', (root / name).read_text(encoding="utf-8")):
        if href.startswith(('http', '#', '?')):
            continue
        assert (root / href.split('#')[0].split('?')[0]).exists(), href

print(f'PASS: {total_works_explained} works tested, {total_groups_explained} groups tested, dual-mode tabs, pagination, search, topic filter, mobile width, JS errors, static links.')
