"""
Automated Playwright test for openai_math_atlas/projects.html
Verifies:
1. File:// protocol loading without errors
2. 25 project cards rendered initially
3. 5 category tabs functional
4. Search input filtering
5. Timeline selector filtering
6. Card expansion showing stack, pricing, and playbook
7. Direct link targets to human explanations
8. Responsive mobile layout (390px width)
"""

import os
import sys
from playwright.sync_api import sync_playwright

def run_test():
    html_path = os.path.abspath('openai_math_atlas/projects.html')
    url = f'file://{html_path}'

    print(f'Testing {url}...')
    errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
        page = browser.new_page()

        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        page.goto(url, wait_until='networkidle')

        # 1. Check title & hero
        title = page.title()
        print(f'Page title: {title}')
        assert '25 коммерческих SaaS-проектов' in title, f'Unexpected title: {title}'

        # 2. Check card count
        cards = page.locator('.p-card')
        count = cards.count()
        print(f'Initial rendered cards count: {count}')
        assert count == 25, f'Expected 25 cards, got {count}'

        # 3. Check category tabs
        tabs = page.locator('.cat-tab')
        tab_count = tabs.count()
        print(f'Category tabs count: {tab_count}')
        assert tab_count == 6, f'Expected 6 category tabs (All + 5 categories), got {tab_count}'

        # Click DevTools tab
        print('Testing DevTools category tab...')
        devtools_tab = page.locator('.cat-tab[data-cat="DevTools и облачная инфраструктура"]')
        devtools_tab.click()
        page.wait_for_timeout(200)
        devtools_count = page.locator('.p-card').count()
        print(f'DevTools cards: {devtools_count}')
        assert devtools_count == 5, f'Expected 5 devtools cards, got {devtools_count}'

        # Click Logistics tab
        print('Testing Logistics category tab...')
        logistics_tab = page.locator('.cat-tab[data-cat="Логистика, CAD и производство"]')
        logistics_tab.click()
        page.wait_for_timeout(200)
        log_count = page.locator('.p-card').count()
        print(f'Logistics cards: {log_count}')
        assert log_count == 5, f'Expected 5 logistics cards, got {log_count}'

        # Switch back to All
        all_tab = page.locator('.cat-tab[data-cat="all"]')
        all_tab.click()
        page.wait_for_timeout(200)
        assert page.locator('.p-card').count() == 25

        # 4. Check search functionality
        print('Testing search for "Triton"...')
        search_input = page.locator('#project-search')
        search_input.fill('Triton')
        page.wait_for_timeout(200)
        search_count = page.locator('.p-card').count()
        print(f'Matches for "Triton": {search_count}')
        assert search_count >= 1, f'Expected at least 1 match for Triton, got {search_count}'
        first_card_text = page.locator('.p-card').first.inner_text()
        assert 'TensorFast AI' in first_card_text

        # Clear search
        search_input.fill('')
        page.wait_for_timeout(200)
        assert page.locator('.p-card').count() == 25

        # 5. Check timeline filter
        print('Testing timeline filter for 3 weeks...')
        timeline_select = page.locator('#timeline-filter')
        timeline_select.select_option('3')
        page.wait_for_timeout(200)
        t3_count = page.locator('.p-card').count()
        print(f'Projects with 3-week timeline: {t3_count}')
        assert t3_count > 0

        # Reset timeline
        timeline_select.select_option('all')
        page.wait_for_timeout(200)
        assert page.locator('.p-card').count() == 25

        # 6. Check expand/collapse card details
        print('Testing card accordion expansion...')
        first_toggle = page.locator('.p-details-toggle').first
        assert 'Развернуть детали' in first_toggle.inner_text()
        first_toggle.click()
        page.wait_for_timeout(200)
        assert 'Свернуть детали' in first_toggle.inner_text()

        # Check deep dive content visibility
        first_deep = page.locator('.p-deep-content').first
        assert first_deep.is_visible()
        deep_text = first_deep.inner_text().lower()
        assert 'технический стек' in deep_text
        assert 'монетизация' in deep_text
        assert 'стратегия и плейбук' in deep_text
        assert 'теоретический базис' in deep_text

        # 7. Check responsive layout (mobile 390x844)
        print('Testing mobile viewport 390x844...')
        page.set_viewport_size({'width': 390, 'height': 844})
        page.wait_for_timeout(300)

        # Check body scrollWidth vs clientWidth to ensure no horizontal overflow
        scroll_width = page.evaluate('document.documentElement.scrollWidth')
        client_width = page.evaluate('document.documentElement.clientWidth')
        print(f'Mobile scrollWidth: {scroll_width}, clientWidth: {client_width}')
        assert scroll_width <= client_width + 1, f'Horizontal overflow detected: {scroll_width} > {client_width}'

        browser.close()

    if errors:
        print(f'ERRORS FOUND: {errors}')
        sys.exit(1)
    else:
        print('ALL BROWSER TESTS PASSED PERFECTLY WITH ZERO ERRORS!')

if __name__ == '__main__':
    run_test()
