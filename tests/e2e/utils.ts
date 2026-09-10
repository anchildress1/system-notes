import { expect, test as base, type Locator, type Page } from '@playwright/test';

export type MockAlgoliaHit = {
  objectID: string;
  title: string;
  blurb?: string;
  fact?: string;
  content?: string;
  category?: string;
  projects?: string[];
  'tags.lvl0'?: string[];
  'tags.lvl1'?: string[];
  url?: string;
  created_at?: string;
  __position?: number;
};

const ALGOLIA_SEARCH_ROUTE = /\/1\/indexes\/[^/]+\/queries(?:\?|$)/;

/* Insights is a SEPARATE host from search — https://insights.algolia.io/1/events —
   so narrowing the search route to /queries left it outside the fake boundary.
   IndexWorkspace.selectNote calls sendEvent on every selection, which made a
   note click reach the real provider from an E2E run and left the one event the
   architecture requires unverified. Matched on the path so the Agent Studio
   route, which is neither of these, stays untouched. */
const ALGOLIA_INSIGHTS_ROUTE = /\/1\/events(?:\?|$)/;

async function positionAboutScene(target: Locator, viewportRatio: number) {
  const reachedRatio = await target.evaluate(async (element, ratio) => {
    const source = element.closest('[data-about-scene]');
    if (!source) throw new Error('An About motion target needs a stationary scene');
    const documentTop = source.getBoundingClientRect().top + scrollY;
    const maximumScroll = document.documentElement.scrollHeight - innerHeight;
    const requestedScroll = documentTop - innerHeight * ratio;
    const reachableScroll = Math.max(0, Math.min(maximumScroll, requestedScroll));
    window.scrollTo(0, reachableScroll);
    // Scroll dispatch, its queued fallback update, and native timeline sampling
    // may occupy different frames in the three browser engines.
    for (let frame = 0; frame < 3; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    return (documentTop - reachableScroll) / innerHeight;
  }, viewportRatio);
  await expect
    .poll(() =>
      target.evaluate(
        (element) =>
          element.closest('[data-about-scene]')!.getBoundingClientRect().top / innerHeight
      )
    )
    .toBeCloseTo(reachedRatio, 2);
}

async function readAboutScene(motion: Locator) {
  return motion.evaluate((target) => {
    const source = target.closest('[data-about-scene]');
    if (!source) throw new Error('An About motion target needs a stationary scene');
    const reading = source.closest('[data-about-reading]') ?? source;
    const body = [...reading.querySelectorAll('p, dt, h2, a > span')].find(
      (element) => !element.closest('[data-about-motion]')
    );
    if (!body) throw new Error('An About scene needs motion and stationary reading copy');
    const style = getComputedStyle(target);
    const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform);
    const bounds = source.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    const counter = source.querySelector('dd[data-about-motion]');
    const stroke = counter?.querySelector('[data-about-motion]');

    return {
      from: style.getPropertyValue('--motion-from').trim(),
      start: Number.parseFloat(style.getPropertyValue('--motion-start')),
      end: Number.parseFloat(style.getPropertyValue('--motion-end')),
      matrix: [...matrix.toFloat64Array()],
      progress: target.getAnimations()[0]?.effect?.getComputedTiming().progress ?? null,
      sourceRatio: bounds.top / innerHeight,
      bodyOffset: body.getBoundingClientRect().top - bounds.top,
      sourceTransform: getComputedStyle(source).transform,
      bodyTransform: getComputedStyle(body).transform,
      width: targetBounds.width,
      isReceiptCount: target === counter,
      isReceiptStroke: target === stroke,
      isAward: target.closest('a') !== null,
      strokeProgress: stroke?.getAnimations()[0]?.effect?.getComputedTiming().progress ?? null,
      counterProgress: counter?.getAnimations()[0]?.effect?.getComputedTiming().progress ?? null,
      fill: style.backgroundImage,
      opaqueFill: style.getPropertyValue('--stroke-swipe-inked').trim(),
      mask: style.maskImage,
      opacity: style.opacity,
      fullyInViewport:
        targetBounds.top >=
          (document.querySelector('body > header')?.getBoundingClientRect().bottom ?? 0) &&
        targetBounds.bottom <= innerHeight &&
        targetBounds.left >= 0 &&
        targetBounds.right <= innerWidth,
      inViewport:
        targetBounds.top < innerHeight &&
        targetBounds.bottom > 0 &&
        targetBounds.left >= 0 &&
        targetBounds.right <= innerWidth,
    };
  });
}

async function expectAboutSceneProgress(target: Locator) {
  await expect
    .poll(async () => {
      const { progress, start, end, sourceRatio } = await readAboutScene(target);
      // Engines round scroll positions, so the requested fraction may be unreachable.
      const expected = Math.min(1, Math.max(0, (start - sourceRatio) / (start - end)));
      return progress === null ? Number.NaN : progress - expected;
    })
    .toBeCloseTo(0, 2);
}

async function expectAboutPortraitStatic(page: Page) {
  const portrait = page.locator('[data-about-tape]');
  await expect(portrait).toHaveCount(1);
  await expect
    .poll(() =>
      portrait.evaluate((element) =>
        ['before', 'after'].every((edge) => {
          const style = getComputedStyle(element, `::${edge}`);
          const matrix =
            style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform);
          return style.animationName === 'none' && matrix.isIdentity;
        })
      )
    )
    .toBe(true);
}

export async function expectAboutMotionSettled(page: Page) {
  const annotations = page.locator('[data-about-motion]');
  await expect(annotations).toHaveCount(15);
  await expect(page.getByRole('main')).not.toHaveAttribute('data-motion-fallback', 'true');
  await expect
    .poll(() =>
      annotations.evaluateAll((elements) =>
        elements.every((element) => {
          const transform = getComputedStyle(element).transform;
          const matrix = transform === 'none' ? new DOMMatrix() : new DOMMatrix(transform);
          return matrix.isIdentity && element.getAnimations().length === 0;
        })
      )
    )
    .toBe(true);
  await expectAboutPortraitStatic(page);
}

export async function verifyAboutMotion(page: Page) {
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/about');
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    await document.fonts.ready;
  });

  const scenes = page.locator('[data-about-scene]');
  const annotations = page.locator('[data-about-motion]');
  await expect(scenes).toHaveCount(12);
  await expect(annotations).toHaveCount(15);
  const sectionMotion = await page
    .getByRole('main')
    .locator(':scope > section')
    .evaluateAll((sections) =>
      sections.map((section) => ({
        heading: section.getAttribute('aria-labelledby'),
        targets: section.querySelectorAll('[data-about-motion], [data-about-tape]').length,
      }))
    );
  expect(sectionMotion).toEqual([
    { heading: 'about-heading', targets: 1 },
    { heading: 'principles-heading', targets: 4 },
    { heading: 'theme-song-heading', targets: 1 },
    { heading: 'proof-heading', targets: 9 },
    { heading: 'contact-heading', targets: 1 },
  ]);
  const native = await page.evaluate(() => CSS.supports('animation-timeline: view()'));
  if (native) {
    await expect(page.getByRole('main')).not.toHaveAttribute('data-motion-fallback', 'true');
  } else {
    await expect(page.getByRole('main')).toHaveAttribute('data-motion-fallback', 'true');
  }

  for (let index = 0; index < (await annotations.count()); index += 1) {
    const target = annotations.nth(index);
    const { start, end } = await readAboutScene(target);
    expect(start).toBeGreaterThan(end);
    const middleRatio = (start + end) / 2;
    await positionAboutScene(target, Math.min(1, start + 0.05));
    await expect.poll(async () => (await readAboutScene(target)).progress).toBeCloseTo(0, 2);
    const initial = await readAboutScene(target);

    await positionAboutScene(target, middleRatio);
    await expectAboutSceneProgress(target);
    const middle = await readAboutScene(target);
    expect(middle.matrix).not.toEqual(initial.matrix);
    expect(middle.fullyInViewport, `annotation ${index + 1} moves outside the reading window`).toBe(
      true
    );

    await positionAboutScene(target, Math.max(0, end - 0.05));
    await expect.poll(async () => (await readAboutScene(target)).progress).toBeCloseTo(1, 2);
    const completed = await readAboutScene(target);
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    completed.matrix.forEach((value, component) =>
      expect(value).toBeCloseTo(identity[component], 2)
    );
    expect(completed.matrix).not.toEqual(middle.matrix);

    await positionAboutScene(target, middleRatio);
    await expect
      .poll(async () => (await readAboutScene(target)).progress)
      .toBeCloseTo(middle.progress!, 2);
    const reversed = await readAboutScene(target);
    reversed.matrix.forEach((value, component) =>
      expect(value).toBeCloseTo(middle.matrix[component], 1)
    );
    for (const state of [initial, middle, completed, reversed]) {
      expect(state.sourceTransform).toBe('none');
      expect(state.bodyTransform).toBe('none');
      expect(state.bodyOffset).toBeCloseTo(initial.bodyOffset, 1);
      if (state.isAward) {
        expect(state.fill).not.toBe('none');
        expect(state.fill).toBe(state.opaqueFill);
        expect(state.fill).toBe(initial.fill);
        expect(state.mask).toBe('none');
        expect(state.opacity).toBe('1');
      }
    }
    if (initial.isReceiptCount) {
      expect(middle.strokeProgress, 'the count must enter before its underline grows').toBeCloseTo(
        0,
        2
      );
    }
    if (initial.isReceiptStroke) {
      expect(initial.matrix[0]).toBeCloseTo(0, 2);
      expect(middle.width).toBeGreaterThan(initial.width + 4);
      expect(completed.width).toBeGreaterThan(middle.width + 4);
      expect(reversed.width).toBeCloseTo(middle.width, 1);
      expect(middle.counterProgress, 'the underline must grow after its count settles').toBeCloseTo(
        1,
        2
      );
    }
  }

  for (const viewport of [
    { width: 1440, height: 700 },
    { width: 1097, height: 900 },
    { width: 881, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    for (const target of await annotations.all()) {
      const { start, end } = await readAboutScene(target);
      expect(start - end, 'motion needs enough scroll travel to be watched').toBeGreaterThan(0.2);
      await positionAboutScene(target, 0.9);
      await expect.poll(async () => (await readAboutScene(target)).progress).toBeCloseTo(0, 2);
      let previousMatrix: number[] | undefined;
      for (const progress of [0.25, 0.5, 0.75]) {
        await positionAboutScene(target, start - (start - end) * progress);
        await expectAboutSceneProgress(target);
        const state = await readAboutScene(target);
        if (previousMatrix) expect(state.matrix).not.toEqual(previousMatrix);
        previousMatrix = state.matrix;
        expect(state.inViewport, 'the gesture must unfold inside the visible window').toBe(true);
        if (progress === 0.5) {
          expect(state.fullyInViewport, 'the entire mark must be visible at its midpoint').toBe(
            true
          );
        }
      }
      await positionAboutScene(target, Math.max(0, end - 0.05));
      await expect
        .poll(async () => (await readAboutScene(target)).progress, {
          message: 'each gesture must finish within the available scroll distance',
        })
        .toBeCloseTo(1, 2);
    }
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expectAboutMotionSettled(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect
    .poll(() =>
      annotations.evaluateAll((elements) => elements.every((e) => e.getAnimations().length > 0))
    )
    .toBe(true);
  const lastRange = await readAboutScene(annotations.last());
  await positionAboutScene(annotations.last(), (lastRange.start + lastRange.end) / 2);
  await expect
    .poll(async () => (await readAboutScene(annotations.last())).progress)
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await readAboutScene(annotations.last())).progress)
    .toBeLessThan(1);

  await page.setViewportSize({ width: 881, height: 900 });
  const firstRange = await readAboutScene(annotations.first());
  const firstIntermediate = (firstRange.start + firstRange.end) / 2;
  await positionAboutScene(annotations.first(), firstIntermediate);
  await expect
    .poll(async () => (await readAboutScene(annotations.first())).progress)
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await readAboutScene(annotations.first())).progress)
    .toBeLessThan(1);
  await page.setViewportSize({ width: 880, height: 900 });
  await expectAboutMotionSettled(page);
  await page.setViewportSize({ width: 881, height: 900 });
  await positionAboutScene(annotations.first(), firstIntermediate);
  await expect
    .poll(async () => (await readAboutScene(annotations.first())).progress)
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await readAboutScene(annotations.first())).progress)
    .toBeLessThan(1);
}

export async function verifyAboutPortraitMotion(page: Page) {
  type TapeTrace = {
    events: Array<{ type: string; pseudo: string; at: number; elapsed: number; scroll: number }>;
    samples: Array<{
      pseudo: string;
      at: number;
      scroll: number;
      matrix: number[];
      projectedWidth: number;
      rotate: string;
      visible: boolean;
    }>;
  };
  type TapeWindow = typeof window & {
    aboutTapeTrace: TapeTrace;
  };

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // CSS can start before navigation resolves, so the recorder must precede the page.
  await page.addInitScript(() => {
    const trace: TapeTrace = { events: [], samples: [] };
    (window as TapeWindow).aboutTapeTrace = trace;
    let recording = false;
    const active = new Set<string>();

    const recordEvent = (event: AnimationEvent) => {
      const element = event.target;
      if (
        !(element instanceof HTMLElement) ||
        !element.matches('[data-about-tape]') ||
        !['::before', '::after'].includes(event.pseudoElement)
      )
        return;

      trace.events.push({
        type: event.type,
        pseudo: event.pseudoElement,
        at: performance.now(),
        elapsed: event.elapsedTime,
        scroll: scrollY,
      });
      if (event.type === 'animationstart') active.add(event.pseudoElement);
      else active.delete(event.pseudoElement);
      if (recording || event.type !== 'animationstart') return;
      recording = true;

      const sample = () => {
        const bounds = element.getBoundingClientRect();
        const headerBottom =
          document.querySelector('body > header')?.getBoundingClientRect().bottom ?? 0;
        for (const pseudo of ['::before', '::after']) {
          const style = getComputedStyle(element, pseudo);
          const matrix =
            style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform);
          const edge = pseudo === '::before' ? bounds.top : bounds.bottom;
          trace.samples.push({
            pseudo,
            at: performance.now(),
            scroll: scrollY,
            matrix: [...matrix.toFloat64Array()],
            projectedWidth: Number.parseFloat(style.width) * Math.abs(matrix.m11),
            rotate: style.rotate,
            visible: edge > Math.max(0, headerBottom) && edge < innerHeight,
          });
        }
        if (active.size) requestAnimationFrame(sample);
        else recording = false;
      };
      sample();
    };

    document.addEventListener('animationstart', recordEvent);
    document.addEventListener('animationend', recordEvent);
    document.addEventListener('animationcancel', recordEvent);
  });

  for (const viewport of [
    { width: 1097, height: 900 },
    { width: 881, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/about');
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
    });
    const portrait = page.locator('[data-about-tape]');
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as TapeWindow).aboutTapeTrace.events.filter(
              ({ type }) => type === 'animationend'
            ).length
        )
      )
      .toBe(2);

    const trace = await page.evaluate(() => (window as TapeWindow).aboutTapeTrace);
    const starts = trace.events.filter(({ type }) => type === 'animationstart');
    const ends = trace.events.filter(({ type }) => type === 'animationend');
    expect(starts.map(({ pseudo }) => pseudo)).toEqual(['::before', '::after']);
    expect(starts[1].at - starts[0].at, 'the tape strips need a visible stagger').toBeGreaterThan(
      150
    );
    expect(trace.events.every(({ scroll }) => scroll === 0)).toBe(true);
    expect(trace.samples.every(({ scroll }) => scroll === 0)).toBe(true);

    for (const start of starts) {
      const end = ends.find(({ pseudo }) => pseudo === start.pseudo)!;
      expect(end.elapsed - start.elapsed).toBeCloseTo(2, 1);
      expect(end.at - start.at, 'the press must unfold over real time').toBeGreaterThan(1800);
      expect(end.at - start.at).toBeLessThan(3000);
      const samples = trace.samples.filter(({ pseudo }) => pseudo === start.pseudo);
      const initial = samples.find(({ at }) => at >= start.at)!;
      const middle = samples.find(({ at }) => at - start.at >= 900 && at - start.at <= 1200);
      expect(middle, `${start.pseudo} has no rendered midpoint`).toBeDefined();
      expect(initial.visible).toBe(true);
      expect(middle!.visible).toBe(true);
      expect(middle!.matrix).not.toEqual(initial.matrix);
      expect(middle!.matrix[0], 'the press must still be turning at its midpoint').toBeLessThan(
        0.99
      );
      expect(middle!.projectedWidth - initial.projectedWidth).toBeGreaterThan(4);
      expect(new Set(samples.map(({ rotate }) => rotate))).toEqual(new Set([initial.rotate]));
      expect(
        Number.parseFloat(initial.rotate),
        'flattening must retain the resting diagonal'
      ).not.toBe(0);
    }

    const readTape = () =>
      portrait.evaluate((element) =>
        ['::before', '::after'].map((pseudo) => {
          const style = getComputedStyle(element, pseudo);
          const matrix =
            style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform);
          return {
            pseudo,
            transform: style.transform,
            rotate: style.rotate,
            matrix: [...matrix.toFloat64Array()],
          };
        })
      );
    const eventCount = (eventType: string) =>
      page.evaluate(
        (type) =>
          (window as TapeWindow).aboutTapeTrace.events.filter((event) => event.type === type)
            .length,
        eventType
      );
    const settled = await readTape();
    expect(settled.every(({ matrix }) => matrix[0] === 1 && matrix[2] === 0)).toBe(true);
    const scrollTo = async (position: number) => {
      await page.evaluate(async (scroll) => {
        window.scrollTo(0, scroll);
        for (let frame = 0; frame < 3; frame += 1) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
      }, position);
    };
    const distances = await portrait.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const headerBottom = document.querySelector('body > header')!.getBoundingClientRect().bottom;
      return [bounds.top - headerBottom, bounds.bottom - headerBottom];
    });

    for (const [index, distance] of distances.entries()) {
      expect(distance, 'each tape edge must have visible travel above the header').toBeGreaterThan(
        40
      );
      const widths: number[] = [];
      for (const fraction of [0.25, 0.5, 0.75]) {
        await scrollTo(distance * fraction);
        const tape = (await readTape())[index];
        widths.push(tape.matrix[0]);
        expect(tape.rotate).toBe(settled[index].rotate);
        expect(
          await portrait.evaluate((element, edge) => {
            const bounds = element.getBoundingClientRect();
            const headerBottom = document
              .querySelector('body > header')!
              .getBoundingClientRect().bottom;
            return (edge === 0 ? bounds.top : bounds.bottom) > headerBottom;
          }, index)
        ).toBe(true);
      }
      expect(widths[0]).toBeGreaterThan(widths[1]);
      expect(widths[1]).toBeGreaterThan(widths[2]);
      expect(widths[1]).toBeLessThan(0.99);

      await scrollTo(distance * 0.5);
      const middle = (await readTape())[index];
      await scrollTo(distance + 20);
      const folded = (await readTape())[index];
      expect(folded.matrix[0]).toBeLessThan(middle.matrix[0]);
      await scrollTo(distance * 0.5);
      expect((await readTape())[index]).toEqual(middle);
      await scrollTo(0);
      expect(await readTape()).toEqual(settled);
    }

    await scrollTo(distances[1] + 100);
    expect((await readTape()).every(({ matrix }) => matrix[0] < 0.6)).toBe(true);
    await scrollTo(0);
    expect(await readTape()).toEqual(settled);
    expect(await eventCount('animationstart')).toBe(2);
    expect(await eventCount('animationend')).toBe(2);
    expect(await eventCount('animationcancel')).toBe(0);

    // Scrolling during the entrance must change its destination without a second timed replay.
    await page.reload();
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
    });
    await expect.poll(() => eventCount('animationstart')).toBe(2);
    expect(await eventCount('animationend')).toBe(0);
    await scrollTo(distances[1] * 0.5);
    await expect.poll(() => eventCount('animationend')).toBe(2);
    const handedOff = await readTape();
    const scrollMatrices = await portrait.evaluate((element) =>
      ['--tape-before-turn', '--tape-after-turn'].map((property) => [
        ...new DOMMatrix()
          .rotateAxisAngle(0, 1, 0, Number.parseFloat(element.style.getPropertyValue(property)))
          .toFloat64Array(),
      ])
    );
    handedOff.forEach(({ matrix }, index) => {
      matrix.forEach((value, component) =>
        expect(value).toBeCloseTo(scrollMatrices[index][component], 4)
      );
    });
    const scrollingEntrance = await page.evaluate(() => (window as TapeWindow).aboutTapeTrace);
    for (const end of scrollingEntrance.events.filter(({ type }) => type === 'animationend')) {
      const late = scrollingEntrance.samples.findLast(
        ({ pseudo, at }) => pseudo === end.pseudo && at >= end.at - 140 && at <= end.at - 50
      );
      expect(late, `${end.pseudo} needs a rendered sample before the handoff`).toBeDefined();
      const destination = handedOff.find(({ pseudo }) => pseudo === end.pseudo)!;
      late!.matrix.forEach((value, component) =>
        expect(
          Math.abs(value - destination.matrix[component]),
          'the last frames must approach the scroll pose without a jump'
        ).toBeLessThan(0.01)
      );
    }
    await scrollTo(distances[1] * 0.5);
    expect(await readTape()).toEqual(handedOff);
    await scrollTo(0);
    expect(await readTape()).toEqual(settled);
    expect(await eventCount('animationstart')).toBe(2);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expectAboutPortraitStatic(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
}

interface MockAlgoliaOptions {
  nbHits?: number;
  facets?: Record<string, Record<string, number>>;
  onRequest?: (params: URLSearchParams) => void;
}

function normalizeRequestParams(request: Record<string, unknown>): URLSearchParams {
  const legacyParams = request['params'];
  const params = new URLSearchParams(typeof legacyParams === 'string' ? legacyParams : '');

  for (const [key, value] of Object.entries(request)) {
    if (key === 'indexName' || key === 'params' || value === undefined) continue;
    params.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  return params;
}

function countFacets(hits: MockAlgoliaHit[]) {
  return {
    projects: hits.reduce<Record<string, number>>((counts, hit) => {
      for (const project of hit.projects ?? []) counts[project] = (counts[project] ?? 0) + 1;
      return counts;
    }, {}),
    category: hits.reduce<Record<string, number>>((counts, hit) => {
      if (hit.category) counts[hit.category] = (counts[hit.category] ?? 0) + 1;
      return counts;
    }, {}),
    'tags.lvl0': hits.reduce<Record<string, number>>((counts, hit) => {
      for (const tag of hit['tags.lvl0'] ?? []) counts[tag] = (counts[tag] ?? 0) + 1;
      return counts;
    }, {}),
  };
}

export async function mockAlgoliaSearch(
  page: Page,
  hits: MockAlgoliaHit[],
  options: MockAlgoliaOptions = {}
) {
  await page.unroute(ALGOLIA_SEARCH_ROUTE);
  await page.route(ALGOLIA_SEARCH_ROUTE, async (route) => {
    let requests: Array<Record<string, unknown>> = [{}];
    try {
      const payload = route.request().postDataJSON() as { requests?: unknown[] };
      if (Array.isArray(payload.requests) && payload.requests.length > 0) {
        requests = payload.requests.filter(
          (request): request is Record<string, unknown> =>
            Boolean(request) && typeof request === 'object'
        );
      }
    } catch {
      requests = [{}];
    }

    const results = requests.map((request) => {
      const params = normalizeRequestParams(request);
      options.onRequest?.(params);
      const requestedPage = Number(params.get('page') ?? '0');
      const resultPage =
        Number.isSafeInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
      const requestedHitsPerPage = Number(params.get('hitsPerPage') ?? '500');
      const hitsPerPage =
        Number.isSafeInteger(requestedHitsPerPage) && requestedHitsPerPage > 0
          ? requestedHitsPerPage
          : 500;
      const totalHits = options.nbHits ?? hits.length;
      const resultHits = hits.slice(
        resultPage * hitsPerPage,
        resultPage * hitsPerPage + hitsPerPage
      );
      const positionedHits = resultHits.map((hit, index) => ({
        ...hit,
        __position: hit.__position ?? resultPage * hitsPerPage + index + 1,
      }));

      return {
        hits: positionedHits,
        nbHits: totalHits,
        page: resultPage,
        nbPages: Math.ceil(totalHits / hitsPerPage),
        hitsPerPage,
        processingTimeMS: 1,
        exhaustiveNbHits: true,
        // Present on every real response, and what attributes a click back to
        // the search that produced it. Without one the event still sends, but
        // as an unattributed click, which is not the shape the site emits.
        queryID: 'mock-query-id',
        query: params.get('query') ?? '',
        params: params.toString(),
        index: 'system-notes',
        facets: options.facets ?? countFacets(positionedHits),
      };
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results }),
    });
  });
}

/** One entry of an Insights batch, as the client posts it. */
export type CapturedInsightsEvent = {
  eventType?: string;
  eventName?: string;
  index?: string;
  objectIDs?: string[];
  positions?: number[];
  queryID?: string;
};

/**
 * Intercepts the Insights endpoint and collects what the page tried to send.
 *
 * @param page The page to route.
 * @returns A live array, appended to as events arrive. Read it after the action
 *   that should have sent one.
 */
export async function mockAlgoliaInsights(page: Page): Promise<CapturedInsightsEvent[]> {
  const events: CapturedInsightsEvent[] = [];

  await page.unroute(ALGOLIA_INSIGHTS_ROUTE);
  await page.route(ALGOLIA_INSIGHTS_ROUTE, async (route) => {
    try {
      const payload = route.request().postDataJSON() as { events?: CapturedInsightsEvent[] };
      if (Array.isArray(payload?.events)) events.push(...payload.events);
    } catch {
      // A body that will not parse is still a request that must not leave the
      // machine; fulfilling it matters more than recording it.
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 200, message: 'OK' }),
    });
  });

  return events;
}

export const test = base.extend<{
  autoMockAlgolia: void;
  insightsEvents: CapturedInsightsEvent[];
}>({
  insightsEvents: [
    async ({ page }, use) => {
      await use(await mockAlgoliaInsights(page));
    },
    { scope: 'test' },
  ],
  autoMockAlgolia: [
    // Depends on insightsEvents so the stub is installed for EVERY spec, not
    // only the ones that assert on it — an unstubbed spec would reach the real
    // provider the first time anything is selected.
    async ({ page, insightsEvents }, use) => {
      void insightsEvents;
      await mockAlgoliaSearch(page, []);
      await use();
    },
    { auto: true },
  ],
});
