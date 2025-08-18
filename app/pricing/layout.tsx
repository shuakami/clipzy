import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "价格说明 - 完全免费使用",
  description: "Clipzy 是完全免费的在线剪贴板服务，所有核心功能均免费提供。了解我们的公平使用政策和服务条款。",
  keywords: [
    "免费服务", "价格说明", "使用政策", "服务条款", "公平使用",
    "免费剪贴板", "免费工具", "无需付费",
    "free service", "pricing", "free clipboard", "terms of service"
  ],
  openGraph: {
    title: "Clipzy 价格说明 - 完全免费使用",
    description: "Clipzy 是完全免费的在线剪贴板服务，了解我们的使用政策。",
    type: "webpage",
  },
  twitter: {
    card: "summary",
    title: "Clipzy 价格说明 - 完全免费使用",
    description: "Clipzy 是完全免费的在线剪贴板服务，了解我们的使用政策。",
  },
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}