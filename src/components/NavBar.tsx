"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/register",        label: "프로필 등록",    short: "등록" },
  { href: "/recommendations", label: "추천 목록",      short: "추천" },
  { href: "/admin",           label: "담당자 대시보드", short: "담당자" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="bg-blue-700 text-white shadow-md">
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-4 sm:gap-8">
        <Link href="/" className="text-xl sm:text-2xl font-bold tracking-tight whitespace-nowrap">
          상상우리
        </Link>
        {links.map(({ href, label, short }) => (
          <Link
            key={href}
            href={href}
            className={`text-base sm:text-xl font-semibold underline-offset-4 transition-opacity whitespace-nowrap ${
              pathname.startsWith(href)
                ? "underline opacity-100"
                : "opacity-80 hover:opacity-100 hover:underline"
            }`}
          >
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
