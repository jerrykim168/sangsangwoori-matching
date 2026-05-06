import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const placeholderItems = [
  { rank: 1, score: 95, title: "아파트 경비원", region: "서울 강남구", job_type: "경비" },
  { rank: 2, score: 82, title: "공원 청소원", region: "서울 서초구", job_type: "청소" },
  { rank: 3, score: 74, title: "주차 관리원", region: "서울 송파구", job_type: "주차관리" },
];

export default function RecommendationsPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-2 text-gray-900">추천 일자리 목록</h1>
      <p className="text-xl text-gray-500 mb-8">
        매칭 점수가 높은 순서로 표시됩니다.
      </p>

      <div className="flex flex-col gap-4">
        {placeholderItems.map((item) => (
          <Card
            key={item.rank}
            className="shadow-sm border-2 border-gray-100 hover:border-blue-200 transition-colors"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{item.title}</CardTitle>
                <span className="text-3xl font-bold text-blue-700">
                  {item.score}점
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex gap-3 flex-wrap">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {item.region}
              </Badge>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {item.job_type}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-gray-400 text-base mt-8">
        ※ 위 목록은 레이아웃 확인용 더미 데이터입니다 — 실제 매칭 기능은 추후 구현 예정
      </p>
    </div>
  );
}
