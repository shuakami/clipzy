import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "更新记录 - 版本历史与功能改进",
  description: "查看 Clipzy 最新的功能更新、性能改进和错误修复记录。我们持续优化产品，为用户提供更好的在线剪贴板服务体验。",
  keywords: [
    "更新记录", "版本历史", "功能更新", "变更日志", "产品改进",
    "新功能", "错误修复", "性能优化", "功能增强", "版本发布",
    "软件更新", "产品迭代", "改进记录", "升级内容", "发布说明",
    "changelog", "release notes", "version history", "updates", 
    "improvements", "bug fixes", "new features", "enhancements"
  ],
  openGraph: {
    title: "Clipzy 更新记录 - 版本历史与功能改进",
    description: "查看 Clipzy 最新的功能更新、性能改进和错误修复记录。持续优化的在线剪贴板服务。",
    type: "website",
    images: [
      {
        url: "/assets/clipzy.png",
        width: 1200,
        height: 630,
        alt: "Clipzy 更新记录",
        type: "image/png",
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "Clipzy 更新记录 - 版本历史与功能改进",
    description: "查看 Clipzy 最新功能更新和改进记录，了解我们如何持续优化产品。",
    images: [
      {
        url: "/assets/clipzy.png",
        alt: "Clipzy 更新记录",
      }
    ]
  },
  alternates: {
    canonical: "/changelog",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
