import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="-mx-6 -mt-10">
      <div className="relative flex flex-col items-center justify-center min-h-[88vh] text-center overflow-hidden">
        {/* 회색 배경 이미지 — 일자리를 찾는 사람들 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80')",
            filter: "grayscale(100%)",
          }}
        />
        {/* 가독성을 위한 흰색 오버레이 */}
        <div className="absolute inset-0 bg-white/55" />

        {/* 콘텐츠 */}
        <div className="relative z-10 flex flex-col items-center gap-10 px-6">
          <h1
            className="text-9xl font-bold text-blue-700 leading-tight"
            style={{ fontFamily: "var(--font-black-han-sans)" }}
          >
            시니어 일자리<br />매칭 서비스
          </h1>
          <p className="text-2xl text-gray-700 max-w-xl">
            프로필을 등록하면 맞춤 일자리를 자동으로 추천해 드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: "default" }), "h-14 px-10 text-xl")}
            >
              프로필 등록하기
            </Link>
            <Link
              href="/recommendations"
              className={cn(buttonVariants({ variant: "outline" }), "h-14 px-10 text-xl")}
            >
              추천 목록 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
