import { test, expect } from '@playwright/test';
import { resetDb, insertJob } from './helpers/db';

test.beforeEach(async () => {
  await resetDb();
  // 지역·직종 모두 기타, 요구경력 99년 → 서울/경비/3년 시니어와 점수 0점
  // (required_career_years=null 이면 +1이 붙으므로 반드시 null이 아닌 큰 값 사용)
  await insertJob({
    title: '기타기타공고',
    region: '기타',
    job_type: '기타',
    required_career_years: 99,
  });
});

test('매칭되는 공고 없을 때 안내 박스 표시', async ({ page }) => {
  await page.goto('/register');

  await page.fill('#name', '노매칭시니어');

  await page.locator('#region').click();
  await page.getByRole('option', { name: '서울' }).click();

  await page.locator('#desired_job').click();
  await page.getByRole('option', { name: '경비' }).click();

  await page.fill('#career_years', '3');

  await page.click('button[type="submit"]');

  // 등록 성공 대기
  await expect(
    page.getByText('등록이 완료되었습니다', { exact: false })
  ).toBeVisible({ timeout: 15_000 });

  // senior_id 추출
  const link = page.locator('a[href*="/recommendations?senior_id="]');
  const href = await link.getAttribute('href');
  const seniorId = href?.match(/senior_id=(\d+)/)?.[1];
  expect(seniorId).toBeTruthy();

  // 추천 페이지 이동
  await page.goto(`/recommendations?senior_id=${seniorId}`);

  // 매칭 없음 안내 박스 확인 (score=0 → gt("score",0) 필터에서 제외됨)
  await expect(
    page.getByText('현재 매칭되는 일자리가 없습니다', { exact: false })
  ).toBeVisible({ timeout: 15_000 });
});
