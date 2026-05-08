import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gexvwdxatkwsjjdfhcqo.supabase.co',
  'sb_publishable_tyZyvK77e4wLrs6iwYYTlQ_k2huivmO'
);

export async function resetDb() {
  // FK 순서: matches → seniors, matches → jobs
  await supabase.from('matches').delete().gt('id', 0);
  await supabase.from('seniors').delete().gt('id', 0);
  await supabase.from('jobs').delete().gt('id', 0);
}

export async function insertJob(job: {
  title: string;
  region: string;
  job_type: string;
  required_career_years: number | null;
}) {
  const { data, error } = await supabase.from('jobs').insert(job).select().single();
  if (error) throw new Error(`insertJob 실패: ${error.message}`);
  return data;
}

export async function countSeniors(): Promise<number> {
  const { count } = await supabase
    .from('seniors')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}
