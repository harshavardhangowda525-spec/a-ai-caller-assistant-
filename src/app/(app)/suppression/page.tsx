import { listSuppression } from '@/server/queries';
import { maskPhone } from '@/lib/phone';
import { SuppressionManager } from './SuppressionManager';

export const dynamic = 'force-dynamic';

interface Row {
  id: string;
  phone_number: string;
  reason: string;
  source: string;
  created_at: string;
}

export default async function SuppressionPage() {
  const rows = (await listSuppression()) as unknown as Row[];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-brand-navy">Suppression List</h2>
        <p className="text-sm text-brand-grayText">
          Permanent do-not-call registry. Numbers here are never dialled, and any matching
          lead is forced to “Do Not Call”.
        </p>
      </div>

      <SuppressionManager
        rows={rows.map((r) => ({
          id: r.id,
          masked: maskPhone(r.phone_number),
          reason: r.reason,
          source: r.source,
          createdAt: r.created_at,
        }))}
      />
    </div>
  );
}
