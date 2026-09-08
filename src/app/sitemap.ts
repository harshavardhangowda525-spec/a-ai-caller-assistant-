import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.siteUrl.replace(/\/$/, '');
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/#menu`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/#events`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/#gallery`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/#about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/#location`, lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
  ];
}
