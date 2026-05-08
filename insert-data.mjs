import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gexvwdxatkwsjjdfhcqo.supabase.co',
  'sb_publishable_tyZyvK77e4wLrs6iwYYTlQ_k2huivmO'
);

const seniors = [
  { name: '김영수', region: '서울', desired_job: '경비', career_years: 10 },
  { name: '박미경', region: '경기', desired_job: '청소', career_years: 5 },
  { name: '이정호', region: '서울', desired_job: '조리', career_years: 15 },
  { name: '최순자', region: '인천', desired_job: '돌봄', career_years: 8 },
  { name: '정대현', region: '서울', desired_job: '경비', career_years: 3 },
  { name: '강옥분', region: '경기', desired_job: '돌봄', career_years: 12 },
  { name: '윤기석', region: '서울', desired_job: '조리', career_years: 7 },
  { name: '장미자', region: '인천', desired_job: '청소', career_years: 4 },
  { name: '오상훈', region: '기타', desired_job: '기타', career_years: 20 },
  { name: '임복순', region: '서울특별시', desired_job: '경비직', career_years: 6 },
];

const jobs = [
  { title: '아파트 경비원 A동',     region: '서울',       job_type: '경비', required_career_years: 5 },
  { title: '오피스 미화 주간반',     region: '경기',       job_type: '청소', required_career_years: 2 },
  { title: '어린이집 조리사',        region: '서울',       job_type: '조리', required_career_years: 10 },
  { title: '방문 요양보호사 서구',   region: '인천',       job_type: '돌봄', required_career_years: 5 },
  { title: '상가 야간 경비원',       region: '서울',       job_type: '경비', required_career_years: 3 },
  { title: '주간 돌봄 보조',         region: '경기',       job_type: '돌봄', required_career_years: 4 },
  { title: '단체급식 보조 조리',     region: '서울',       job_type: '조리', required_career_years: 3 },
  { title: '호텔 객실 미화',         region: '인천',       job_type: '청소', required_career_years: 2 },
  { title: '공원 환경 관리',         region: '서울',       job_type: '기타', required_career_years: 1 },
  { title: '동주민센터 안내 도우미', region: '경기',       job_type: '기타', required_career_years: 0 },
  { title: '학교 경비원',            region: '서울특별시', job_type: '경비', required_career_years: 2 },
  { title: '병원 청소',              region: '인천',       job_type: '청소', required_career_years: 3 },
  { title: '주간 조리 보조',         region: '서울',       job_type: '조리', required_career_years: 5 },
  { title: '방문 돌봄 도우미',       region: '경기',       job_type: '돌봄', required_career_years: 6 },
  { title: '주차 관리원',            region: '서울',       job_type: '경비', required_career_years: 1 },
];

// seniors INSERT
const { data: insertedSeniors, error: sErr } = await supabase.from('seniors').insert(seniors).select('id, name');
if (sErr) { console.error('seniors 오류:', sErr.message); process.exit(1); }
console.log(`seniors ${insertedSeniors.length}건 삽입:`, insertedSeniors.map(s => `[${s.id}]${s.name}`).join(', '));

// jobs INSERT
const { data: insertedJobs, error: jErr } = await supabase.from('jobs').insert(jobs).select('id, title');
if (jErr) { console.error('jobs 오류:', jErr.message); process.exit(1); }
console.log(`jobs ${insertedJobs.length}건 삽입:`, insertedJobs.map(j => `[${j.id}]${j.title}`).join(', '));

// matches 재계산 — 신규 senior × 전체 job
const { data: allJobs } = await supabase.from('jobs').select('*');
const matchRows = [];
for (const s of insertedSeniors) {
  const { data: senior } = await supabase.from('seniors').select('*').eq('id', s.id).single();
  for (const job of allJobs) {
    const regionScore   = senior.region === job.region ? 3 : 0;
    const jobScore      = senior.desired_job === job.job_type ? 2 : 0;
    const careerScore   = (job.required_career_years === null ||
      (senior.career_years !== null && senior.career_years >= job.required_career_years)) ? 1 : 0;
    matchRows.push({ senior_id: s.id, job_id: job.id, score: regionScore + jobScore + careerScore, status: 'pending' });
  }
}
// 신규 job × 전체 senior도 재계산
const { data: allSeniors } = await supabase.from('seniors').select('*');
for (const job of insertedJobs) {
  const fullJob = allJobs.find(j => j.id === job.id);
  for (const senior of allSeniors) {
    if (insertedSeniors.find(s => s.id === senior.id)) continue; // 이미 위에서 처리
    const regionScore = senior.region === fullJob.region ? 3 : 0;
    const jobScore    = senior.desired_job === fullJob.job_type ? 2 : 0;
    const careerScore = (fullJob.required_career_years === null ||
      (senior.career_years !== null && senior.career_years >= fullJob.required_career_years)) ? 1 : 0;
    matchRows.push({ senior_id: senior.id, job_id: job.id, score: regionScore + jobScore + careerScore, status: 'pending' });
  }
}

const { error: mErr } = await supabase.from('matches').upsert(matchRows, { onConflict: 'senior_id,job_id' });
if (mErr) { console.error('matches 오류:', mErr.message); process.exit(1); }
console.log(`matches ${matchRows.length}건 upsert 완료`);

// 최종 건수
const [{ count: sc }, { count: jc }, { count: mc }] = await Promise.all([
  supabase.from('seniors').select('*', { count: 'exact', head: true }),
  supabase.from('jobs').select('*', { count: 'exact', head: true }),
  supabase.from('matches').select('*', { count: 'exact', head: true }),
]);
console.log(`\n=== 최종 레코드 수 ===`);
console.log(`seniors : ${sc}건`);
console.log(`jobs    : ${jc}건`);
console.log(`matches : ${mc}건`);
