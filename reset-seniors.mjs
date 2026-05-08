import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gexvwdxatkwsjjdfhcqo.supabase.co',
  'sb_publishable_tyZyvK77e4wLrs6iwYYTlQ_k2huivmO'
);

const newSeniors = [
  { name: '김영수', phone: '010-1234-1253', region: '서울', desired_job: '경비',   career_years: 10 },
  { name: '박미경', phone: '010-4567-2354', region: '경기', desired_job: '청소',   career_years: 5  },
  { name: '이정호', phone: '010-3242-9485', region: '서울', desired_job: '조리',   career_years: 15 },
  { name: '최순자', phone: '010-0983-9342', region: '인천', desired_job: '돌봄',   career_years: 8  },
  { name: '정대현', phone: '010-3267-9434', region: '서울', desired_job: '경비',   career_years: 3  },
  { name: '강옥분', phone: '010-3214-6483', region: '경기', desired_job: '돌봄',   career_years: 12 },
  { name: '윤기석', phone: '010-7814-7783', region: '서울', desired_job: '조리',   career_years: 7  },
  { name: '장미자', phone: '010-3276-7832', region: '인천', desired_job: '청소',   career_years: 4  },
  { name: '오상훈', phone: '010-6539-9834', region: '기타', desired_job: '기타',   career_years: 20 },
  { name: '임복순', phone: '010-4983-1298', region: '서울', desired_job: '경비직', career_years: 6  },
];

// 1) 기존 seniors 전체 삭제 (matches는 CASCADE로 자동 삭제)
console.log('=== 기존 seniors 삭제 중 ===');
const { error: delErr } = await supabase.from('seniors').delete().neq('id', 0);
if (delErr) { console.error('삭제 오류:', delErr.message); process.exit(1); }
console.log('seniors 삭제 완료 (matches 자동 cascade 삭제)');

// 2) 새 seniors INSERT
console.log('\n=== 신규 seniors INSERT 중 ===');
const { data: inserted, error: insErr } = await supabase
  .from('seniors')
  .insert(newSeniors)
  .select('id, name, phone');
if (insErr) { console.error('INSERT 오류:', insErr.message); process.exit(1); }
console.log(`${inserted.length}건 삽입:`, inserted.map(s => `[${s.id}] ${s.name} ${s.phone}`).join(', '));

// 3) matches 재계산 — 전체 seniors × 전체 jobs
console.log('\n=== matches 재계산 중 ===');
const { data: allSeniors } = await supabase.from('seniors').select('*');
const { data: allJobs }    = await supabase.from('jobs').select('*');

const matchRows = [];
for (const s of allSeniors) {
  for (const job of allJobs) {
    const regionScore  = s.region === job.region ? 3 : 0;
    const jobScore     = s.desired_job === job.job_type ? 2 : 0;
    const careerScore  = (job.required_career_years === null ||
      (s.career_years !== null && s.career_years >= job.required_career_years)) ? 1 : 0;
    matchRows.push({
      senior_id: s.id,
      job_id: job.id,
      score: regionScore + jobScore + careerScore,
      status: 'pending',
    });
  }
}

const { error: mErr } = await supabase
  .from('matches')
  .upsert(matchRows, { onConflict: 'senior_id,job_id' });
if (mErr) { console.error('matches 오류:', mErr.message); process.exit(1); }
console.log(`matches ${matchRows.length}건 upsert 완료`);

// 4) 최종 레코드 수
const [{ count: sc }, { count: jc }, { count: mc }] = await Promise.all([
  supabase.from('seniors').select('*', { count: 'exact', head: true }),
  supabase.from('jobs').select('*',    { count: 'exact', head: true }),
  supabase.from('matches').select('*', { count: 'exact', head: true }),
]);
console.log('\n=== 최종 레코드 수 ===');
console.log(`seniors : ${sc}건`);
console.log(`jobs    : ${jc}건`);
console.log(`matches : ${mc}건`);
