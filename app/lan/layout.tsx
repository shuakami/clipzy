import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "局域网快传 - 即将推出",
  description: "Clipzy 局域网快传功能即将推出，支持同一网络下设备间高速、点对点的安全文本和文件传输。敬请期待这一创新功能。",
  keywords: [
    "局域网传输", "局域网快传", "点对点传输", "文件传输", "局域网分享",
    "P2P传输", "内网传输", "高速传输", "安全传输",
    "LAN transfer", "peer to peer", "local network sharing", "fast transfer"
  ],
  openGraph: {
    title: "Clipzy 局域网快传 - 即将推出",
    description: "即将推出的局域网快传功能，支持同一网络下设备间高速安全传输。",
    type: "webpage",
  },
  twitter: {
    card: "summary",
    title: "Clipzy 局域网快传 - 即将推出",
    description: "即将推出的局域网快传功能，支持同一网络下设备间高速安全传输。",
  },
  alternates: {
    canonical: "/lan",
  },
};

export default function LanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}