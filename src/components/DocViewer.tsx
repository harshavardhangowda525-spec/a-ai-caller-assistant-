'use client';

import { Printer, Download, Share2, X } from 'lucide-react';
import { InvoiceDoc, type DocProps } from './InvoiceDoc';
import { Btn } from './ui';
import { useStore } from '@/lib/store';

// Full-screen viewer for a printable document with Print / PDF / Share actions.
export function DocViewer({
  open,
  onClose,
  doc,
  extraActions,
}: {
  open: boolean;
  onClose: () => void;
  doc: DocProps | null;
  extraActions?: React.ReactNode;
}) {
  const { toast } = useStore();
  if (!open || !doc) return null;

  const share = async () => {
    const text = `${doc.settings.businessName} — ${doc.number}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: doc.number, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast('Document reference copied', 'success');
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="print-portal fixed inset-0 z-[80] overflow-y-auto scroll-thin bg-black/50 backdrop-blur-sm p-4">
      <div className="no-print sticky top-0 z-10 mx-auto mb-4 flex max-w-[800px] flex-wrap items-center justify-between gap-2 rounded-glass glass px-4 py-3">
        <span className="text-sm font-semibold">{doc.number}</span>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          <Btn variant="glass" onClick={share}><Share2 size={15} /> Share</Btn>
          <Btn variant="glass" onClick={() => { toast('Use "Save as PDF" in the print dialog', 'info'); setTimeout(() => window.print(), 300); }}>
            <Download size={15} /> PDF
          </Btn>
          <Btn variant="primary" onClick={() => window.print()}><Printer size={15} /> Print</Btn>
          <button onClick={onClose} className="btn btn-ghost !p-2 rounded-xl" aria-label="Close"><X size={18} /></button>
        </div>
      </div>
      <InvoiceDoc {...doc} />
      <div className="h-8" />
    </div>
  );
}
