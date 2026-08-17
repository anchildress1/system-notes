import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import sharp from 'sharp';
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
    await page.goto('/');

    await expect(page).toHaveTitle("Index | Ashley's System Notes");
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('System Notes Index');
    await expect(page.getByRole('region', { name: /Browse notes by type/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Browse by type/i })).toHaveAttribute(
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
      ...Array.from({ length: 95 }, (_, index) => ({
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
    await page.goto('/');
    await page.getByRole('article').waitFor();
    await page.evaluate(() => document.fonts.ready);

    if (!isDesktop) {
      const layout = await page.evaluate(() => {
        const sidebar = document.querySelector<HTMLElement>('[aria-label="Browse notes by type"]');
        const search = document
          .querySelector<HTMLInputElement>('[aria-label="Search the notes index"]')
          ?.closest<HTMLElement>('div');
        if (!sidebar || !search) return null;
        return {
          sidebarBottom: sidebar.getBoundingClientRect().bottom,
          searchTop: search.getBoundingClientRect().top,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        };
      });
      expect(layout).not.toBeNull();
      expect(layout!.searchTop).toBeGreaterThanOrEqual(layout!.sidebarBottom);
      expect(layout!.scrollWidth).toBe(layout!.clientWidth);
      return;
    }

    const actual = await page.screenshot({ animations: 'disabled' });
    const [actualImage, referenceImage] = await Promise.all([
      sharp(actual).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
      sharp('public/projects/system-notes.webp')
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true }),
    ]);
    expect(actualImage.info).toMatchObject({ width: 1440, height: 720, channels: 3 });
    expect(referenceImage.info).toMatchObject({ width: 1440, height: 720, channels: 3 });

    let changedPixels = 0;
    for (let index = 0; index < actualImage.data.length; index += 3) {
      const difference = Math.max(
        Math.abs(actualImage.data[index]! - referenceImage.data[index]!),
        Math.abs(actualImage.data[index + 1]! - referenceImage.data[index + 1]!),
        Math.abs(actualImage.data[index + 2]! - referenceImage.data[index + 2]!)
      );
      if (difference > 32) changedPixels += 1;
    }
    expect(changedPixels / (1440 * 720)).toBeLessThan(0.05);
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

  test('lists all projects in one directory, including Echo ESLint', async ({ page }) => {
    await page.goto('/projects');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('What shipped.');
    await expect(page.getByText('Echo ESLint', { exact: true })).toBeVisible();
    await expect(page.getByTestId(/^project-/)).toHaveCount(20);
    await expect(page.getByRole('heading', { name: 'Current' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ended' })).toBeVisible();
  });

  test('expands project evidence inline and links back to filtered notes', async ({ page }) => {
    await page.goto('/projects');
    const project = page.getByTestId('project-system-notes');

    await project.locator('summary').click();

    await expect(
      project.getByRole('heading', { name: /evidence-first engineering portfolio/i })
    ).toBeVisible();
    await expect(project.getByText(/Algolia-backed decision index/i)).toBeVisible();
    await expect(
      project.getByRole('link', { name: /Search this project in the index/i })
    ).toHaveAttribute('href', '/?project=System+Notes#notes-index');

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
    const project = page.getByTestId('project-system-notes');
    await project.locator('summary').click();

    await project.getByRole('link', { name: /Search this project in the index/i }).click();

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
  });
});
