import { GeistSans } from 'geist/font/sans';
import "./globals.css";
import { Providers } from './providers';
import { metadata } from './metadata';

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Clipzy",
  "description": "专业的在线剪贴板工具，提供端到端加密的临时文本和代码片段分享服务",
  "url": process.env.NEXT_PUBLIC_BASE_URL || "https://paste.sdjz.wiki",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "creator": {
    "@type": "Person",
    "name": "shuakami",
    "url": "https://github.com/shuakami"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Clipzy"
  },
  "featureList": [
    "端到端加密",
    "临时文本分享",
    "代码片段分享",
    "阅后即焚",
    "定时销毁",
    "无需注册",
    "免费使用"
  ],
  "softwareVersion": "1.0.0",
  "dateModified": new Date().toISOString(),
  "browserRequirements": "现代浏览器支持",
  "availableLanguage": ["zh-CN", "en"],
  "inLanguage": "zh-CN"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        
        {/* DNS prefetch和预连接 */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* 性能和安全相关 */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="origin-when-cross-origin" />
        
        {/* PWA相关 */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Clipzy" />
        
        {/* 主题颜色 */}
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        
        {/* Favicons for light and dark themes */}
        <link rel="icon" href="/clipzy_black.ico" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/clipzy_white.ico" media="(prefers-color-scheme: dark)" />
        {/* Fallback icon */}
        <link rel="icon" href="/clipzy_black.ico" />
        
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/assets/clipzy.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/clipzy.png" />
      </head>
      <body className={`${GeistSans.className} transition-colors duration-300 ease-in-out`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export { metadata };
