"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

function scoreDetail(senior: Senior, job: MatchWithJob["jobs"]) {
  if (!job) return null;
  const regionMatch = senior.region === job.region;
  const jobMatch = senior.desired_job === job.job_type;
  const careerMatch =
    job.required_career_years === null ||
    (senior.career_years !== null && senior.career_years >= job.required_career_years);
  return { regionMatch, jobMatch, careerMatch };
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
      <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-gray-900">추천 일자리 목록</h1>
      <p className="text-base sm:text-xl text-gray-500 mb-8">추천을 확인할 시니어를 선택해 주세요.</p>
      <div className="flex flex-col gap-3">
        {seniors.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(`/recommendations?senior_id=${s.id}`)}
            className="text-left border-2 border-gray-100 hover:border-blue-300 rounded-xl px-6 py-4 transition-colors bg-white shadow-sm"
          >
            <span className="text-lg sm:text-xl font-bold text-gray-900">{s.name}</span>
            <span className="ml-3 text-base sm:text-lg text-gray-500">
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
      <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-gray-900">추천 일자리 목록</h1>
      <p className="text-base sm:text-xl text-gray-500 mb-8">
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
          {/* 시트형 테이블 */}
          <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-base font-semibold text-gray-500 w-12 text-center">순위</th>
                  <th className="px-4 py-3 text-base font-semibold text-gray-500">일자리명</th>
                  <th className="px-4 py-3 text-base font-semibold text-gray-500 w-24">지역</th>
                  <th className="px-4 py-3 text-base font-semibold text-gray-500 w-24">직종</th>
                  <th className="px-4 py-3 text-base font-semibold text-gray-500 w-24 text-center">매칭점수</th>
                  <th className="px-4 py-3 text-base font-semibold text-gray-500">점수내역</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((m, i) => {
                  const job = m.jobs;
                  if (!job) return null;
                  const detail = senior ? scoreDetail(senior, job) : null;
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                    >
                      {/* 순위 */}
                      <td className="px-4 py-4 text-xl font-bold text-gray-300 text-center">
                        {i + 1}
                      </td>

                      {/* 일자리명 */}
                      <td className="px-4 py-4 text-lg font-semibold text-gray-900">
                        {job.title}
                      </td>

                      {/* 지역 */}
                      <td className="px-4 py-4">
                        <Badge variant="secondary" className="text-base px-3 py-1">{job.region}</Badge>
                      </td>

                      {/* 직종 */}
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="text-base px-3 py-1">{job.job_type}</Badge>
                      </td>

                      {/* 매칭점수 */}
                      <td className="px-4 py-4 text-center">
                        <span className={`text-lg font-bold px-3 py-1 rounded-full ${scoreBadge(m.score)}`}>
                          {m.score}점
                        </span>
                      </td>

                      {/* 점수내역 */}
                      <td className="px-4 py-4">
                        {detail && (
                          <div className="flex flex-wrap gap-2">
                            <span className={`text-sm px-2 py-0.5 rounded ${detail.regionMatch ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
                              지역 {detail.regionMatch ? "+3 ✓" : "+0"}
                            </span>
                            <span className={`text-sm px-2 py-0.5 rounded ${detail.jobMatch ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
                              직종 {detail.jobMatch ? "+2 ✓" : "+0"}
                            </span>
                            <span className={`text-sm px-2 py-0.5 rounded ${detail.careerMatch ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
                              경력 {detail.careerMatch ? "+1 ✓" : "+0"}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
