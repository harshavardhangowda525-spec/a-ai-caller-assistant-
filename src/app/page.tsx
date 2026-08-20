import { redirect } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export default function Home() {
  if (!isSupabaseConfigured()) redirect('/dashboard'); // renders SetupScreen
  redirect('/dashboard');
}
