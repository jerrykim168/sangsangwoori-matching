"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { supabase } from "@/lib/supabase";

const REGIONS = ["서울", "경기", "인천", "기타"];
const JOB_TYPES = ["경비", "청소", "조리", "돌봄", "기타"];

type FormState = {
  name: string;
  region: string;
  desired_job: string;
  career_years: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = { name: "", region: "", desired_job: "", career_years: "" };

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): Errors {
    const e: Errors = {};
    if (!form.name.trim()) e.name = "이름을 입력해 주세요.";
    if (!form.region) e.region = "지역을 선택해 주세요.";
    if (!form.desired_job) e.desired_job = "희망 직종을 선택해 주세요.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
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

    const { error } = await supabase.from("seniors").insert({
      name: form.name.trim(),
      region: form.region,
      desired_job: form.desired_job,
      career_years: form.career_years ? Number(form.career_years) : null,
    });

    setSubmitting(false);

    if (error) {
      setServerError("저장 중 오류가 발생했습니다: " + error.message);
    } else {
      setSuccess(true);
      setForm(INITIAL);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-2 text-gray-900">프로필 등록</h1>
      <p className="text-xl text-gray-500 mb-8">
        정보를 입력하시면 맞는 일자리를 찾아 드립니다.
      </p>

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50 text-green-800">
          <AlertDescription className="text-xl font-semibold">
            등록이 완료되었습니다 ✓
          </AlertDescription>
        </Alert>
      )}

      {serverError && (
        <Alert className="mb-6 border-red-500 bg-red-50 text-red-800">
          <AlertDescription className="text-lg">{serverError}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">기본 정보 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>

            {/* 이름 */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-xl font-semibold text-gray-700">
                이름 <span className="text-red-500">*</span>
              </Label>
              {errors.name && (
                <Alert className="border-red-400 bg-red-50 py-2">
                  <AlertDescription className="text-base text-red-700">
                    {errors.name}
                  </AlertDescription>
                </Alert>
              )}
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-14 text-xl border-2 border-gray-300 px-4"
              />
            </div>

            {/* 지역 */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="region" className="text-xl font-semibold text-gray-700">
                지역 <span className="text-red-500">*</span>
              </Label>
              {errors.region && (
                <Alert className="border-red-400 bg-red-50 py-2">
                  <AlertDescription className="text-base text-red-700">
                    {errors.region}
                  </AlertDescription>
                </Alert>
              )}
              <Select
                value={form.region}
                onValueChange={(v) => setForm({ ...form, region: v ?? "" })}
              >
                <SelectTrigger id="region" className="h-14 text-xl border-2 border-gray-300 px-4">
                  <SelectValue placeholder="지역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xl py-3">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 희망 직종 */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="desired_job" className="text-xl font-semibold text-gray-700">
                희망 직종 <span className="text-red-500">*</span>
              </Label>
              {errors.desired_job && (
                <Alert className="border-red-400 bg-red-50 py-2">
                  <AlertDescription className="text-base text-red-700">
                    {errors.desired_job}
                  </AlertDescription>
                </Alert>
              )}
              <Select
                value={form.desired_job}
                onValueChange={(v) => setForm({ ...form, desired_job: v ?? "" })}
              >
                <SelectTrigger id="desired_job" className="h-14 text-xl border-2 border-gray-300 px-4">
                  <SelectValue placeholder="직종을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((j) => (
                    <SelectItem key={j} value={j} className="text-xl py-3">
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 경력 */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="career_years" className="text-xl font-semibold text-gray-700">
                경력 (년) <span className="text-gray-400 text-base font-normal">선택</span>
              </Label>
              <Input
                id="career_years"
                type="number"
                min={0}
                max={60}
                placeholder="예: 10"
                value={form.career_years}
                onChange={(e) => setForm({ ...form, career_years: e.target.value })}
                className="h-14 text-xl border-2 border-gray-300 px-4"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-16 text-2xl font-bold mt-2 bg-blue-700 hover:bg-blue-800 text-white"
            >
              {submitting ? "저장 중…" : "등록하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
