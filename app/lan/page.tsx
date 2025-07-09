'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import Footer from '../../components/Footer';

export default function LanPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center">
        <Link href="/">
          <Image src={isDark ? '/assets/clipzy-white.png' : '/assets/clipzy.png'} width={80} height={40} alt="Clipzy Logo" className="cursor-pointer" />
        </Link>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
            局域网快传
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">Beta</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="max-w-xl">
          <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white">
            即将推出
          </h1>
          <p className="mt-6 text-lg leading-8 text-neutral-600 dark:text-neutral-300">
            我们正在全力开发局域网快传功能。它将允许您在同一网络下的设备之间，以极快的速度、点对点地安全传输任何文本和文件。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/"
              className="rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-4 py-2.5 text-sm font-semibold text-black dark:text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-colors duration-300"
            >
              返回主页
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 