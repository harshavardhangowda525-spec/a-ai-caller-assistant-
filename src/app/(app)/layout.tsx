import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { SetupScreen } from '@/components/SetupScreen';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getConfig } from '@/lib/config';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return <SetupScreen />;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const provider = getConfig().telephony.provider;
  const providerLabel =
    provider === 'mock'
      ? 'Telephony: MOCK (dev)'
      : `Telephony: ${provider.toUpperCase()}`;

  return (
    <div className="min-h-screen bg-brand-gray">
      <Sidebar />
      <div className="lg:pl-64">
        <TopNav title="Infinity AI Caller" email={user.email} providerLabel={providerLabel} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
