import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { mockAlgoliaSearch, test } from './utils';

test.describe('System Notes redesign', () => {
  test('loads the approved filing workspace without the rejected campaign hero', async ({
    page,
  }) => {
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
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('System Notes Index');
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

  test('matches the approved desktop filing composition', async ({ page }, testInfo) => {
    const isDesktop = testInfo.project.name === 'chromium';
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
      // The motto is display:none under 25rem, and a hidden span reports a
      // zero rect at the document origin, which would drag the min/max to 0.
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

  test('shows the highlights, then the whole archive on request', async ({ page }) => {
    await page.goto('/projects');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Exhibits');
    // Six highlights carry the page; the rest wait behind one control.
    await expect(page.getByTestId(/^project-/)).toHaveCount(6);
    await expect(page.getByText('Echo ESLint', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: /show all 20 exhibits/i }).click();

    await expect(page.getByTestId(/^project-/)).toHaveCount(20);
    await expect(page.getByText('Echo ESLint', { exact: true })).toBeVisible();
    await expect(page.getByText(/Showing everything/)).toBeVisible();
  });

  test('expands project evidence inline and links back to filtered notes', async ({ page }) => {
    await page.goto('/projects');
    // System Notes is not one of the six highlights, so the archive opens first.
    await page.getByRole('button', { name: /show all \d+ exhibits/i }).click();
    const project = page.getByTestId('project-system-notes');

    await project.getByRole('button', { name: 'read the argument' }).click();

    await expect(project.getByRole('heading', { name: "How it's built" })).toBeVisible();
    await expect(project.getByRole('heading', { name: 'Outcome' })).toBeVisible();
    await expect(
      project.getByRole('link', { name: /cards filed under this exhibit/i })
    ).toHaveAttribute('href', '/notes?project=System+Notes#notes-index');

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
    // System Notes is not one of the six highlights, so the archive opens first.
    await page.getByRole('button', { name: /show all \d+ exhibits/i }).click();
    const project = page.getByTestId('project-system-notes');

    await project.getByRole('button', { name: 'read the argument' }).click();
    await project.getByRole('link', { name: /cards filed under this exhibit/i }).click();

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
    await expect(page.getByAltText(/portrait of Ashley Childress/i)).toBeVisible();
    await expect(page.getByText('20', { exact: true })).toBeVisible();
    await expect(page.getByText('14', { exact: true })).toBeVisible();
    await expect(page.getByText('3', { exact: true })).toBeVisible();

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test('explains the theme song rather than leaving the header control unexplained', async ({
    page,
  }) => {
    await page.goto('/about');
    const section = page
      .locator('section')
      .filter({ hasText: 'Why there is a song in the header' });

    await expect(section.getByRole('heading', { level: 2 })).toHaveText(
      'Why there is a song in the header.'
    );
    await expect(section).toContainText('I Build Things');
    await expect(section).toContainText('Twisted Game Songs');
    // The two claims the note actually makes: where the instinct comes from,
    // and that the song is not only a metaphor.
    await expect(section).toContainText('Appalachian ingenuity');
    await expect(section).toContainText('The song is just fun');
    await expect(section).toContainText('hunting failure points');
    await expect(section.locator('p')).not.toHaveCount(0);
  });

  test('renders the designed 404 with a working skip-link target', async ({ page }) => {
    const response = await page.goto('/notes/not%20valid');

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
