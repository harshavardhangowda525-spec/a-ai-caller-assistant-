import type { ReactNode } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { supabaseAdminConfigured } from '@/lib/config';

export const metadata = { title: 'Admin Console', robots: { index: false } };

export default function DashLayout({ children }: { children: ReactNode }) {
  return <AdminShell demo={!supabaseAdminConfigured}>{children}</AdminShell>;
}
