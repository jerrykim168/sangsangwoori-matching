import { supabase } from "./supabase";

export function computeScore(
  senior: { region: string; desired_job: string; career_years: number | null },
  job: { region: string; job_type: string; required_career_years: number | null }
): number {
  let score = 0;
  if (senior.region === job.region) score += 3;
  if (senior.desired_job === job.job_type) score += 2;
  if (
    job.required_career_years === null ||
    (senior.career_years !== null && senior.career_years >= job.required_career_years)
  ) {
    score += 1;
  }
  return score;
}

export async function recalculateForSenior(seniorId: number): Promise<void> {
  const { error } = await supabase.rpc("recalculate_matches_for_senior", {
    p_senior_id: seniorId,
  });
  if (!error) return;

  // 트리거 대신 앱 레이어에서 재계산
  const [{ data: senior }, { data: jobs }] = await Promise.all([
    supabase.from("seniors").select("*").eq("id", seniorId).single(),
    supabase.from("jobs").select("*"),
  ]);
  if (!senior || !jobs || jobs.length === 0) return;

  await supabase.from("matches").upsert(
    jobs.map((job) => ({
      senior_id: seniorId,
      job_id: job.id,
      score: computeScore(senior, job),
      status: "pending" as const,
    })),
    { onConflict: "senior_id,job_id" }
  );
}

export async function recalculateForJob(jobId: number): Promise<void> {
  const { error } = await supabase.rpc("recalculate_matches_for_job", {
    p_job_id: jobId,
  });
  if (!error) return;

  // 트리거 대신 앱 레이어에서 재계산
  const [{ data: job }, { data: seniors }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", jobId).single(),
    supabase.from("seniors").select("*"),
  ]);
  if (!job || !seniors || seniors.length === 0) return;

  await supabase.from("matches").upsert(
    seniors.map((senior) => ({
      senior_id: senior.id,
      job_id: jobId,
      score: computeScore(senior, job),
      status: "pending" as const,
    })),
    { onConflict: "senior_id,job_id" }
  );
}
