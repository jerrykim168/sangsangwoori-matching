import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-2 text-gray-900">프로필 등록</h1>
      <p className="text-xl text-gray-500 mb-8">
        정보를 입력하시면 맞는 일자리를 찾아 드립니다.
      </p>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">기본 정보 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xl font-semibold text-gray-700" htmlFor="name">
                이름
              </label>
              <input
                id="name"
                type="text"
                placeholder="홍길동"
                disabled
                className="h-14 rounded-lg border-2 border-gray-300 px-4 text-xl text-gray-400 bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xl font-semibold text-gray-700" htmlFor="region">
                지역
              </label>
              <input
                id="region"
                type="text"
                placeholder="서울 강남구"
                disabled
                className="h-14 rounded-lg border-2 border-gray-300 px-4 text-xl text-gray-400 bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xl font-semibold text-gray-700" htmlFor="desired_job">
                희망 직종
              </label>
              <input
                id="desired_job"
                type="text"
                placeholder="경비원, 청소원, 배달..."
                disabled
                className="h-14 rounded-lg border-2 border-gray-300 px-4 text-xl text-gray-400 bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xl font-semibold text-gray-700" htmlFor="career_years">
                경력 (년)
              </label>
              <input
                id="career_years"
                type="number"
                placeholder="10"
                disabled
                className="h-14 rounded-lg border-2 border-gray-300 px-4 text-xl text-gray-400 bg-gray-50 cursor-not-allowed"
              />
            </div>

            <Button
              type="submit"
              disabled
              className="h-16 text-2xl font-bold mt-2 bg-blue-700 text-white cursor-not-allowed"
            >
              등록하기
            </Button>

            <p className="text-center text-gray-400 text-base">
              ※ 기능 구현 예정 — 현재는 레이아웃 확인용입니다
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
