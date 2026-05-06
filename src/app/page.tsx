import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-10 py-20 text-center">
      <h1 className="text-5xl font-bold text-blue-700 leading-tight">
        시니어 일자리 매칭 서비스
      </h1>
      <p className="text-2xl text-gray-600 max-w-xl">
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
  );
}
