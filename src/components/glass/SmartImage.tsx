'use client';

import { useState } from 'react';

/**
 * Resilient image: always sits on a warm coffee gradient so the layout reads
 * as intentional even before an image loads or if one is missing. The admin
 * can swap the underlying file at any time.
 */
export default function SmartImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-espresso-700 via-espresso-800 to-espresso-950 ${className}`}
    >
      {!errored && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`h-full w-full object-cover transition-all duration-700 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          } ${imgClassName}`}
        />
      )}
      {(errored || !loaded) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-4xl opacity-20">☕</span>
        </div>
      )}
    </div>
  );
}
