"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Footer from "@/components/Footer";
import { usePrefersDarkMode, useTheme } from "@/hooks/useThemeManager";

interface InfoMap {
  [k: string]: string | number;
}

const getSysInfo = (): InfoMap => {
  if (typeof window === "undefined") return {};
  const nav: Navigator = window.navigator;
  let gpuInfo = "";
  if ("WebGLRenderingContext" in window) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") as WebGLRenderingContext | null
        ?? canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info") as
          | { UNMASKED_RENDERER_WEBGL: number }
          | null;
        if (debugInfo && typeof gl.getParameter === "function") {
          gpuInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
        }
      }
    } catch {
      gpuInfo = "";
    }
  }
  // 为避免使用 any，显式声明 userAgentData、hardwareConcurrency、deviceMemory 的类型
  type NavigatorUAData = {
    platform?: string;
  };

  // 由于部分属性为实验性，需类型保护
  const userAgentData: NavigatorUAData | undefined = 
    typeof (nav as Navigator & { userAgentData?: NavigatorUAData }).userAgentData === "object"
      ? (nav as Navigator & { userAgentData?: NavigatorUAData }).userAgentData
      : undefined;

  const hardwareConcurrency: number | undefined =
    typeof (nav as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency === "number"
      ? (nav as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency
      : undefined;

  const deviceMemory: number | undefined =
    typeof (nav as Navigator & { deviceMemory?: number }).deviceMemory === "number"
      ? (nav as Navigator & { deviceMemory?: number }).deviceMemory
      : undefined;

  return {
    操作系统: userAgentData?.platform || nav.platform || "-",
    浏览器: nav.userAgent,
    语言: nav.language,
    CPU线程数: hardwareConcurrency ?? "-",
    内存GB: deviceMemory ?? "-",
    分辨率: `${window.screen.width}x${window.screen.height}`,
    时区: Intl.DateTimeFormat().resolvedOptions().timeZone,
    GPU型号: gpuInfo,
  };
};

export default function SysInfoPage() {
  const [dark, setDark] = usePrefersDarkMode();
  const theme = useTheme(dark);
  const [info, setInfo] = useState<InfoMap>({});
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setInfo(getSysInfo());
  }, []);
  const handleCopy = () => {
    navigator.clipboard.writeText(
      Object.entries(info)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className={`flex flex-col min-h-screen ${theme.bg}`}>
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center">
        <Image src={dark ? '/assets/clipzy-white.png' : '/assets/clipzy.png'} width={80} height={40} alt="Clipzy Logo" className="cursor-pointer" />
        <button onClick={() => setDark(d => !d)} className={theme.btnSecondary}>{dark ? '☀️' : '🌙'}</button>
      </header>
      {/* Main */}
      <main className="flex-1 flex flex-col px-8 pt-6 pb-12 max-w-2xl mx-auto w-full">
        <div className="mb-8 max-w-3xl">
          <h2 className={`${theme.textPrimary} text-4xl font-extralight mb-3`}>系统信息采集</h2>
          <p className={`${theme.textSecondary} text-base`}>自动采集本机可获取的系统/硬件信息，便于远程协助和问题排查</p>
        </div>
        <div className="mb-6">
          <div className="divide-y divide-neutral-200 dark:divide-zinc-700">
            {Object.entries(info).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-3">
                <span className="text-sm text-neutral-400 dark:text-neutral-400">{k}</span>
                <span className="text-sm text-neutral-100 dark:text-neutral-100 break-all text-right">{v as string}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mb-4">
          <button
            className={`px-6 py-2 ${theme.btnPrimary} text-sm`}
            onClick={handleCopy}
          >
            {copied ? "已复制" : "一键复制"}
          </button>
          <a
            href="/downloads/sysinfo.exe"
            download
            className={`px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm`}
          >
            下载Windows采集工具
          </a>
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          <div>本页采集信息仅限浏览器可获取范围，部分硬件信息（如CPU型号、显卡驱动等）需下载采集工具。</div>
          <div>如需更详细信息，可用DxDiag等工具导出后发送给开发者。</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
