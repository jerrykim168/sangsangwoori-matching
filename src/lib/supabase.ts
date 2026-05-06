import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Senior = {
  id: number;
  name: string;
  region: string;
  desired_job: string;
  career_years: number | null;
  created_at: string;
};

export type Job = {
  id: number;
  title: string;
  region: string;
  job_type: string;
  required_career_years: number | null;
  created_at: string;
};

export type Match = {
  id: number;
  senior_id: number;
  job_id: number;
  score: number;
  status: "pending" | "assigned" | "done";
  created_at: string;
  updated_at: string;
};
