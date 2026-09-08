import type { Metadata, Viewport } from 'next';
import './globals.css';
import { config } from '@/lib/config';
import { DEFAULT_CONTENT, STATS } from '@/lib/seed-data';

const title = 'Tribal Brew Daily · Specialty Coffee on Church Street, Bengaluru';
const description =
  'Tribal Brew Daily — specialty coffee sourced from tribal farms, brewed with passion on Church Street, Bengaluru. Live music, cozy vibes, fresh food. 4.7★ · 257+ reviews.';

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: title,
    template: '%s · Tribal Brew Daily',
  },
  description,
  keywords: [
    'Tribal Brew Daily',
    'Tribal Brew Church Street',
    'coffee shop Church Street Bengaluru',
    'specialty coffee Church Street',
    'coffee near Church Street Bengaluru',
    'best coffee Church Street',
    'cafe Bengaluru',
  ],
  authors: [{ name: 'Tribal Brew Daily' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: config.siteUrl,
    siteName: 'Tribal Brew Daily',
    title,
    description,
    images: [{ url: '/images/og.jpg', width: 1200, height: 630, alt: 'Tribal Brew Daily' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/images/og.jpg'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#140d09',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CafeOrCoffeeShop',
  name: 'Tribal Brew Daily',
  image: `${config.siteUrl}/images/og.jpg`,
  '@id': config.siteUrl,
  url: config.siteUrl,
  telephone: DEFAULT_CONTENT.phone,
  priceRange: '₹₹',
  servesCuisine: ['Coffee', 'Cafe', 'Desserts'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '16/4, Church St, Haridevpur, Shanthala Nagar, Ashok Nagar',
    addressLocality: 'Bengaluru',
    addressRegion: 'Karnataka',
    postalCode: '560001',
    addressCountry: 'IN',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 12.9749, longitude: 77.6079 },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '23:00',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: STATS.rating,
    reviewCount: 257,
    bestRating: '5',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <style
          // Font-family CSS variables consumed by Tailwind's font-display / font-sans.
          dangerouslySetInnerHTML={{
            __html: `:root{--font-display:'Fraunces';--font-sans:'Inter';}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
