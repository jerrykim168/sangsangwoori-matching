import { test, expect } from '@playwright/test';
import { resetDb, countSeniors } from './helpers/db';

test.beforeEach(async () => {
  await resetDb();
});

test('이름 미입력 시 빨간 안내 박스 표시, seniors 테이블에 레코드 미삽입', async ({ page }) => {
  await page.goto('/register');

  // 이름 비움 — 지역·직종·경력만 입력
  await page.locator('#region').click();
  await page.getByRole('option', { name: '서울' }).click();

  await page.locator('#desired_job').click();
  await page.getByRole('option', { name: '경비' }).click();

  await page.fill('#career_years', '3');

  await page.click('button[type="submit"]');

  // 이름 필드 위 빨간 안내 박스 확인
  await expect(
    page.getByText('이름을 입력해 주세요.', { exact: false })
  ).toBeVisible();

  // DB에 새 레코드 미삽입 확인
  const count = await countSeniors();
  expect(count).toBe(0);
});
