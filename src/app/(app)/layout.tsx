import { StoreProvider } from '@/lib/store';
import { Shell } from '@/components/shell/Shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}
