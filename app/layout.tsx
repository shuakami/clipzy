import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";

// Updated Metadata for SEO
export const metadata: Metadata = {
  title: "Clipzy - 安全加密的临时文本分享",
  description: "Clipzy 提供端到端加密的文本分享服务，安全快捷地分享临时信息、代码片段等。链接阅后即焚或定时销毁。",
  keywords: ["加密分享", "文本分享", "临时笔记", "代码片段", "安全分享", "阅后即焚", "端到端加密", "clipzy", "encrypted sharing", "text sharing", "temporary notes", "code snippets", "secure sharing", "burn after reading", "end-to-end encryption"],
  openGraph: {
    title: "Clipzy - 安全加密的临时文本分享",
    description: "安全快捷地分享临时信息、代码片段等。",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Clipzy - 安全加密的临时文本分享",
    description: "安全快捷地分享临时信息、代码片段等。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Favicons for light and dark themes */}
        <link rel="icon" href="/clipzy_black.ico" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/clipzy_white.ico" media="(prefers-color-scheme: dark)" />
        {/* Fallback icon */}
        <link rel="icon" href="/clipzy_black.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
} 