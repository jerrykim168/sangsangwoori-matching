"use client";

import { useEffect, useState } from "react";
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

const REGIONS = ["서울", "경기", "인천", "기타"];
const JOB_TYPES = ["경비", "청소", "조리", "돌봄", "기타"];

const STATUS_SECTIONS = [
  {
    id: "unmatched",
    label: "미매칭",
    color: "bg-red-50 border-red-200",
    badgeClass: "bg-red-100 text-red-700",
    count: 0,
    description: "아직 일자리가 연결되지 않은 시니어",
  },
  {
    id: "pending",
    label: "매칭 대기",
    color: "bg-yellow-50 border-yellow-200",
    badgeClass: "bg-yellow-100 text-yellow-700",
    count: 0,
    description: "매칭이 완료되어 담당자 확인을 기다리는 건",
  },
  {
    id: "assigned",
    label: "배정 완료",
    color: "bg-green-50 border-green-200",
    badgeClass: "bg-green-100 text-green-700",
    count: 0,
    description: "배정이 확정된 시니어·일자리 쌍",
  },
];

type JobForm = {
  title: string;
  region: string;
  job_type: string;
  required_career_years: string;
};

type JobErrors = Partial<Record<keyof JobForm, string>>;

const INITIAL_JOB: JobForm = { title: "", region: "", job_type: "", required_career_years: "" };

export default function AdminPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<JobForm>(INITIAL_JOB);
  const [errors, setErrors] = useState<JobErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  async function fetchJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setJobs(data as Job[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  function validate(): JobErrors {
    const e: JobErrors = {};
    if (!form.title.trim()) e.title = "공고명을 입력해 주세요.";
    if (!form.region) e.region = "지역을 선택해 주세요.";
    if (!form.job_type) e.job_type = "직종을 선택해 주세요.";
    return e;
  }

  async function handleAddJob(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setServerError("");

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { error } = await supabase.from("jobs").insert({
      title: form.title.trim(),
      region: form.region,
      job_type: form.job_type,
      required_career_years: form.required_career_years ? Number(form.required_career_years) : null,
    });

    setSubmitting(false);

    if (error) {
      setServerError("저장 중 오류가 발생했습니다: " + error.message);
    } else {
      setSuccess(true);
      setForm(INITIAL_JOB);
      fetchJobs();
    }
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (!error) setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2 text-gray-900">담당자 대시보드</h1>
      <p className="text-xl text-gray-500 mb-8">
        매칭 현황을 한눈에 확인하고 관리합니다.
      </p>

      {/* 매칭 현황 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {STATUS_SECTIONS.map((s) => (
          <Card key={s.id} className={`border-2 ${s.color}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{s.label}</CardTitle>
                <span className={`text-3xl font-bold px-3 py-1 rounded-lg ${s.badgeClass}`}>
                  {s.count}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-lg">{s.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 일자리 관리 섹션 */}
      <section>
        <h2 className="text-3xl font-bold mb-6 border-b pb-3">일자리 관리</h2>

        {/* 일자리 추가 폼 */}
        <Card className="shadow-md mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">새 일자리 등록</CardTitle>
          </CardHeader>
          <CardContent>
            {success && (
              <Alert className="mb-4 border-green-500 bg-green-50 text-green-800">
                <AlertDescription className="text-lg font-semibold">
                  일자리가 등록되었습니다 ✓
                </AlertDescription>
              </Alert>
            )}
            {serverError && (
              <Alert className="mb-4 border-red-500 bg-red-50 text-red-800">
                <AlertDescription className="text-base">{serverError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleAddJob} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* 공고명 */}
                <div className="flex flex-col gap-2">
                  <Label className="text-lg font-semibold text-gray-700">
                    공고명 <span className="text-red-500">*</span>
                  </Label>
                  {errors.title && (
                    <Alert className="border-red-400 bg-red-50 py-2">
                      <AlertDescription className="text-sm text-red-700">{errors.title}</AlertDescription>
                    </Alert>
                  )}
                  <Input
                    type="text"
                    placeholder="예: 아파트 경비원"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="h-12 text-lg border-2 border-gray-300"
                  />
                </div>

                {/* 지역 */}
                <div className="flex flex-col gap-2">
                  <Label className="text-lg font-semibold text-gray-700">
                    지역 <span className="text-red-500">*</span>
                  </Label>
                  {errors.region && (
                    <Alert className="border-red-400 bg-red-50 py-2">
                      <AlertDescription className="text-sm text-red-700">{errors.region}</AlertDescription>
                    </Alert>
                  )}
                  <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v ?? "" })}>
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

                {/* 직종 */}
                <div className="flex flex-col gap-2">
                  <Label className="text-lg font-semibold text-gray-700">
                    직종 <span className="text-red-500">*</span>
                  </Label>
                  {errors.job_type && (
                    <Alert className="border-red-400 bg-red-50 py-2">
                      <AlertDescription className="text-sm text-red-700">{errors.job_type}</AlertDescription>
                    </Alert>
                  )}
                  <Select value={form.job_type} onValueChange={(v) => setForm({ ...form, job_type: v ?? "" })}>
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

                {/* 요구 경력 */}
                <div className="flex flex-col gap-2">
                  <Label className="text-lg font-semibold text-gray-700">
                    요구 경력 (년) <span className="text-gray-400 text-sm font-normal">선택</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    placeholder="예: 3"
                    value={form.required_career_years}
                    onChange={(e) => setForm({ ...form, required_career_years: e.target.value })}
                    className="h-12 text-lg border-2 border-gray-300"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="mt-6 h-14 px-10 text-xl font-bold bg-blue-700 hover:bg-blue-800 text-white"
              >
                {submitting ? "저장 중…" : "일자리 등록"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 일자리 목록 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">
              등록된 일자리{" "}
              <Badge className="text-base px-3 py-1 ml-2 bg-blue-100 text-blue-700">
                {jobs.length}건
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-xl text-gray-400 text-center py-8">불러오는 중…</p>
            ) : jobs.length === 0 ? (
              <p className="text-xl text-gray-400 text-center py-8">
                등록된 일자리가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
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
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-2 font-semibold">{job.title}</td>
                        <td className="py-4 px-2">{job.region}</td>
                        <td className="py-4 px-2">{job.job_type}</td>
                        <td className="py-4 px-2">
                          {job.required_career_years != null
                            ? `${job.required_career_years}년`
                            : "—"}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-base h-10 px-4"
                            onClick={() => handleDelete(job.id)}
                          >
                            삭제
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
