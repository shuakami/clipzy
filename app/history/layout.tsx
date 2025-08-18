import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "查看历史 - 本地加密记录管理",
  description: "查看和管理您的 Clipzy 历史记录，所有数据均在本地加密存储，保护您的隐私安全。支持解密查看、复制和删除操作。",
  keywords: [
    "历史记录", "本地存储", "加密记录", "隐私保护", "数据管理",
    "clipboard history", "encrypted storage", "local records", "privacy protection"
  ],
  openGraph: {
    title: "Clipzy 历史记录 - 本地加密记录管理",
    description: "查看和管理您的加密历史记录，所有数据均在本地安全存储。",
    type: "webpage",
  },
  twitter: {
    card: "summary",
    title: "Clipzy 历史记录 - 本地加密记录管理",
    description: "查看和管理您的加密历史记录，所有数据均在本地安全存储。",
  },
  alternates: {
    canonical: "/history",
  },
  robots: {
    index: false, // 历史记录页面不需要被索引
    follow: true,
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}