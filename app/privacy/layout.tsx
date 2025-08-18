import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "隐私政策 - 端到端加密保护您的数据安全",
  description: "了解 Clipzy 如何通过端到端加密保护您的隐私。我们不收集个人信息，所有数据均在客户端加密，服务器无法解密您的内容。",
  keywords: [
    "隐私政策", "端到端加密", "数据安全", "隐私保护", "个人信息保护",
    "加密安全", "用户隐私", "数据保护", "安全政策",
    "privacy policy", "end-to-end encryption", "data protection", "user privacy"
  ],
  openGraph: {
    title: "Clipzy 隐私政策 - 端到端加密保护您的数据",
    description: "了解 Clipzy 如何通过端到端加密技术保护您的隐私和数据安全。",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Clipzy 隐私政策 - 端到端加密保护",
    description: "了解 Clipzy 如何通过端到端加密技术保护您的隐私和数据安全。",
  },
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}