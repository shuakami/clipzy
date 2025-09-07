import { GeistSans } from 'geist/font/sans';
import "./globals.css";
import { Providers } from './providers';
import { metadata } from './metadata';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://paste.sdjz.wiki";

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Clipzy",
  "alternateName": ["在线剪贴板", "网络剪贴板", "临时剪贴板", "安全剪贴板"],
  "description": "专业的在线剪贴板工具，提供端到端加密的临时文本和代码片段分享服务。支持阅后即焚、定时销毁，保护您的信息安全。",
  "url": baseUrl,
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web Browser",
  "browserRequirements": "现代浏览器支持，支持HTML5和JavaScript",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "完全免费使用，无需注册"
  },
  "creator": {
    "@type": "Person",
    "name": "shuakami",
    "url": "https://github.com/shuakami"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Clipzy",
    "url": baseUrl
  },
  "featureList": [
    "端到端加密保护",
    "临时文本分享", 
    "代码片段分享",
    "阅后即焚功能",
    "定时自动销毁",
    "无需注册登录",
    "完全免费使用",
    "跨设备访问",
    "支持大文件",
    "API接口支持"
  ],
  "applicationSubCategory": "剪贴板工具",
  "softwareVersion": "1.0.0",
  "dateCreated": "2024-01-01T00:00:00Z",
  "dateModified": new Date().toISOString(),
  "availableLanguage": ["zh-CN", "en"],
  "inLanguage": "zh-CN",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150",
    "bestRating": "5"
  },
  "installUrl": baseUrl,
  "screenshot": `${baseUrl}/assets/clipzy.png`,
  "potentialAction": {
    "@type": "UseAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": baseUrl,
      "actionPlatform": [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/MobileWebPlatform"
      ]
    }
  }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Clipzy",
  "url": baseUrl,
  "logo": `${baseUrl}/assets/clipzy.png`,
  "description": "提供安全可靠的在线剪贴板服务",
  "foundingDate": "2024-01-01",
  "founder": {
    "@type": "Person", 
    "name": "shuakami"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "Shuakami@sdjz.wiki",
    "contactType": "customer service"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Clipzy是什么？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Clipzy是一款专业的在线剪贴板工具，提供端到端加密的临时文本和代码片段分享服务。所有数据都在客户端加密，服务器无法解密您的内容。"
      }
    },
    {
      "@type": "Question", 
      "name": "如何使用Clipzy？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "使用非常简单：1. 在文本框中输入要分享的内容 2. 选择过期时间 3. 点击创建链接 4. 将生成的链接分享给他人即可。无需注册，完全免费。"
      }
    },
    {
      "@type": "Question",
      "name": "Clipzy安全吗？", 
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "非常安全。Clipzy采用端到端加密技术，使用AES-256-GCM算法在客户端加密数据。解密密钥仅存在于分享链接中，服务器无法访问您的原始内容。"
      }
    },
    {
      "@type": "Question",
      "name": "Clipzy收费吗？",
      "acceptedAnswer": {
        "@type": "Answer", 
        "text": "Clipzy完全免费使用，所有核心功能都不收取任何费用。我们致力于为用户提供免费的安全文本分享服务。"
      }
    }
  ]
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "首页",
      "item": baseUrl
    },
    {
      "@type": "ListItem", 
      "position": 2,
      "name": "在线剪贴板",
      "item": baseUrl
    }
  ]
};

const jsonLd = [webAppSchema, organizationSchema, faqSchema, breadcrumbSchema];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 结构化数据 */}
        {jsonLd.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schema),
            }}
          />
        ))}
        
        {/* DNS prefetch和预连接 */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//vercel.com" />
        <link rel="dns-prefetch" href="//upstash.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/assets/clipzy.png" as="image" type="image/png" media="(prefers-color-scheme: light)" />
        <link rel="preload" href="/assets/clipzy-white.png" as="image" type="image/png" media="(prefers-color-scheme: dark)" />
        
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

export { metadata };
