import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { mockAlgoliaSearch, test } from './utils';

// The workspace stacks below IndexWorkspace.module.css's 47.99rem breakpoint and
// runs two columns above it. Branching on the project NAME instead pinned the
// desktop assertions to the one project called 'chromium', so every other
// desktop-width engine silently ran the stacked assertions and failed.
const STACK_BREAKPOINT_PX = 768;

test.describe('System Notes redesign', () => {
  test('loads the filing workspace under the page head', async ({ page }) => {
    await mockAlgoliaSearch(page, [
      {
        objectID: 'card:system-notes:1',
        title: 'A System Notes decision',
        blurb: 'Evidence attached.',
        fact: 'The complete decision.',
        category: 'Principle',
        projects: ['System Notes'],
        'tags.lvl0': ['Testing'],
      },
    ]);
    await page.goto('/notes');

    await expect(page).toHaveTitle("Index | Ashley's System Notes");
    // The index used to carry a visually-hidden h1 because heads were rejected on
    // every route. That decision was reversed: all four routes now open on the
    // same head, and this route's is the only one whose rhythm is retuned to sit
    // above a working tool. The 'Every choice' assertion below still stands — the
    // rejected thing was that campaign's copy, not the existence of a head.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('How I decide');
    await expect(page.getByRole('region', { name: /Browse notes by type/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Filed under/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expect(page.getByRole('searchbox', { name: 'Search the notes index' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Notes results' })).toContainText(
      'A System Notes decision'
    );
    await expect(page.getByRole('heading', { name: /Every choice/i })).toHaveCount(0);
  });

  test('matches the approved desktop filing composition', async ({ page }) => {
    const isDesktop = (page.viewportSize()?.width ?? 0) >= STACK_BREAKPOINT_PX;
    if (isDesktop) await page.setViewportSize({ width: 1440, height: 720 });
    const featuredHits = [
      {
        objectID: 'card:test:1',
        title: 'Save the Sun won Best Google AI Usage in the June Solstice Game Jam 2026',
        blurb: 'Recognized in the Best Google AI Usage category of the June Solstice Game Jam.',
        category: 'Awards',
        projects: ['Save the Sun'],
        'tags.lvl0': ['June Solstice Game Jam 2026', 'Gemini'],
        created_at: '2026-08-01',
      },
      {
        objectID: 'card:test:2',
        title: 'Unearthed won the 2026 Earth Day Weekend DEV Challenge',
        category: 'Awards',
        projects: ['Unearthed'],
        created_at: '2026-05-01',
      },
      {
        objectID: 'card:test:3',
        title: 'Carbon Trace was selected as a Frontend Art winner in WeCoded 2026',
        category: 'Awards',
        projects: ['Carbon Trace'],
        created_at: '2026-04-01',
      },
      {
        objectID: 'card:test:4',
        title: 'Every automated gate replaced a review I stopped doing by hand',
        category: 'Principle',
        projects: ['System Notes'],
        created_at: '2026-08-01',
      },
      {
        objectID: 'card:test:5',
        title:
          'I put a database between the AI and the search index so I could review before publishing',
        category: 'Architecture',
        projects: ['SupaScribe Notes MCP'],
        created_at: '2026-08-01',
      },
    ];
    const filingCategories = ['Principle', 'Architecture', 'Decision', 'Award'] as const;
    const rankedHits = [
      ...featuredHits,
      ...Array.from({ length: 342 }, (_, index) => ({
        objectID: `card:test:${index + 6}`,
        title: `Ranked system note ${index + 6}`,
        category: filingCategories[index % filingCategories.length],
        projects: ['System Notes'],
        created_at: '2026-08-01',
      })),
    ];
    await mockAlgoliaSearch(page, rankedHits, {
      nbHits: 347,
      facets: {
        category: {
          Principles: 118,
          Architecture: 28,
          Decisions: 174,
          Awards: 27,
        },
        projects: { 'System Notes': 347 },
        'tags.lvl0': { Testing: 347 },
      },
    });
    await page.goto('/notes');
    await page.getByRole('article').waitFor();
    await page.evaluate(() => document.fonts.ready);

    // Composition is asserted structurally, not by pixel-diffing the page
    // against public/projects/system-notes.webp. That file is the social card
    // artwork, not a baseline, and using it as one meant every intentional
    // layout change "failed" until the artwork was overwritten with a
    // screenshot — which is how the illustration came to be lost.
    const layout = await page.evaluate(() => {
      const sidebar = document.querySelector<HTMLElement>('[aria-label="Browse notes by type"]');
      const search = document
        .querySelector<HTMLInputElement>('[aria-label="Search the notes index"]')
        ?.closest<HTMLElement>('div');
      const board = document.querySelector<HTMLElement>('[data-note-board]');
      const reader = document.querySelector<HTMLElement>('article');
      if (!sidebar || !search || !board || !reader) return null;
      return {
        sidebarBottom: sidebar.getBoundingClientRect().bottom,
        sidebarRight: sidebar.getBoundingClientRect().right,
        searchTop: search.getBoundingClientRect().top,
        searchLeft: search.getBoundingClientRect().left,
        readerLeft: reader.getBoundingClientRect().left,
        boardWidth: board.getBoundingClientRect().width,
        sidebarWidth: sidebar.getBoundingClientRect().width,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      };
    });
    expect(layout).not.toBeNull();
    expect(layout!.scrollWidth).toBe(layout!.clientWidth);

    if (isDesktop) {
      // Two columns: the catalog sits beside the reading pane, not above it.
      expect(layout!.searchLeft).toBeGreaterThanOrEqual(layout!.sidebarRight);
      expect(layout!.readerLeft).toBeGreaterThanOrEqual(layout!.sidebarRight);
      // The board fills its column rather than overflowing it.
      expect(layout!.boardWidth).toBeLessThanOrEqual(layout!.sidebarWidth);
      return;
    }

    // Stacked: the catalog sits above the search.
    expect(layout!.searchTop).toBeGreaterThanOrEqual(layout!.sidebarBottom);
  });

  test('keeps the brand link tight around its own text', async ({ page }) => {
    await page.goto('/');
    // Two links in the header point at "/" — the brand and the intake nav item.
    const brand = page.getByRole('link', { name: /Ashley Childress/ });

    // A min-height taller than the text, with the spans baseline-aligned, put
    // every spare pixel below it — a band of invisible clickable nothing under
    // the name. The hit area must stay centred on the text it belongs to.
    const geometry = await brand.evaluate((node) => {
      const box = node.getBoundingClientRect();
      // Any span hidden at this width reports a zero rect at the document
      // origin, which would drag the min/max to 0.
      const spans = [...node.querySelectorAll('span')]
        .map((s) => s.getBoundingClientRect())
        .filter((r) => r.height > 0);
      const textTop = Math.min(...spans.map((r) => r.top));
      const textBottom = Math.max(...spans.map((r) => r.bottom));
      return {
        height: box.height,
        above: textTop - box.top,
        below: box.bottom - textBottom,
      };
    });

    expect(geometry.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(geometry.above - geometry.below)).toBeLessThanOrEqual(2);
  });

  test('renders the restrained footer on every surface', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('systems, software, and the proof behind both');
    await expect(footer.getByRole('link', { name: /GitHub/i })).toHaveAttribute(
      'href',
      'https://github.com/anchildress1'
    );
  });

  test('lists every system in the rail with no archive to open', async ({ page }) => {
    await page.goto('/projects');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('shipped');
    // The rail scrolls, so there is nothing left for a show-all control to do.
    await expect(page.getByTestId(/^project-/)).toHaveCount(20);
    await expect(page.getByRole('navigation', { name: 'Systems' })).toContainText('Echo ESLint');
    await expect(page.getByRole('button', { name: /show all/i })).toHaveCount(0);
  });

  test('opens a system in the detail pane and links back to filtered notes', async ({ page }) => {
    await page.goto('/projects');
    await page.getByTestId('project-system-notes').click();
    const detail = page.getByRole('article');

    await expect(detail.getByRole('heading', { level: 2 })).toHaveText('System Notes');
    await expect(detail.getByRole('heading', { name: 'Outcome' })).toBeVisible();
    await expect(detail.getByRole('heading', { name: 'Stack' })).toBeVisible();
    await expect(detail.getByRole('link', { name: /Decisions from System Notes/ })).toHaveAttribute(
      'href',
      '/notes?project=System+Notes#notes-index'
    );

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test('hydrates a project filter when following a project into the index', async ({ page }) => {
    const facetFilters: Array<string | null> = [];
    await mockAlgoliaSearch(
      page,
      [
        {
          objectID: 'card:system-notes:1',
          title: 'A System Notes decision',
          blurb: 'Evidence attached.',
          fact: 'The complete decision.',
          category: 'Principle',
          projects: ['System Notes'],
          'tags.lvl0': ['Testing'],
        },
      ],
      {
        onRequest: (params) => facetFilters.push(params.get('facetFilters')),
      }
    );
    await page.goto('/projects');
    await page.getByTestId('project-system-notes').click();

    await page
      .getByRole('article')
      .getByRole('link', { name: /Decisions from System Notes/ })
      .click();

    await expect(page).toHaveURL(/\/?\?project=System(?:\+|%20)Notes#notes-index$/);
    await page
      .locator('summary')
      .filter({ hasText: /^Project/ })
      .click();
    await expect(page.getByRole('checkbox', { name: 'System Notes' })).toBeChecked();
    await expect
      .poll(() => facetFilters.some((value) => value?.includes('projects:System Notes')))
      .toBe(true);
  });

  test('renders About as identity, method, and derived proof', async ({ page }) => {
    await page.goto('/about');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Forged between');
    // Both portraits ship so the theme can swap them without a fetch; exactly
    // one is ever displayed, and the other is display:none and so out of the
    // accessibility tree entirely.
    const portraits = page.getByAltText(/portrait of Ashley Childress/i);
    await expect(portraits).toHaveCount(2);
    await expect(portraits.locator('visible=true')).toHaveCount(1);
    await expect(page.getByText('20', { exact: true })).toBeVisible();
    await expect(page.getByText('14', { exact: true })).toBeVisible();
    await expect(page.getByText('3', { exact: true })).toBeVisible();

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test('plays the theme song under the writing that explains it', async ({ page }) => {
    await page.goto('/about');
    const section = page.locator('section').filter({ hasText: 'Theme song' });

    await expect(section.getByRole('heading', { level: 2 })).toContainText('I Build Things');
    // The control lives here now rather than in the header, beside the prose
    // that says why the track is on the site at all.
    await expect(section.getByRole('button', { name: /theme song/i })).toBeVisible();
    await expect(section).toContainText('I Build Things');
    await expect(section).toContainText('Twisted Game Songs');
    // The two claims the note actually makes: where the instinct comes from,
    // and what it turns into once it reaches the software.
    await expect(section).toContainText('Appalachian ingenuity');
    await expect(section).toContainText('hunting the failure first');
    await expect(section).toContainText('breaking it early');
    await expect(section.locator('p')).not.toHaveCount(0);
  });

  test('renders the designed 404 with a working skip-link target', async ({ page }) => {
    const response = await page.goto('/no-such-record');

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { name: /This trail ends without a note/i })
    ).toBeVisible();
    await expect(page.locator('main#main-content')).toHaveCount(1);

    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    // The 404 is a designed surface, not a fallback nobody looks at.
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });
});

test.describe('Deep links', () => {
  test('opens the system named in the url', async ({ page }) => {
    await page.goto('/projects?system=save-the-sun');

    await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(
      'Save the Sun'
    );
    await expect(page.getByTestId('project-save-the-sun')).toHaveAttribute('aria-current', 'true');
  });

  test('follows the selection so the open system is what a copied link reopens', async ({
    page,
  }) => {
    await page.goto('/projects');
    await page.getByTestId('project-vestige').click();

    await expect(page).toHaveURL(/\?system=vestige$/);
  });

  test('falls back to the first system when the url names one that does not exist', async ({
    page,
  }) => {
    await page.goto('/projects?system=not-a-real-system');

    // Rendering nothing, or an error, would make a stale link a broken page.
    await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toBeVisible();
  });

  test('does not reuse an old system after client-side navigation', async ({ page }) => {
    await page.goto('/projects?system=delegate-action');
    await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(
      'Delegate Action'
    );

    const nav = page.getByRole('navigation', { name: 'Primary navigation' });
    await nav.getByRole('link', { name: 'how I decide' }).click();
    await nav.getByRole('link', { name: 'what I’ve shipped' }).click();

    await expect(page).toHaveURL('/projects');
    await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(
      'Save the Sun'
    );
  });

  test('opens the exhibit behind each recorded win', async ({ page }) => {
    await page.goto('/about');
    const wins = page.getByRole('link', { name: /winner/i });
    await expect(wins.first()).toBeVisible();

    const targets = await wins.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href'))
    );
    // A win with nowhere to check it is the claim this section exists not to
    // make, so every record has to cite a system the directory actually holds.
    expect(targets.length).toBeGreaterThan(0);
    for (const href of targets) {
      expect(href).toMatch(/^\/projects\?system=[a-z0-9-]+$/);
    }

    const first = wins.first();
    const name = await first.textContent();
    await first.click();

    await expect(page).toHaveURL(targets[0]!);
    const exhibit = page.getByRole('article').getByRole('heading', { level: 2 });
    await expect(exhibit).toBeVisible();
    // The exhibit that opens is the one the win named, not the rail's default.
    expect(name).toContain((await exhibit.textContent())!.trim());
  });

  test('scrolls a deep-linked system into the visible rail', async ({ page }) => {
    await page.goto('/projects?system=delegate-action');
    const active = page.getByTestId('project-delegate-action');
    await expect(active).toHaveAttribute('aria-current', 'true');

    const geometry = await active.evaluate((item) => {
      const rail = item.closest('nav')!.getBoundingClientRect();
      const current = item.getBoundingClientRect();
      return {
        visibleHorizontally: current.left >= rail.left && current.right <= rail.right,
        visibleVertically: current.top >= rail.top && current.bottom <= rail.bottom,
      };
    });

    expect(geometry.visibleHorizontally).toBe(true);
    expect(geometry.visibleVertically).toBe(true);
  });
});
