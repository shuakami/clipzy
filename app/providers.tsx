'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode, useState, useEffect } from 'react';
import { GlobalAnnouncementBar } from '../components/GlobalAnnouncementBar';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; 
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <GlobalAnnouncementBar />
      {children}
    </ThemeProvider>
  );
} 