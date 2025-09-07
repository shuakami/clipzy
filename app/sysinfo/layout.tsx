import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "系统信息查看器 - 实时系统状态监控",
  description: "实时查看系统硬件信息、性能指标和运行状态。包括CPU、内存、磁盘、网络等详细信息，帮助您了解系统运行状况。",
  keywords: [
    "系统信息", "硬件信息", "系统监控", "性能监控", "系统状态",
    "CPU信息", "内存信息", "磁盘信息", "网络信息", "系统工具",
    "硬件检测", "系统诊断", "性能分析", "系统资源", "硬件监控",
    "系统规格", "计算机信息", "硬件配置", "系统详情",
    "system information", "hardware info", "system monitor", "performance",
    "cpu info", "memory info", "disk info", "system specs", "hardware detection"
  ],
  openGraph: {
    title: "Clipzy 系统信息查看器 - 实时系统状态监控",
    description: "实时查看系统硬件信息、性能指标和运行状态，包括CPU、内存、磁盘等详细信息。",
    type: "website",
    images: [
      {
        url: "/assets/clipzy.png",
        width: 1200,
        height: 630,
        alt: "Clipzy 系统信息工具",
        type: "image/png",
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "Clipzy 系统信息查看器 - 实时系统状态监控",
    description: "实时查看系统硬件信息、性能指标和运行状态，了解您的系统配置。",
    images: [
      {
        url: "/assets/clipzy.png",
        alt: "Clipzy 系统信息工具",
      }
    ]
  },
  alternates: {
    canonical: "/sysinfo",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function SysInfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
