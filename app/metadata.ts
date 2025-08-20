import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://paste.sdjz.wiki";

export const metadata: Metadata = {
  title: {
    default: "Clipzy - 在线安全剪贴板 | 端到端加密文本分享服务",
    template: "%s | Clipzy"
  },
  description: "Clipzy 是一款专业的在线剪贴板工具，提供端到端加密的临时文本和代码片段分享服务。支持链接阅后即焚、定时销毁，保护您的信息安全。完全免费使用，无需注册。极简设计，安全可靠，是您最佳的网络剪贴板选择。",
  keywords: [
    // 核心关键词
    "在线剪贴板", "网络剪贴板", "临时剪贴板", "安全剪贴板", "加密剪贴板",
    "免费剪贴板", "极简剪贴板", "云剪贴板", "网页剪贴板", "在线粘贴板",
    // 功能关键词
    "文本分享", "临时文本", "代码片段分享", "阅后即焚", "端到端加密",
    "文本加密", "隐私保护", "安全分享", "文档分享", "代码分享",
    "密文传输", "临时存储", "跨设备分享", "无需注册", "免费使用",
    // 竞品关键词
    "网络剪切板", "在线剪切板", "即时剪贴板", "一块剪贴板", "智能粘贴板",
    "数据暂存", "文件传输", "安全传输", "快速分享", "极速分享",
    // 长尾关键词
    "最好用的在线剪贴板", "安全的网络剪贴板", "免费在线文本分享",
    "端到端加密剪贴板", "临时文本存储工具", "跨设备文本同步",
    // 英文关键词
    "clipzy", "online clipboard", "secure clipboard", "temporary clipboard", 
    "encrypted text sharing", "end-to-end encryption", "temporary text sharing",
    "code snippet sharing", "burn after reading", "secure text storage",
    "privacy protection", "encrypted storage", "secure file transfer",
    "free clipboard", "web clipboard", "instant clipboard"
  ],
  applicationName: "Clipzy",
  referrer: "origin-when-cross-origin",
  creator: "shuakami",
  publisher: "Clipzy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/clipzy_black.ico", type: "image/x-icon" },
      { url: "/clipzy_white.ico", type: "image/x-icon", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: "/clipzy_black.ico",
    apple: [
      { url: "/assets/clipzy.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  authors: [{ name: "shuakami", url: "https://github.com/shuakami" }],
  openGraph: {
    title: "Clipzy - 在线安全剪贴板 | 端到端加密文本分享服务",
    description: "专业的在线剪贴板工具，提供端到端加密的临时文本和代码片段分享服务。支持阅后即焚、定时销毁，保护您的信息安全。",
    url: baseUrl,
    siteName: "Clipzy",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "/assets/clipzy.png",
        width: 1200,
        height: 630,
        alt: "Clipzy - 安全的在线剪贴板服务",
        type: "image/png",
      },
      {
        url: "/assets/clipzy-white.png",
        width: 1200,
        height: 630,
        alt: "Clipzy - 安全的在线剪贴板服务",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clipzy - 在线安全剪贴板 | 端到端加密文本分享",
    description: "专业的在线剪贴板工具，端到端加密保护您的文本和代码片段分享安全。",
    creator: "@shuakami",
    images: [
      {
        url: "/assets/clipzy.png",
        alt: "Clipzy - 安全的在线剪贴板服务",
      },
    ],
  },
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  category: "technology",
  classification: "工具软件",
  other: {
    "baidu-site-verification": "",
    "360-site-verification": "",
    "sogou_site_verification": "",
  },
}; 