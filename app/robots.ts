import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://paste.sdjz.wiki'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/docs',
          '/pricing', 
          '/privacy',
          '/lan'
        ],
        disallow: [
          '/history',
          '/api/',
          '/*#*'
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: ['Baiduspider', 'Sogou web spider', '360Spider'],
        allow: '/',
        crawlDelay: 2,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}