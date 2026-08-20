'use client';

/**
 * App-section error boundary. Renders a helpful recovery screen (with a link to
 * /diagnostics) instead of the bare "server-side exception" page when a
 * dashboard route throws.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ maxWidth: 560, margin: '60px auto', padding: 24, fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <h1 style={{ color: '#0b1e3f' }}>Something went wrong loading this page</h1>
      <p style={{ color: '#5b6b86' }}>
        This is almost always a setup step that isn’t finished — usually the database
        migrations haven’t been run, or the admin user row is missing.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
        <a href="/diagnostics" style={{ background: '#1e50e5', color: '#fff', padding: '10px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
          Open diagnostics
        </a>
        <button onClick={() => reset()} style={{ background: '#f4f6fb', color: '#0b1e3f', padding: '10px 18px', borderRadius: 8, border: '1px solid #e4e9f2', fontWeight: 600, cursor: 'pointer' }}>
          Try again
        </button>
      </div>
      {error.digest && (
        <p style={{ color: '#98a6bd', fontSize: 12, marginTop: 16 }}>Reference: {error.digest}</p>
      )}
    </div>
  );
}
