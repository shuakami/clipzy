import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const theme = {
    bg: 'bg-white dark:bg-black',
    textPrimary: 'text-black dark:text-white', 
    textSecondary: 'text-neutral-600 dark:text-zinc-400',
    link: 'text-blue-600 dark:text-blue-400 hover:underline',
    border: 'border-neutral-200 dark:border-zinc-700',
  };

  return (
    <footer className="px-8 py-6 flex flex-col items-start space-y-4">
      <div className="flex items-center">
        <Image 
          src="/assets/clipzy.png" 
          width={70} 
          height={24} 
          alt="Logo" 
          className="dark:hidden" 
        />
        <Image 
          src="/assets/clipzy-white.png" 
          width={70} 
          height={24} 
          alt="Logo" 
          className="hidden dark:block" 
        />
      </div>
      <div className={`${theme.textSecondary} text-xs flex flex-col space-y-3 mx-1`}>
        <p>End‑to‑end encrypted text sharing tool. © {new Date().getFullYear()} Clipzy.</p>
        <div className="flex items-center space-x-3">
          <Link href="/docs" className={`${theme.textSecondary} hover:underline`}>
            API Docs
          </Link>
          <span>/</span>
          <Link href="/pricing" className={`${theme.textSecondary} hover:underline`}>
            Pricing
          </Link>
          <span>/</span>
          <Link href="/privacy" className={`${theme.textSecondary} hover:underline`}>
            Privacy
          </Link>
          <span>/</span>
          <Link href="/history" className={`${theme.textSecondary} hover:underline`}>
            History
          </Link>
        </div>
      </div>
    </footer>
  );
}