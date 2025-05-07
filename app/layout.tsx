import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { metadata } from './metadata';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Favicons for light and dark themes */}
        <link rel="icon" href="/clipzy_black.ico" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/clipzy_white.ico" media="(prefers-color-scheme: dark)" />
        {/* Fallback icon */}
        <link rel="icon" href="/clipzy_black.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}

export { metadata };