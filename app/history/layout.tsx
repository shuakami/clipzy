import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "浏览历史 - 已查看的剪贴板记录",
  description: "查看您最近访问过的剪贴板链接历史记录。本地存储，保护隐私，方便您重新访问之前查看的内容。支持搜索和管理历史记录。",
  keywords: [
    "浏览历史", "访问历史", "剪贴板历史", "历史记录", "访问记录",
    "本地历史", "隐私保护", "历史管理", "记录查看", "内容历史",
    "访问痕迹", "浏览记录", "查看记录", "历史搜索", "历史删除",
    "本地存储", "客户端存储", "离线历史", "历史数据",
    "browsing history", "access history", "clipboard history", "local history",
    "privacy protection", "history management", "view history", "local storage"
  ],
  openGraph: {
    title: "Clipzy 浏览历史 - 已查看的剪贴板记录",
    description: "查看您最近访问过的剪贴板链接历史记录，本地存储保护隐私。",
    type: "website",
    images: [
      {
        url: "/assets/clipzy.png",
        width: 1200,
        height: 630,
        alt: "Clipzy 浏览历史",
        type: "image/png",
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "Clipzy 浏览历史 - 已查看的剪贴板记录",
    description: "查看您的剪贴板访问历史记录，本地存储保护隐私安全。",
    images: [
      {
        url: "/assets/clipzy.png",
        alt: "Clipzy 浏览历史",
      }
    ]
  },
  alternates: {
    canonical: "/history",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}