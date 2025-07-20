import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clipzy / 在线剪贴板",
  description: "Clipzy 是一款安全的在线剪贴板工具，提供端到端加密的临时文本和代码片段分享服务。支持链接阅后即焚或定时销毁，保护您的信息安全。",
  keywords: ["在线剪贴板", "网络剪贴板", "临时剪贴板", "安全剪贴板", "加密剪贴板", "文本分享", "临时文本", "代码片段分享", "阅后即焚", "端到端加密", "clipzy", "online clipboard", "secure clipboard", "temporary clipboard", "encrypted text sharing"],
  icons: [
    { url: "/clipzy_black.ico", rel: "icon", type: "image/x-icon" },
    { url: "/clipzy_white.ico", rel: "icon", type: "image/x-icon", media: "(prefers-color-scheme: dark)" },
  ],
  manifest: "/site.webmanifest",
  viewport: "width=device-width, initial-scale=1",
  authors: [{ name: "shuakami", url: "https://github.com/shuakami" }],
  openGraph: {
    title: "Clipzy - 在线安全剪贴板 | 临时文本分享",
    description: "Clipzy 是一款安全的在线剪贴板，支持端到端加密的临时文本和代码片段分享。",
    type: "website",
    images: [
      {
        url: "/assets/clipzy.png",
        width: 800,
        height: 600,
        alt: "Clipzy Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Clipzy - 在线安全剪贴板 | 临时文本分享",
    description: "Clipzy 是一款安全的在线剪贴板，支持端到端加密的临时文本和代码片段分享。",
    images: ["/assets/clipzy.png"],
  },
}; 