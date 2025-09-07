import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "图片上传 - 安全的临时图片分享服务",
  description: "安全上传和分享图片，支持端到端加密保护。临时存储，自动过期删除，保护您的图片隐私安全。支持多种图片格式，快速生成分享链接。",
  keywords: [
    "图片上传", "图片分享", "临时图片", "图片存储", "安全上传",
    "图片加密", "隐私保护", "图片链接", "图片云存储", "在线图床",
    "临时图床", "加密图片", "图片传输", "图片托管", "免费图床",
    "图片分享服务", "安全图床", "图片外链", "图片存储服务",
    "image upload", "image sharing", "secure image", "temporary image",
    "encrypted image", "image storage", "image hosting", "free image host"
  ],
  openGraph: {
    title: "Clipzy 图片上传 - 安全的临时图片分享服务",
    description: "安全上传和分享图片，端到端加密保护，临时存储自动过期删除。",
    type: "website",
    images: [
      {
        url: "/assets/clipzy.png",
        width: 1200,
        height: 630,
        alt: "Clipzy 图片上传服务",
        type: "image/png",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Clipzy 图片上传 - 安全的临时图片分享服务",
    description: "安全上传和分享图片，端到端加密保护，临时存储自动过期删除。",
    images: [
      {
        url: "/assets/clipzy.png",
        alt: "Clipzy 图片上传服务",
      }
    ]
  },
  alternates: {
    canonical: "/image",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function ImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
