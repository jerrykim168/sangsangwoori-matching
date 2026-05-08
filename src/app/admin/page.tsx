"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase, type Job } from "@/lib/supabase";
import { recalculateForJob } from "@/lib/matching";

const REGIONS = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "기타"];
const JOB_TYPES = ["경비", "청소", "조리", "돌봄", "운전", "판매", "사무보조", "기타"];

type SeniorRow = {
  id: number;
  name: string;
  phone: string | null;
  region: string;
  desired_job: string;
  career_years: number | null;
  matches: Array<{ id: number; score: number; status: string }>;
};

type JobForm = {
  title: string;
  region: string;
  job_type: string;
  required_career_years: string;
};

type JobErrors = Partial<Record<keyof JobForm, string>>;

const INITIAL_JOB: JobForm = { title: "", region: "", job_type: "", required_career_years: "" };

function seniorStatus(matches: Array<{ score: number; status: string }>) {
  const hasAssigned = matches.some((r) => r.status === "assigned" || r.status === "done");
  if (hasAssigned) return "배정완료";
  const maxScore = matches.reduce((m, r) => Math.max(m, r.score), 0);
  if (maxScore > 0) return "매칭대기";
  return "미매칭";
}

function statusBadge(status: string) {
  if (status === "배정완료") return "bg-green-100 text-green-700";
  if (status === "매칭대기") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export default function AdminPage() {
  const [seniors, setSeniors] = useState<SeniorRow[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingSeniors, setLoadingSeniors] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // 새 일자리 등록 폼
  const [jobForm, setJobForm] = useState<JobForm>(INITIAL_JOB);
  const [jobErrors, setJobErrors] = useState<JobErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [jobSuccess, setJobSuccess] = useState(false);
  const [jobServerError, setJobServerError] = useState("");

  // 일자리 인라인 수정
  const [editJobId, setEditJobId] = useState<number | null>(null);
  const [editJobForm, setEditJobForm] = useState<JobForm>(INITIAL_JOB);
  const [savingJob, setSavingJob] = useState(false);

  // 삭제 확인 상태
  const [deleteJobConfirmId, setDeleteJobConfirmId] = useState<number | null>(null);
  const [deleteSeniorConfirmId, setDeleteSeniorConfirmId] = useState<number | null>(null);

  // 배정 완료 처리 중
  const [assigningSeniorId, setAssigningSeniorId] = useState<number | null>(null);

  async function fetchSeniors() {
    const { data } = await supabase
      .from("seniors")
      .select("id, name, phone, region, desired_job, career_years, matches(id, score, status)")
      .order("created_at", { ascending: false });
    setSeniors((data as SeniorRow[]) ?? []);
    setLoadingSeniors(false);
  }

  async function fetchJobs() {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    setJobs((data as Job[]) ?? []);
    setLoadingJobs(false);
  }

  useEffect(() => {
    fetchSeniors();
    fetchJobs();
  }, []);

  const stats = useMemo(() => {
    let unmatched = 0, pending = 0, assigned = 0;
    for (const s of seniors) {
      const st = seniorStatus(s.matches ?? []);
      if (st === "배정완료") assigned++;
      else if (st === "매칭대기") pending++;
      else unmatched++;
    }
    return { unmatched, pending, assigned };
  }, [seniors]);

  // ── 배정 완료 처리 ──
  async function handleAssignSenior(senior: SeniorRow) {
    setAssigningSeniorId(senior.id);
    const bestMatch = (senior.matches ?? [])
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)[0];
    if (bestMatch) {
      await supabase.from("matches").update({ status: "assigned" }).eq("id", bestMatch.id);
    }
    setAssigningSeniorId(null);
    fetchSeniors();
  }

  // ── 시니어 삭제 ──
  async function handleDeleteSenior(id: number) {
    await supabase.from("seniors").delete().eq("id", id);
    setSeniors((prev) => prev.filter((s) => s.id !== id));
    setDeleteSeniorConfirmId(null);
  }

  // ── 새 일자리 등록 ──
  function validateJob(): JobErrors {
    const e: JobErrors = {};
    if (!jobForm.title.trim()) e.title = "공고명을 입력해 주세요.";
    if (!jobForm.region) e.region = "지역을 선택해 주세요.";
    if (!jobForm.job_type) e.job_type = "직종을 선택해 주세요.";
    return e;
  }

  async function handleAddJob(e: React.FormEvent) {
    e.preventDefault();
    setJobSuccess(false);
    setJobServerError("");
    const errs = validateJob();
    if (Object.keys(errs).length > 0) { setJobErrors(errs); return; }
    setJobErrors({});
    setSubmitting(true);

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title: jobForm.title.trim(),
        region: jobForm.region,
        job_type: jobForm.job_type,
        required_career_years: jobForm.required_career_years !== ""
          ? Number(jobForm.required_career_years) : null,
      })
      .select()
      .single();

    if (error || !data) {
      setJobServerError("저장 중 오류가 발생했습니다: " + (error?.message ?? "알 수 없는 오류"));
      setSubmitting(false);
      return;
    }
    await recalculateForJob(data.id);
    setSubmitting(false);
    setJobSuccess(true);
    setJobForm(INITIAL_JOB);
    fetchJobs();
    fetchSeniors();
  }

  // ── 일자리 수정 ──
  function startEditJob(job: Job) {
    setEditJobId(job.id);
    setEditJobForm({
      title: job.title,
      region: job.region,
      job_type: job.job_type,
      required_career_years: job.required_career_years?.toString() ?? "",
    });
    setDeleteJobConfirmId(null);
  }

  async function handleSaveJob() {
    if (!editJobId) return;
    setSavingJob(true);
    await supabase
      .from("jobs")
      .update({
        title: editJobForm.title.trim(),
        region: editJobForm.region,
        job_type: editJobForm.job_type,
        required_career_years: editJobForm.required_career_years !== ""
          ? Number(editJobForm.required_career_years) : null,
      })
      .eq("id", editJobId);
    await recalculateForJob(editJobId);
    setSavingJob(false);
    setEditJobId(null);
    fetchJobs();
    fetchSeniors();
  }

  // ── 일자리 삭제 ──
  async function handleDeleteJob(id: number) {
    await supabase.from("jobs").delete().eq("id", id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setDeleteJobConfirmId(null);
    fetchSeniors();
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-gray-900">담당자 대시보드</h1>
      <p className="text-base sm:text-xl text-gray-500 mb-8">매칭 현황을 한눈에 확인하고 관리합니다.</p>

      {/* 집계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="border-2 bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">미매칭</CardTitle>
              <span className="text-3xl font-bold px-3 py-1 rounded-lg bg-red-100 text-red-700">
                {loadingSeniors ? "…" : stats.unmatched}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-lg">아직 일자리가 연결되지 않은 시니어</p>
          </CardContent>
        </Card>
        <Card className="border-2 bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">매칭 대기</CardTitle>
              <span className="text-3xl font-bold px-3 py-1 rounded-lg bg-yellow-100 text-yellow-700">
                {loadingSeniors ? "…" : stats.pending}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-lg">매칭 완료, 담당자 확인 대기 중</p>
          </CardContent>
        </Card>
        <Card className="border-2 bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">배정 완료</CardTitle>
              <span className="text-3xl font-bold px-3 py-1 rounded-lg bg-green-100 text-green-700">
                {loadingSeniors ? "…" : stats.assigned}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-lg">배정이 확정된 시니어·일자리 쌍</p>
          </CardContent>
        </Card>
      </div>

      {/* 시니어 목록 */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-3xl font-bold mb-4 border-b pb-3">
          시니어 목록{" "}
          <Badge className="text-base px-3 py-1 ml-2 bg-blue-100 text-blue-700">
            {seniors.length}명
          </Badge>
        </h2>

        {loadingSeniors ? (
          <p className="text-xl text-gray-400 text-center py-10">불러오는 중…</p>
        ) : seniors.length === 0 ? (
          <p className="text-xl text-gray-400 text-center py-10">등록된 시니어가 없습니다.</p>
        ) : (
          <>
            {/* 모바일: 카드형 */}
            <div className="flex flex-col gap-3 sm:hidden">
              {seniors.map((s) => {
                const maxScore = (s.matches ?? []).reduce((m, r) => Math.max(m, r.score), 0);
                const st = seniorStatus(s.matches ?? []);
                const isDeleteConfirm = deleteSeniorConfirmId === s.id;
                return (
                  <div key={s.id} className="border-2 border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900 text-base">{s.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(st)}`}>{st}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{s.phone ?? "—"}</p>
                    <p className="text-sm text-gray-600 mb-3">
                      {s.region} · {s.desired_job} · 경력 {s.career_years ?? 0}년
                      {" · "}<span className="font-bold text-blue-700">{maxScore}점</span>
                    </p>
                    {isDeleteConfirm ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600 font-semibold">삭제할까요?</span>
                        <Button size="sm" variant="destructive" className="h-8 px-3 text-sm" onClick={() => handleDeleteSenior(s.id)}>확인</Button>
                        <Button size="sm" variant="outline" className="h-8 px-3 text-sm" onClick={() => setDeleteSeniorConfirmId(null)}>취소</Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/recommendations?senior_id=${s.id}`}>
                          <Button variant="outline" size="sm" className="h-8 px-3 text-sm">상세보기</Button>
                        </Link>
                        {st === "매칭대기" && (
                          <Button size="sm" className="h-8 px-3 text-sm bg-green-600 hover:bg-green-700 text-white" disabled={assigningSeniorId === s.id} onClick={() => handleAssignSenior(s)}>
                            {assigningSeniorId === s.id ? "처리 중…" : "배정완료"}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 px-3 text-sm text-red-500 hover:bg-red-50" onClick={() => setDeleteSeniorConfirmId(s.id)}>삭제</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 데스크톱: 테이블 */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-lg">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-600">
                    <th className="text-left py-3 px-3">이름</th>
                    <th className="text-left py-3 px-3">연락처</th>
                    <th className="text-left py-3 px-3">지역</th>
                    <th className="text-left py-3 px-3">희망 직종</th>
                    <th className="text-left py-3 px-3">최고 점수</th>
                    <th className="text-left py-3 px-3">상태</th>
                    <th className="py-3 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {seniors.map((s) => {
                    const maxScore = (s.matches ?? []).reduce((m, r) => Math.max(m, r.score), 0);
                    const st = seniorStatus(s.matches ?? []);
                    const isDeleteConfirm = deleteSeniorConfirmId === s.id;
                    return (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-3 font-semibold">{s.name}</td>
                        <td className="py-4 px-3 text-gray-600">{s.phone ?? "—"}</td>
                        <td className="py-4 px-3">{s.region}</td>
                        <td className="py-4 px-3">{s.desired_job}</td>
                        <td className="py-4 px-3 font-bold text-blue-700">{maxScore}점</td>
                        <td className="py-4 px-3">
                          <span className={`text-base font-semibold px-3 py-1 rounded-full ${statusBadge(st)}`}>{st}</span>
                        </td>
                        <td className="py-4 px-3">
                          {isDeleteConfirm ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-red-600 font-semibold">삭제할까요?</span>
                              <Button size="sm" variant="destructive" className="h-8 px-3 text-sm" onClick={() => handleDeleteSenior(s.id)}>확인</Button>
                              <Button size="sm" variant="outline" className="h-8 px-3 text-sm" onClick={() => setDeleteSeniorConfirmId(null)}>취소</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <Link href={`/recommendations?senior_id=${s.id}`}>
                                <Button variant="outline" size="sm" className="text-base h-10 px-4">상세 보기</Button>
                              </Link>
                              {st === "매칭대기" && (
                                <Button size="sm" className="h-10 px-3 text-sm bg-green-600 hover:bg-green-700 text-white" disabled={assigningSeniorId === s.id} onClick={() => handleAssignSenior(s)}>
                                  {assigningSeniorId === s.id ? "처리 중…" : "배정 완료"}
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-10 px-3 text-sm text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteSeniorConfirmId(s.id)}>삭제</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* 일자리 관리 */}
      <section>
        <h2 className="text-xl sm:text-3xl font-bold mb-6 border-b pb-3">일자리 관리</h2>

        <Card className="shadow-md mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">새 일자리 등록</CardTitle>
          </CardHeader>
          <CardContent>
            {jobSuccess && (
              <Alert className="mb-4 border-green-500 bg-green-50 text-green-800">
                <AlertDescription className="text-lg font-semibold">
                  일자리가 등록되었습니다. 모든 시니어의 점수를 재계산했습니다 ✓
                </AlertDescription>
              </Alert>
            )}
            {jobServerError && (
              <Alert className="mb-4 border-red-500 bg-red-50 text-red-800">
                <AlertDescription className="text-base">{jobServerError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleAddJob} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <Label className="text-lg font-semibold text-gray-700">
                    공고명 <span className="text-red-500">*</span>
                  </Label>
                  {jobErrors.title && (
                    <Alert className="border-red-400 bg-red-50 py-2">
                      <AlertDescription className="text-sm text-red-700">{jobErrors.title}</AlertDescription>
                    </Alert>
                  )}
                  <Input
                    type="text"
                    placeholder="예: 아파트 경비원"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="h-12 text-lg border-2 border-gray-300"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-lg font-semibold text-gray-700">
                    지역 <span className="text-red-500">*</span>
                  </Label>
                  {jobErrors.region && (
                    <Alert className="border-red-400 bg-red-50 py-2">
                      <AlertDescription className="text-sm text-red-700">{jobErrors.region}</AlertDescription>
                    </Alert>
                  )}
                  <Select value={jobForm.region} onValueChange={(v) => setJobForm({ ...jobForm, region: v ?? "" })}>
                    <SelectTrigger className="h-12 text-lg border-2 border-gray-300">
                      <SelectValue placeholder="지역 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r} className="text-lg py-2">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-lg font-semibold text-gray-700">
                    직종 <span className="text-red-500">*</span>
                  </Label>
                  {jobErrors.job_type && (
                    <Alert className="border-red-400 bg-red-50 py-2">
                      <AlertDescription className="text-sm text-red-700">{jobErrors.job_type}</AlertDescription>
                    </Alert>
                  )}
                  <Select value={jobForm.job_type} onValueChange={(v) => setJobForm({ ...jobForm, job_type: v ?? "" })}>
                    <SelectTrigger className="h-12 text-lg border-2 border-gray-300">
                      <SelectValue placeholder="직종 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((j) => (
                        <SelectItem key={j} value={j} className="text-lg py-2">{j}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-lg font-semibold text-gray-700">
                    요구 경력 (년) <span className="text-gray-400 text-sm font-normal">선택</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    placeholder="예: 3"
                    value={jobForm.required_career_years}
                    onChange={(e) => setJobForm({ ...jobForm, required_career_years: e.target.value })}
                    className="h-12 text-lg border-2 border-gray-300"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="mt-6 h-14 px-10 text-xl font-bold bg-blue-700 hover:bg-blue-800 text-white"
              >
                {submitting ? "저장 및 매칭 계산 중…" : "일자리 등록"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 등록된 일자리 목록 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">
              등록된 일자리{" "}
              <Badge className="text-base px-3 py-1 ml-2 bg-blue-100 text-blue-700">
                {jobs.length}건
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingJobs ? (
              <p className="text-xl text-gray-400 text-center py-8">불러오는 중…</p>
            ) : jobs.length === 0 ? (
              <p className="text-xl text-gray-400 text-center py-8">등록된 일자리가 없습니다.</p>
            ) : (
              <>
                {/* 모바일: 카드형 */}
                <div className="flex flex-col gap-3 sm:hidden">
                  {jobs.map((job) => {
                    const isEditing = editJobId === job.id;
                    const isDeleteConfirm = deleteJobConfirmId === job.id;
                    if (isEditing) {
                      return (
                        <div key={job.id} className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50">
                          <div className="flex flex-col gap-2 mb-3">
                            <Input value={editJobForm.title} onChange={(e) => setEditJobForm({ ...editJobForm, title: e.target.value })} className="h-10 text-sm border-gray-300" placeholder="공고명" />
                            <div className="grid grid-cols-2 gap-2">
                              <Select value={editJobForm.region} onValueChange={(v) => setEditJobForm({ ...editJobForm, region: v ?? "" })}>
                                <SelectTrigger className="h-10 text-sm border-gray-300"><SelectValue placeholder="지역" /></SelectTrigger>
                                <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                              </Select>
                              <Select value={editJobForm.job_type} onValueChange={(v) => setEditJobForm({ ...editJobForm, job_type: v ?? "" })}>
                                <SelectTrigger className="h-10 text-sm border-gray-300"><SelectValue placeholder="직종" /></SelectTrigger>
                                <SelectContent>{JOB_TYPES.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <Input type="number" min={0} max={60} value={editJobForm.required_career_years} onChange={(e) => setEditJobForm({ ...editJobForm, required_career_years: e.target.value })} className="h-10 text-sm border-gray-300" placeholder="요구 경력(년)" />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="h-8 px-4 bg-blue-700 text-white" disabled={savingJob} onClick={handleSaveJob}>{savingJob ? "저장 중…" : "저장"}</Button>
                            <Button size="sm" variant="outline" className="h-8 px-4" onClick={() => setEditJobId(null)}>취소</Button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={job.id} className="border-2 border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                        <p className="font-semibold text-gray-900 text-base mb-1">{job.title}</p>
                        <p className="text-sm text-gray-600 mb-3">
                          {job.region} · {job.job_type} · 경력 {job.required_career_years != null ? `${job.required_career_years}년` : "무관"}
                        </p>
                        {isDeleteConfirm ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-red-600 font-semibold">삭제할까요?</span>
                            <Button size="sm" variant="destructive" className="h-8 px-3 text-sm" onClick={() => handleDeleteJob(job.id)}>확인</Button>
                            <Button size="sm" variant="outline" className="h-8 px-3 text-sm" onClick={() => setDeleteJobConfirmId(null)}>취소</Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-8 px-3 text-sm" onClick={() => startEditJob(job)}>수정</Button>
                            <Button size="sm" variant="destructive" className="h-8 px-3 text-sm" onClick={() => { setDeleteJobConfirmId(job.id); setEditJobId(null); }}>삭제</Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 데스크톱: 테이블 */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-lg">
                    <thead>
                      <tr className="border-b-2 border-gray-200 text-gray-600">
                        <th className="text-left py-3 px-2">공고명</th>
                        <th className="text-left py-3 px-2">지역</th>
                        <th className="text-left py-3 px-2">직종</th>
                        <th className="text-left py-3 px-2">요구 경력</th>
                        <th className="py-3 px-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => {
                        const isEditing = editJobId === job.id;
                        const isDeleteConfirm = deleteJobConfirmId === job.id;
                        if (isEditing) {
                          return (
                            <tr key={job.id} className="border-b border-blue-100 bg-blue-50">
                              <td className="py-3 px-2"><Input value={editJobForm.title} onChange={(e) => setEditJobForm({ ...editJobForm, title: e.target.value })} className="h-10 text-base border-gray-300" /></td>
                              <td className="py-3 px-2">
                                <Select value={editJobForm.region} onValueChange={(v) => setEditJobForm({ ...editJobForm, region: v ?? "" })}>
                                  <SelectTrigger className="h-10 text-base border-gray-300 w-28"><SelectValue /></SelectTrigger>
                                  <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                </Select>
                              </td>
                              <td className="py-3 px-2">
                                <Select value={editJobForm.job_type} onValueChange={(v) => setEditJobForm({ ...editJobForm, job_type: v ?? "" })}>
                                  <SelectTrigger className="h-10 text-base border-gray-300 w-28"><SelectValue /></SelectTrigger>
                                  <SelectContent>{JOB_TYPES.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                                </Select>
                              </td>
                              <td className="py-3 px-2"><Input type="number" min={0} max={60} value={editJobForm.required_career_years} onChange={(e) => setEditJobForm({ ...editJobForm, required_career_years: e.target.value })} className="h-10 text-base border-gray-300 w-20" placeholder="—" /></td>
                              <td className="py-3 px-2 text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" className="h-9 px-4 bg-blue-700 hover:bg-blue-800 text-white" disabled={savingJob} onClick={handleSaveJob}>{savingJob ? "저장 중…" : "저장"}</Button>
                                  <Button size="sm" variant="outline" className="h-9 px-4" onClick={() => setEditJobId(null)}>취소</Button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-2 font-semibold">{job.title}</td>
                            <td className="py-4 px-2">{job.region}</td>
                            <td className="py-4 px-2">{job.job_type}</td>
                            <td className="py-4 px-2">{job.required_career_years != null ? `${job.required_career_years}년` : "—"}</td>
                            <td className="py-4 px-2 text-right">
                              {isDeleteConfirm ? (
                                <div className="flex items-center gap-2 justify-end">
                                  <span className="text-sm text-red-600 font-semibold">삭제할까요?</span>
                                  <Button size="sm" variant="destructive" className="h-8 px-3 text-sm" onClick={() => handleDeleteJob(job.id)}>확인</Button>
                                  <Button size="sm" variant="outline" className="h-8 px-3 text-sm" onClick={() => setDeleteJobConfirmId(null)}>취소</Button>
                                </div>
                              ) : (
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="outline" className="h-9 px-4 text-base" onClick={() => startEditJob(job)}>수정</Button>
                                  <Button variant="destructive" size="sm" className="h-9 px-4 text-base" onClick={() => { setDeleteJobConfirmId(job.id); setEditJobId(null); }}>삭제</Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
