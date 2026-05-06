import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sections = [
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

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-2 text-gray-900">담당자 대시보드</h1>
      <p className="text-xl text-gray-500 mb-8">
        매칭 현황을 한눈에 확인하고 관리합니다.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {sections.map((s) => (
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

      {sections.map((s) => (
        <section key={s.id} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold">{s.label} 목록</h2>
            <Badge className={`text-base px-3 py-1 ${s.badgeClass}`}>
              {s.count}건
            </Badge>
          </div>

          <div className={`rounded-xl border-2 ${s.color} p-8 text-center`}>
            <p className="text-xl text-gray-400">
              데이터가 없습니다 — 기능 구현 후 표시됩니다
            </p>
          </div>
        </section>
      ))}

      <p className="text-center text-gray-400 text-base mt-4">
        ※ 현재는 레이아웃 확인용입니다 — 실제 데이터 연동은 추후 구현 예정
      </p>
    </div>
  );
}
