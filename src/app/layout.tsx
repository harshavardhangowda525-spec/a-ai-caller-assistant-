import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liquid Glass — Café & Event OS',
  description:
    'A premium Liquid Glass business operating system for cafés and event companies — POS, billing, events, quotations, invoices, payments and reports.',
};

export const viewport: Viewport = {
  themeColor: '#2f54eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('lg-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
      </head>
      <body>
        <div className="lg-bg" aria-hidden>
          <div className="lg-blob b1 animate-float-slow" />
          <div className="lg-blob b2 animate-float-slower" />
          <div className="lg-blob b3 animate-float-slow" />
          <div className="lg-grain" />
        </div>
        {children}
      </body>
    </html>
  );
}
