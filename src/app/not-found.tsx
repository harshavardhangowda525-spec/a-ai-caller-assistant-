import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center px-5">
      <div className="glass grain glass-refract max-w-md rounded-3xl p-10 text-center">
        <div className="text-5xl">☕</div>
        <h1 className="mt-4 font-display text-3xl font-semibold text-cream-100">Off the menu</h1>
        <p className="mt-2 text-sm text-cream-200/70">
          This page has wandered off. Let’s get you back to the brew.
        </p>
        <Link href="/" className="glass-btn glass-btn-primary mt-6 px-6 py-3 text-sm font-semibold">
          Back home
        </Link>
      </div>
    </main>
  );
}
