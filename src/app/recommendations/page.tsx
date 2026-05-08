"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase, type Senior } from "@/lib/supabase";

const TOP_N = 5;

type MatchWithJob = {
  id: number;
  score: number;
  status: string;
  jobs: {
    title: string;
    region: string;
    job_type: string;
    required_career_years: number | null;
  } | null;
};

function scoreBadge(score: number) {
  if (score >= 6) return "bg-amber-100 text-amber-700 border border-amber-300";
  if (score >= 4) return "bg-green-100 text-green-700 border border-green-300";
  if (score >= 2) return "bg-gray-100 text-gray-600 border border-gray-300";
  return "bg-gray-50 text-gray-400 border border-gray-200";
}

function ScoreBreakdown({ senior, job }: { senior: Senior; job: MatchWithJob["jobs"] }) {
  if (!job) return null;
  const regionMatch = senior.region === job.region;
  const jobMatch = senior.desired_job === job.job_type;
  const careerMatch =
    job.required_career_years === null ||
    (senior.career_years !== null && senior.career_years >= job.required_career_years);

  return (
    <div className="flex flex-wrap gap-3 mt-2">
      <span className={`text-sm px-2 py-0.5 rounded ${regionMatch ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
        지역 {regionMatch ? "+3 ✓" : "+0"}
      </span>
      <span className={`text-sm px-2 py-0.5 rounded ${jobMatch ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
        직종 {jobMatch ? "+2 ✓" : "+0"}
      </span>
      <span className={`text-sm px-2 py-0.5 rounded ${careerMatch ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
        경력 {careerMatch ? "+1 ✓" : "+0"}
      </span>
    </div>
  );
}

function SeniorPicker() {
  const router = useRouter();
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("seniors")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setSeniors((data as Senior[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-2xl text-gray-400 text-center py-20">불러오는 중…</p>;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2 text-gray-900">추천 일자리 목록</h1>
      <p className="text-xl text-gray-500 mb-8">추천을 확인할 시니어를 선택해 주세요.</p>
      <div className="flex flex-col gap-3">
        {seniors.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(`/recommendations?senior_id=${s.id}`)}
            className="text-left border-2 border-gray-100 hover:border-blue-300 rounded-xl px-6 py-4 transition-colors bg-white shadow-sm"
          >
            <span className="text-xl font-bold text-gray-900">{s.name}</span>
            <span className="ml-3 text-lg text-gray-500">
              {s.region} · {s.desired_job} · 경력 {s.career_years ?? 0}년
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecommendationsContent() {
  const params = useSearchParams();
  const rawId = params.get("senior_id");
  const seniorId = rawId && !Number.isNaN(Number(rawId)) ? Number(rawId) : null;

  const [senior, setSenior] = useState<Senior | null>(null);
  const [matches, setMatches] = useState<MatchWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setShowAll(false);
    if (!seniorId) { setLoading(false); return; }
    async function load() {
      const [{ data: s, error: sErr }, { data: m }] = await Promise.all([
        supabase.from("seniors").select("*").eq("id", seniorId!).single(),
        supabase
          .from("matches")
          .select("id, score, status, jobs(title, region, job_type, required_career_years)")
          .eq("senior_id", seniorId!)
          .gt("score", 0)
          .order("score", { ascending: false }),
      ]);
      if (sErr || !s) { setNotFound(true); }
      else { setSenior(s as Senior); }
      setMatches((m as unknown as MatchWithJob[]) ?? []);
      setLoading(false);
    }
    load();
  }, [seniorId]);

  if (!seniorId) return <SeniorPicker />;
  if (loading) return <p className="text-2xl text-gray-400 text-center py-20">불러오는 중…</p>;
  if (notFound) return (
    <Alert className="border-red-400 bg-red-50">
      <AlertDescription className="text-xl text-red-700">
        해당 시니어를 찾을 수 없습니다. (ID: {seniorId})
      </AlertDescription>
    </Alert>
  );

  const displayed = showAll ? matches : matches.slice(0, TOP_N);
  const hiddenCount = matches.length - TOP_N;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2 text-gray-900">추천 일자리 목록</h1>
      <p className="text-xl text-gray-500 mb-8">
        {senior && <span className="font-semibold text-gray-700">{senior.name}</span>}{" "}
        님의 맞춤 추천 — 매칭 점수 높은 순서로 표시됩니다.
      </p>

      {matches.length === 0 ? (
        <Alert className="border-gray-300 bg-gray-50">
          <AlertDescription className="text-xl text-gray-500">
            현재 매칭되는 일자리가 없습니다. 담당자가 일자리를 등록하면 자동으로 계산됩니다.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {displayed.map((m, i) => {
              const job = m.jobs;
              if (!job) return null;
              return (
                <Card
                  key={m.id}
                  className="shadow-sm border-2 border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-300 w-8 text-center">
                          {i + 1}
                        </span>
                        <CardTitle className="text-2xl">{job.title}</CardTitle>
                      </div>
                      <span className={`text-2xl font-bold px-4 py-1 rounded-full ${scoreBadge(m.score)}`}>
                        {m.score}점
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-11 flex flex-col gap-2">
                    <div className="flex gap-3 flex-wrap">
                      <Badge variant="secondary" className="text-lg px-3 py-1">{job.region}</Badge>
                      <Badge variant="outline" className="text-lg px-3 py-1">{job.job_type}</Badge>
                    </div>
                    {senior && <ScoreBreakdown senior={senior} job={job} />}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 더 보기 / 접기 */}
          {matches.length > TOP_N && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                className="h-12 px-8 text-lg text-gray-600 border-gray-300"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll
                  ? "▲ 접기"
                  : `▼ 낮은 점수 ${hiddenCount}건 더 보기`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={<p className="text-2xl text-gray-400 text-center py-20">불러오는 중…</p>}>
      <RecommendationsContent />
    </Suspense>
  );
}
