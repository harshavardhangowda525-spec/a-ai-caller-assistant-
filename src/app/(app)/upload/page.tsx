import { listCampaigns } from '@/server/queries';
import { UploadForm } from './UploadForm';

export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  const campaigns = await listCampaigns();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-brand-navy">Upload Leads</h2>
        <p className="text-sm text-brand-grayText">
          Import a CSV. Rows are validated, normalized, and de-duplicated before import.
        </p>
      </div>
      <UploadForm
        campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
