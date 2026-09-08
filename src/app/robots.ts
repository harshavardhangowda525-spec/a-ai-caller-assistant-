import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const base = config.siteUrl.replace(/\/$/, '');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
