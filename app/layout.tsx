import { GeistSans } from 'geist/font/sans';
import "./globals.css";
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* Favicons for light and dark themes */}
        <link rel="icon" href="/clipzy_black.ico" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/clipzy_white.ico" media="(prefers-color-scheme: dark)" />
        {/* Fallback icon */}
        <link rel="icon" href="/clipzy_black.ico" />
      </head>
      <body className={`${GeistSans.className} transition-colors duration-300 ease-in-out`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}