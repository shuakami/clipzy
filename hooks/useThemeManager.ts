import { useState, useEffect, useMemo } from 'react';

export function usePrefersDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const fn = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return [dark, setDark] as const;
}

export function useTheme(dark: boolean) {
  return useMemo(() => ({
    bg: dark ? 'bg-black text-white' : 'bg-white text-black',
    border: dark ? 'border-zinc-700' : 'border-neutral-200',
    inputBg: dark ? 'bg-zinc-900' : 'bg-white',
    btnPrimary: dark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-neutral-100 text-black hover:bg-neutral-200',
    btnSecondary: dark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-800',
    textPrimary: dark ? 'text-white' : 'text-black',
    textSecondary: dark ? 'text-neutral-400' : 'text-neutral-500',
    success: 'text-blue-500',
    error: dark ? 'text-red-400' : 'text-red-500'
  }), [dark]);
} 