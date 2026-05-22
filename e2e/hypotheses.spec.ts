import { test, expect } from '@playwright/test';
import { installMocks } from './fixtures';

test.describe('Hypotheses — AI-generated view', () => {
  test('shows the generate button in idle state', async ({ page }) => {
    await installMocks(page);
    await page.goto('/hypotheses');
    await expect(page.getByRole('button', { name: 'Сгенерировать гипотезы' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Сгенерировать гипотезы' })).toBeEnabled();
    await expect(page.getByText(/Нажмите «Сгенерировать гипотезы»/)).toBeVisible();
  });

  test('after clicking generate, renders problems and solutions', async ({ page }) => {
    await installMocks(page);
    await page.goto('/hypotheses');

    await page.getByRole('button', { name: 'Сгенерировать гипотезы' }).click();

    // Problems section — the badge has indigo background
    await expect(page.locator('.bg-indigo-100', { hasText: 'P01' })).toBeVisible();
    await expect(page.getByText(/мобильный посетитель/)).toBeVisible();
    await expect(page.getByText(/форма оплаты не адаптирована/)).toBeVisible();

    // Solutions section with ICE score
    await expect(page.locator('.bg-violet-100', { hasText: 'S01' })).toBeVisible();
    await expect(page.getByText('378')).toBeVisible();
    await expect(page.getByText(/Готовность к новой форме/)).toBeVisible();
  });
});
