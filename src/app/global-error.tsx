'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: '#140d09', color: '#f7efe4', fontFamily: 'system-ui' }}>
        <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: 44 }}>☕</div>
            <h1 style={{ marginTop: 12 }}>Something spilled</h1>
            <p style={{ opacity: 0.7, fontSize: 14 }}>An unexpected error occurred. Please try again.</p>
            <button
              onClick={reset}
              style={{
                marginTop: 20,
                padding: '10px 22px',
                borderRadius: 999,
                border: '1px solid rgba(216,138,79,0.5)',
                background: 'linear-gradient(135deg,#d98a4f,#a45a2a)',
                color: '#1a0f09',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
