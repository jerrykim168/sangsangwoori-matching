import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "상상우리 매칭 시스템",
  description: "시니어 일자리 자동 매칭 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <header className="bg-blue-700 text-white shadow-md">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-8">
            <span className="text-2xl font-bold tracking-tight">상상우리</span>
            <Link
              href="/register"
              className="text-xl font-semibold hover:underline underline-offset-4"
            >
              프로필 등록
            </Link>
            <Link
              href="/recommendations"
              className="text-xl font-semibold hover:underline underline-offset-4"
            >
              추천 목록
            </Link>
            <Link
              href="/admin"
              className="text-xl font-semibold hover:underline underline-offset-4"
            >
              담당자 대시보드
            </Link>
          </nav>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
          {children}
        </main>

        <footer className="bg-gray-100 border-t text-center py-4 text-gray-500 text-base">
          © 2026 상상우리 시니어 매칭 서비스
        </footer>
      </body>
    </html>
  );
}
