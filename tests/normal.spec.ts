import { test, expect } from '@playwright/test';
import { resetDb, insertJob } from './helpers/db';

test.beforeEach(async () => {
  await resetDb();
  // 서울/경비/경력3년 공고 1건 — 시니어(서울/경비/5년)와 완전 매칭 → 6점
  await insertJob({
    title: '서울경비공고',
    region: '서울',
    job_type: '경비',
    required_career_years: 3,
  });
});

test('시니어 등록 후 성공 알림과 6점 금색 배지 카드 최상단 노출', async ({ page }) => {
  await page.goto('/register');

  await page.fill('#name', '테스트시니어');

  await page.locator('#region').click();
  await page.getByRole('option', { name: '서울' }).click();

  await page.locator('#desired_job').click();
  await page.getByRole('option', { name: '경비' }).click();

  await page.fill('#career_years', '5');

  await page.click('button[type="submit"]');

  // 성공 알림 녹색 박스 확인
  await expect(
    page.getByText('등록이 완료되었습니다', { exact: false })
  ).toBeVisible({ timeout: 15_000 });

  // 추천 링크에서 senior_id 추출
  const link = page.locator('a[href*="/recommendations?senior_id="]');
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  const seniorId = href?.match(/senior_id=(\d+)/)?.[1];
  expect(seniorId).toBeTruthy();

  // 추천 페이지 이동
  await page.goto(`/recommendations?senior_id=${seniorId}`);

  // 점수 = 지역(+3) + 직종(+2) + 경력(+1) = 6점 → amber 배지
  const scoreBadge = page.locator('[class*="amber"]').first();
  await expect(scoreBadge).toBeVisible({ timeout: 15_000 });
  await expect(scoreBadge).toContainText('6점');
});
