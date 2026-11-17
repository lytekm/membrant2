import { expect, test, type Page } from '@playwright/test';

async function createCountGoal(page: Page, title: string) {
  await page
    .locator('.page-heading')
    .getByRole('button', { name: 'Create a goal', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('My goal', { exact: true }).fill(title);
  await dialog
    .getByLabel('Why does this matter to you?')
    .fill('Make room for focused reading every week.');
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await dialog.getByRole('button', { name: 'Build toward a number' }).click();
  await dialog.getByLabel('Target', { exact: true }).fill('30');
  await dialog.getByLabel('Unit', { exact: true }).fill('pages');
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await dialog.getByLabel('What might get in the way?').fill('Not enough time');
  await expect(dialog.getByText('Attach it to something familiar')).toBeVisible();
  await dialog.getByLabel('My smallest next step').fill('Read five pages after breakfast.');
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await expect(dialog.getByRole('heading', { name: title })).toBeVisible();
  await dialog.getByRole('button', { name: 'Start my goal' }).click();
  await expect(dialog).toHaveCount(0);
}

test('web demo: create, check in, reload, edit, pause, undo and delete a goal', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/goals');
  await expect(page.getByRole('heading', { name: 'My goals', exact: true })).toBeVisible();
  await createCountGoal(page, 'Read a little more intentionally');
  const card = page.locator('.goal-card').filter({ hasText: 'Read a little more intentionally' });
  await card.getByRole('button', { name: 'Check in', exact: true }).click();
  await page.getByLabel('How many pages did you add?').fill('10');
  await page.getByLabel('A quick reflection').fill('Breakfast is a reliable cue.');
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.getByRole('heading', { name: 'Check-in saved', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.reload();
  await expect(card.getByText('33%', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Read a little more intentionally' }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Breakfast is a reliable cue.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Edit plan' }).click();
  await dialog.getByLabel('My next small step').fill('Read ten pages after breakfast.');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog.getByText('Read ten pages after breakfast.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Check in', exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Resume', exact: true }).click();
  await dialog.getByRole('button', { name: /Undo check-in from/ }).click();
  await expect(dialog.getByText('Your first check-in will appear here.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Delete goal' }).click();
  await dialog.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(card).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('templates and weekly reflections are editable and persistent', async ({ page }) => {
  await page.goto('/templates');
  await page
    .locator('.template-card')
    .filter({ hasText: 'Bring an idea to life' })
    .getByRole('button', { name: 'Use template' })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('Why does this matter to you?')
    .fill('Build something that helps a friend.');
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await expect(dialog.getByLabel('Milestone 1', { exact: true })).toHaveValue(
    'Define the smallest useful version',
  );
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await dialog.getByRole('button', { name: 'Start my goal' }).click();
  await expect(dialog).toHaveCount(0);
  await page.goto('/reflections');
  await page.getByLabel('What went well?').fill('I made time to think about what matters.');
  await page.getByLabel('One thing I’ll try next week').fill('Start with a smaller next step.');
  await page.getByRole('button', { name: 'Save reflection' }).click();
  await expect(page.getByText('Reflection saved')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('What went well?')).toHaveValue(
    'I made time to think about what matters.',
  );
  await page.getByLabel('What went well?').fill('An updated win for the same week.');
  await page.getByRole('button', { name: 'Update reflection' }).click();
  await expect(page.locator('.review-grid article')).toHaveCount(1);
});

test('web and Expo companion share a real account and check-ins through the API', async ({
  page,
  browser,
}) => {
  const email = `sync-${Date.now()}@example.com`;
  const password = 'membrant-test-password';
  await page.goto('/settings');
  await page.getByLabel('Your name', { exact: true }).fill('Taylor');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByText('Connected', { exact: true })).toBeVisible();
  await page.goto('/goals');
  await createCountGoal(page, 'Read across my devices');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobile = await mobileContext.newPage();
  const errors: string[] = [];
  mobile.on('pageerror', (error) => errors.push(error.message));
  await mobile.goto('http://localhost:8083');
  await mobile.getByRole('tab', { name: 'You', exact: true }).click();
  await mobile.getByLabel('Email', { exact: true }).fill(email);
  await mobile.getByLabel('Password', { exact: true }).fill(password);
  await mobile.getByRole('button', { name: 'Sign in', exact: true }).last().click();
  await expect(mobile.getByText('Connected', { exact: true })).toBeVisible();
  await mobile.getByRole('tab', { name: 'Today', exact: true }).click();
  await expect(mobile.getByText('Read across my devices', { exact: true })).toBeVisible();
  await mobile.getByRole('button', { name: 'Check in', exact: true }).click();
  await mobile.getByLabel('How many pages did you add?').fill('15');
  await mobile.getByRole('button', { name: 'Save check-in', exact: true }).click();
  await expect(mobile.getByText('Check-in saved', { exact: true })).toBeVisible();
  await mobile.getByRole('button', { name: 'Done', exact: true }).click();
  await page.reload();
  const card = page.locator('.goal-card').filter({ hasText: 'Read across my devices' });
  await expect(card.getByText('50%', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  await mobileContext.close();
});

test('responsive layouts and light/dark themes render without page errors or horizontal overflow', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('membrant.theme', 'light'));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Alex\./ }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('overview-light.png'), fullPage: true });
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: testInfo.outputPath('overview-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Templates', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Templates', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('web-narrow.png'), fullPage: true });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Alex\./ }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('Expo demo supports native-style goal creation, checking in, and undo', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:8083');
  await expect(page.getByText('Your goals', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('expo-today.png'), fullPage: true });
  await page.getByRole('button', { name: 'Create a goal', exact: true }).click();
  await page.getByLabel('My goal', { exact: true }).fill('Take a short daily walk');
  await page
    .getByLabel('Why does this matter?', { exact: true })
    .fill('Get a little fresh air during work.');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page
    .getByLabel('My next small step', { exact: true })
    .fill('Walk around the block after lunch.');
  await page.getByRole('button', { name: 'Start my goal', exact: true }).click();
  await page.getByRole('tab', { name: 'Goals', exact: true }).click();
  await page.getByRole('button', { name: 'Open Take a short daily walk', exact: true }).click();
  await page.getByRole('button', { name: 'Check in', exact: true }).click();
  await page.getByRole('button', { name: 'Save check-in', exact: true }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Open Take a short daily walk', exact: true }).click();
  await page.getByRole('button', { name: 'Undo check-in', exact: true }).click();
  await expect(page.getByText('Your first check-in will appear here.')).toBeVisible();
});
