'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import Footer from '../../components/Footer'

export default function ChangelogPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const dark = resolvedTheme === 'dark'

  const theme = {
    bg: 'bg-white dark:bg-black',
    textPrimary: 'text-black dark:text-white',
    textSecondary: 'text-neutral-600 dark:text-zinc-400',
    btnSecondary: 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
    border: 'border-neutral-200 dark:border-zinc-700',
  }

  // SVG icons
  const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )

  const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )

  return (
    <div className={`flex flex-col min-h-screen ${theme.bg} ${theme.textPrimary}`}>
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Image src={dark ? '/assets/clipzy-white.png' : '/assets/clipzy.png'} width={80} height={28} alt="Logo" />
        </Link>
        <button 
          onClick={() => setTheme(dark ? 'light' : 'dark')} 
          className={`${theme.btnSecondary} p-2 rounded-md transition-colors duration-300`}
        >
          {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-8 pt-10 pb-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extralight mb-4">更新记录</h1>
          <p className={`${theme.textSecondary} leading-relaxed max-w-prose`}>
            跟踪 Clipzy 的最新功能改进和修复。我们持续优化产品，为您提供更好的使用体验。
          </p>
        </div>

        <hr className={`${theme.border} my-8`} />

        {/* Version 2.1.0 */}
        <div className="mb-10">
          <h2 className="text-2xl font-extralight mt-8 mb-6">v2.1.0 <span className={`text-sm ${theme.textSecondary} font-normal`}>2025-09-07</span></h2>
          <h3 className="text-lg font-medium mb-4">容量提升</h3>
          <ul className="list-disc list-outside pl-5 space-y-2 max-w-prose">
            <li>临时剪切板单次上限提升至 200万字符/8MB</li>
            <li>优化数据压缩算法，提升存储效率</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className={`${theme.textSecondary} mb-4`}>
            想要了解更多功能和使用方法？
          </p>
          <Link 
            href="/"
            className={`${theme.btnSecondary} transition-colors duration-300`}
          >
            返回首页
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
