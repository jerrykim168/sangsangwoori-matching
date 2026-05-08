import type { Metadata } from "next";
import { Geist, Noto_Sans_KR, Black_Han_Sans } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const blackHanSans = Black_Han_Sans({
  variable: "--font-black-han-sans",
  subsets: ["latin"],
  weight: ["400"],
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
    <html lang="ko" className={`${geistSans.variable} ${notoSansKR.variable} ${blackHanSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <NavBar />

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
