import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "局域网快传 - 本地网络文件传输",
  description: "在同一网络下的设备间安全传输文本和文件。数据直接在设备间传输，无需上传到云端。支持多设备连接，实时传输进度显示，保护隐私安全。",
  keywords: [
    "局域网传输", "本地文件传输", "设备间传输", "局域网共享", "P2P传输",
    "文件快传", "设备互传", "局域网通信", "本地网络传输", "无线传输",
    "安全传输", "隐私保护", "文件分享", "文本传输", "实时传输",
    "局域网工具", "网络传输", "设备连接", "文件同步", "跨设备传输",
    "lan transfer", "local network transfer", "peer to peer", "file sharing",
    "local file transfer", "device to device", "wireless transfer"
  ],
  openGraph: {
    title: "Clipzy 局域网快传 - 本地网络文件传输",
    description: "在同一网络下的设备间安全传输文本和文件。数据直接传输，保护隐私安全。",
    type: "website",
    images: [
      {
        url: "/assets/clipzy.png",
        width: 1200,
        height: 630,
        alt: "Clipzy 局域网快传服务",
        type: "image/png",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Clipzy 局域网快传 - 本地网络文件传输",
    description: "在同一网络下的设备间安全传输文本和文件，数据直接传输保护隐私。",
    images: [
      {
        url: "/assets/clipzy.png",
        alt: "Clipzy 局域网快传服务",
      }
    ]
  },
  alternates: {
    canonical: "/lan",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function LanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
