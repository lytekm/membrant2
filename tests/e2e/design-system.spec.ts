import { expect, test } from '@playwright/test';
import { demoState } from '@membrant/core';

test('web surfaces and goal planning share the notebook language in both themes', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const theme of ['dark', 'light']) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    if ((await page.locator('html').getAttribute('data-theme')) !== theme) {
      await page.getByRole('button', { name: 'Toggle color theme' }).click();
    }
    for (const [path, title] of [
      ['/goals', 'My goals'],
      ['/progress', 'Progress'],
      ['/reflections', 'Reflections'],
      ['/templates', 'Templates'],
      ['/settings', 'Settings'],
    ]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await page.screenshot({
          path: testInfo.outputPath(`${title}-${theme}-${width}.png`),
          fullPage: true,
        });
      }
    }
    await page.goto('/goals');
    await page.getByRole('button', { name: 'Create a goal', exact: true }).click();
    await expect(page.getByRole('dialog').getByLabel('My goal', { exact: true })).toBeVisible();
    await page.getByRole('dialog').getByText('Area of life and goal type').click();
    await expect(
      page.getByRole('dialog').getByLabel('Area of life', { exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`wizard-${theme}.png`), fullPage: true });
    await page.keyboard.press('Escape');
    await page
      .locator('.goal-card')
      .first()
      .getByRole('button', { name: 'Read 300 pages', exact: true })
      .click();
    await expect(
      page.getByRole('dialog').getByText('Why it matters', { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`goal-detail-${theme}.png`),
      fullPage: true,
    });
    await page.getByRole('dialog').getByRole('button', { name: 'Check in', exact: true }).click();
    await expect(page.getByLabel('A quick reflection (optional)', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`check-in-${theme}.png`), fullPage: true });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});

test('Expo shares past journal notes, persists appearance and reserves celebration for completion', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.setFixedTime(new Date(2026, 9, 28, 10));
  const state = demoState('2026-10-28');
  state.goals[0].target = 160; // The fixture has 150 pages; this check-in reaches a real target.
  await page.addInitScript((data) => {
    if (!localStorage.getItem('membrant.demo.v1'))
      localStorage.setItem('membrant.demo.v1', JSON.stringify(data));
  }, state);
  await page.goto('http://localhost:8083');
  await expect(page.getByText('Good morning, Alex.', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Make more space for curiosity and less space for scrolling.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('From your journal', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mobile-today-dark.png'), fullPage: true });
  await page.getByRole('button', { name: 'Another reflection', exact: true }).click();
  await page.getByRole('tab', { name: 'You', exact: true }).click();
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await page.reload();
  await page.getByRole('tab', { name: 'You', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Light', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('tab', { name: 'Today', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('mobile-today-light.png'), fullPage: true });
  await page
    .getByTestId('today-goal-demo_reading')
    .getByRole('button', { name: 'Check in', exact: true })
    .click();
  await page.getByLabel('How many pages did you add?').fill('10');
  await page.getByRole('button', { name: 'Save check-in', exact: true }).click();
  await expect(page.getByText('You reached your goal.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  for (const name of ['Goals', 'Journey', 'You']) {
    await page.getByRole('tab', { name, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: testInfo.outputPath(`mobile-${name}-light.png`),
      fullPage: true,
    });
  }
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  for (const name of ['Goals', 'Journey', 'You']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath(`mobile-${name}-dark.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});
