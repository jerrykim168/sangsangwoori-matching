"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/register", label: "프로필 등록" },
  { href: "/recommendations", label: "추천 목록" },
  { href: "/admin", label: "담당자 대시보드" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="bg-blue-700 text-white shadow-md">
      <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-8">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          상상우리
        </Link>
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-xl font-semibold underline-offset-4 transition-opacity ${
              pathname.startsWith(href)
                ? "underline opacity-100"
                : "opacity-80 hover:opacity-100 hover:underline"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
