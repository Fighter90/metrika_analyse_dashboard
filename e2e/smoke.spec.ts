import { test, expect } from '@playwright/test';
import { installMocks } from './fixtures';

/**
 * Cross-page navigation journey: the shell boots and every nav link reaches a page that renders.
 * Per-feature interaction depth (report, error states) lives in the focused
 * specs (report/filters/dashboard-pages). Backend is mocked via the shared
 * fixtures, so this is deterministic and needs no OAuth token.
 */
test('dashboard shell renders nav and every page is reachable', async ({ page }) => {
  await installMocks(page);
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Обзор' })).toBeVisible();
  await expect(page.getByLabel('Сегмент')).toBeVisible();
  await expect(page.getByText('Цель (платных билетов)')).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();

  for (const [name, marker] of [
    ['Трафик', 'Каналы — визиты'],
    ['Поведение', 'Страницы входа'],
    ['Воронка', 'Воронка конверсии'],
  ] as const) {
    await page.getByRole('link', { name }).click();
    await expect(page.getByText(marker).first()).toBeVisible();
  }

  await page.getByRole('link', { name: 'Отчёт' }).click();
  await expect(page.getByRole('button', { name: 'Сформировать срез данных' })).toBeVisible();

  await page.getByRole('link', { name: 'История' }).click();
  await expect(page.getByText(/Отчётов пока нет|Всего отчётов/)).toBeVisible();

  await page.getByRole('link', { name: 'Настройки' }).click();
  await expect(page.getByRole('heading', { name: 'Настройки' })).toBeVisible();
  await expect(page.getByText(/Обновить данные из Метрики/)).toBeVisible();
});
