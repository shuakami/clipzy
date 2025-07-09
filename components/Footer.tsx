'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Footer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('Footer.tsx: Component has mounted on the client.');
  }, []);

  const isDark = resolvedTheme === 'dark';
  console.log(`Footer.tsx: Current resolved theme is: ${resolvedTheme}, isDark: ${isDark}`);

  const textSecondary = isDark ? 'text-neutral-400' : 'text-neutral-500';

  // Prevent hydration mismatch by not rendering until mounted on the client
  if (!mounted) {
    return null;
  }

  return (
    <footer className="px-8 py-6 flex flex-col items-start space-y-4">
      <div className="flex items-center">
        <Image 
          src="/assets/clipzy-r.png" 
          width={70} 
          height={24} 
          alt="Logo" 
          style={{ display: isDark ? 'none' : 'block' }}
        />
        <Image 
          src="/assets/clipzy-white-r.png" 
          width={70} 
          height={24} 
          alt="Logo" 
          style={{ display: isDark ? 'block' : 'none' }}
        />
      </div>
      <div className={`${textSecondary} text-xs flex flex-col space-y-3 mx-1`}>
        <p>End‑to‑end encrypted text sharing tool. © {new Date().getFullYear()} Clipzy.</p>
        <div className="flex items-center space-x-3">
          <Link href="/docs" className={`${textSecondary} hover:underline`}>
            API Docs
          </Link>
          <span>/</span>
          <Link href="/pricing" className={`${textSecondary} hover:underline`}>
            Pricing
          </Link>
          <span>/</span>
          <Link href="/privacy" className={`${textSecondary} hover:underline`}>
            Privacy
          </Link>
          <span>/</span>
          <Link href="/history" className={`${textSecondary} hover:underline`}>
            History
          </Link>
        </div>
      </div>
    </footer>
  );
}