import { expect, test, type Page } from '@playwright/test';
import { demoState, emptyState, type AppState, type Entry } from '@membrant/core';

const date = '2026-10-28'; // Wednesday: exercises both sides of the calendar-week boundary.
const reflection = 'Leaving my phone in the kitchen helped me settle into the book.';
const earlierReflection = 'Ten minutes of reading was enough to change the pace of my Sunday.';

function entry(id: string, day: string, note = ''): Entry {
  return {
    id,
    goalId: 'demo_reading',
    date: day,
    value: 10,
    note,
    createdAt: `${day}T12:00:00.000Z`,
  };
}

function workspace() {
  const state = demoState(date);
  state.entries = [
    entry('sunday', '2026-10-25', earlierReflection),
    entry('monday-first', '2026-10-26', reflection),
    entry('monday-second', '2026-10-26'),
    entry('wednesday', date, 'This note is from today, not a past reflection.'),
  ];
  return state;
}

async function openWorkspace(page: Page, state = workspace()) {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 10));
  await page.addInitScript((data: AppState) => {
    if (!localStorage.getItem('membrant.demo.v1')) {
      localStorage.setItem('membrant.demo.v1', JSON.stringify(data));
    }
    localStorage.setItem('membrant.theme', 'light');
  }, state);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Good morning, Alex.' })).toBeVisible();
}

test('dashboard connects goal reasons, calendar-week check-ins and the existing goal workflows', async ({
  page,
}) => {
  await openWorkspace(page);
  const reading = page.getByRole('article', { name: 'Read 300 pages', exact: true });
  await expect(
    reading.getByText('Make more space for curiosity and less space for scrolling.'),
  ).toBeVisible();
  await expect(reading.locator('.goal-focus-count')).toHaveText('3 check-ins this week');
  await expect(reading.getByText('Monday, Oct 26: 2 check-ins', { exact: true })).toHaveCount(1);
  await expect(reading.getByText('Sunday, Nov 1: upcoming', { exact: true })).toHaveCount(1);
  await expect(reading.getByText('Checked in today', { exact: true })).toBeVisible();
  const movement = page.getByRole('article', { name: 'Find my movement rhythm', exact: true });
  await expect(movement.locator('.goal-focus-count')).toHaveText('0 check-ins this week');

  const quote = page.locator('.journal-memory blockquote');
  const originalQuote = await quote.innerText();
  await reading.getByRole('button', { name: 'Check in', exact: true }).click();
  await page.getByLabel('How many pages did you add?').fill('10');
  await page.getByLabel('A quick reflection').fill('A second session today.');
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(reading.locator('.goal-focus-count')).toHaveText('4 check-ins this week');
  await expect(quote).toHaveText(originalQuote);
  await page.reload();
  await expect(reading.locator('.goal-focus-count')).toHaveText('4 check-ins this week');

  await reading.getByRole('button', { name: 'Read 300 pages', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('A second session today.')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Create a goal', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('My goal', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('journal quotes are real past notes, can be changed, and remain stable during refreshes', async ({
  page,
}) => {
  await openWorkspace(page);
  const quote = page.locator('.journal-memory blockquote');
  const first = await quote.innerText();
  expect([`“${reflection}”`, `“${earlierReflection}”`]).toContain(first);
  await page.getByRole('button', { name: 'Another reflection' }).click();
  const second = await quote.innerText();
  expect(second).not.toBe(first);
  expect([`“${reflection}”`, `“${earlierReflection}”`]).toContain(second);

  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(quote).toHaveText(second);
  await page
    .locator('.journal-memory')
    .getByRole('button', { name: 'Read 300 pages', exact: true })
    .click();
  await expect(
    page.getByRole('dialog').getByText(second.slice(1, -1), { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();

  // A note removed in another tab must not linger in the journal excerpt.
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('membrant.demo.v1')!);
    state.entries = state.entries.filter((item: Entry) => item.date === '2026-10-28');
    state.revision++;
    localStorage.setItem('membrant.demo.v1', JSON.stringify(state));
    window.dispatchEvent(new Event('storage'));
  });
  await expect(quote).toHaveCount(0);
  await expect(page.getByText('A place for your own words.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Another reflection' })).toHaveCount(0);
});

test('empty workspaces and a single long reflection have usable states', async ({ page }) => {
  await openWorkspace(page, emptyState('Alex'));
  await expect(page.getByText('What would you like to make time for?')).toBeVisible();
  await expect(page.getByText('A place for your own words.')).toBeVisible();
  await page.getByRole('button', { name: 'Create a goal', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('My goal', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  const state = workspace();
  const longNote = `${'I found it easier to read when I made some quiet space after breakfast. '.repeat(8)}I want to remember this last sentence.`;
  state.entries = [
    entry('long-note', '2026-10-26', longNote),
    entry('blank-note', '2026-10-27', '   '),
  ];
  await page.evaluate(
    (data) => localStorage.setItem('membrant.demo.v1', JSON.stringify(data)),
    state,
  );
  await page.reload();
  const quote = page.locator('.journal-memory blockquote');
  await expect(quote).not.toContainText('I want to remember this last sentence.');
  await expect(page.getByRole('button', { name: 'Another reflection' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Read full reflection' }).click();
  await expect(quote).toContainText(longNote);
  await page.getByRole('button', { name: 'Show less' }).click();
  await expect(quote).not.toContainText('I want to remember this last sentence.');
});

test('dashboard is responsive in both themes and shares its palette with goal planning', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openWorkspace(page);
  for (const theme of ['light', 'dark']) {
    if ((await page.locator('html').getAttribute('data-theme')) !== theme) {
      await page.getByRole('button', { name: 'Toggle color theme' }).click();
    }
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.getByRole('button', { name: 'Create a goal', exact: true })).toBeVisible();
      if (width === 390 || width === 1440) {
        // Let only the short color transitions settle before capturing the theme.
        await page.waitForTimeout(200);
        await page.screenshot({
          path: testInfo.outputPath(`dashboard-${theme}-${width}.png`),
          fullPage: true,
        });
      }
    }
  }
  await expect(page.getByRole('button', { name: 'Create a goal', exact: true })).toHaveCSS(
    'background-color',
    'rgb(179, 212, 165)',
  );
  await page.getByRole('link', { name: 'All goals', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Create a goal', exact: true })).toHaveCSS(
    'background-color',
    'rgb(179, 212, 165)',
  );
  expect(errors).toEqual([]);
});
