'use client';

import { useState } from 'react';
import { Building2, FileText, Coffee, PartyPopper, Users, Percent, Database, Plus, X, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useStore, ROLE_LABELS } from '@/lib/store';
import type { Settings, Role } from '@/lib/types';
import { inr } from '@/lib/money';
import { uid, initials } from '@/lib/format';
import { Glass, Btn, Chip, Field, Select, TextArea, PageTitle, FieldRow, Label, ConfirmDialog } from '@/components/ui';

const TABS = [
  { key: 'business', label: 'Business', icon: Building2 },
  { key: 'invoice', label: 'Invoice', icon: FileText },
  { key: 'cafe', label: 'Café', icon: Coffee },
  { key: 'events', label: 'Events', icon: PartyPopper },
  { key: 'users', label: 'Users & Roles', icon: Users },
  { key: 'tax', label: 'GST / Tax', icon: Percent },
  { key: 'data', label: 'Data', icon: Database },
];

export default function SettingsPage() {
  const { data, mutate, toast, resetDemo, clearData } = useStore();
  const [tab, setTab] = useState('business');
  const [draft, setDraft] = useState<Settings>(() => structuredClone(data.settings));
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setDraft((d) => ({ ...d, [k]: v }));
  function save() {
    mutate((d) => { d.settings = draft; });
    toast('Settings saved', 'success');
  }

  const listEditor = (key: 'eventTypes' | 'serviceCategories', label: string, placeholder: string) => (
    <ChipList
      label={label}
      values={draft[key]}
      onAdd={(v) => set(key, [...draft[key], v])}
      onRemove={(i) => set(key, draft[key].filter((_, x) => x !== i))}
      placeholder={placeholder}
    />
  );

  return (
    <div>
      <PageTitle title="Settings" subtitle="Configure your business" icon="⚙️" actions={tab !== 'data' && tab !== 'users' ? <Btn variant="primary" onClick={save}>Save changes</Btn> : undefined} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px,1fr]">
        <Glass className="h-fit p-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={clsx('flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition', tab === t.key ? 'bg-brand/15 text-brand' : 'text-ink-soft hover:bg-ink/5')}>
                <Icon size={17} /> {t.label}
              </button>
            );
          })}
        </Glass>

        <Glass className="p-5">
          {tab === 'business' && (
            <Section title="Business profile">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-accent text-2xl">{draft.logo}</span>
                <FieldRow label="Logo emoji"><Field value={draft.logo} onChange={(e) => set('logo', e.target.value)} className="w-24" maxLength={2} /></FieldRow>
              </div>
              <FieldRow label="Business name"><Field value={draft.businessName} onChange={(e) => set('businessName', e.target.value)} /></FieldRow>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Phone"><Field value={draft.phone} onChange={(e) => set('phone', e.target.value)} /></FieldRow>
                <FieldRow label="Email"><Field value={draft.email} onChange={(e) => set('email', e.target.value)} /></FieldRow>
              </div>
              <FieldRow label="Address"><TextArea rows={2} value={draft.address} onChange={(e) => set('address', e.target.value)} /></FieldRow>
              <FieldRow label="GSTIN"><Field value={draft.gstin} onChange={(e) => set('gstin', e.target.value)} /></FieldRow>
            </Section>
          )}

          {tab === 'invoice' && (
            <Section title="Invoice settings">
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Invoice prefix"><Field value={draft.invoicePrefix} onChange={(e) => set('invoicePrefix', e.target.value)} /></FieldRow>
                <FieldRow label="Quotation prefix"><Field value={draft.quotePrefix} onChange={(e) => set('quotePrefix', e.target.value)} /></FieldRow>
              </div>
              <FieldRow label="Terms & conditions"><TextArea rows={4} value={draft.invoiceTerms} onChange={(e) => set('invoiceTerms', e.target.value)} /></FieldRow>
              <FieldRow label="Footer note"><Field value={draft.invoiceFooter} onChange={(e) => set('invoiceFooter', e.target.value)} /></FieldRow>
            </Section>
          )}

          {tab === 'cafe' && (
            <Section title="Café configuration">
              <div>
                <Label>Menu categories</Label>
                <div className="flex flex-wrap gap-2">
                  {data.categories.map((c) => <Chip key={c.id} tone="brand">{c.icon} {c.name}</Chip>)}
                </div>
                <p className="mt-2 text-xs text-ink-faint">{data.products.length} products across {data.categories.length} categories. Manage products in the Products page.</p>
              </div>
              <div className="rounded-glass glass-2 p-3">
                <div className="flex items-center justify-between text-sm"><span className="text-ink-faint">Tables configured</span><b>{data.tables.length}</b></div>
                <div className="mt-1 flex items-center justify-between text-sm"><span className="text-ink-faint">Default café GST</span><b>5%</b></div>
              </div>
            </Section>
          )}

          {tab === 'events' && (
            <Section title="Event configuration">
              {listEditor('eventTypes', 'Event types', 'Add event type…')}
              {listEditor('serviceCategories', 'Service categories', 'Add service category…')}
              <div className="rounded-glass glass-2 p-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-ink-faint">Packages</span><b>{data.packages.length}</b></div>
                <div className="mt-1 flex items-center justify-between"><span className="text-ink-faint">Services</span><b>{data.services.length}</b></div>
              </div>
            </Section>
          )}

          {tab === 'users' && (
            <Section title="Users & roles">
              <div className="space-y-2">
                {data.users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-glass glass-2 p-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-accent text-white">{u.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-ink-faint">{u.email}</div>
                    </div>
                    <Select value={u.role} onChange={(e) => mutate((d) => { const x = d.users.find((z) => z.id === u.id); if (x) x.role = e.target.value as Role; })} className="w-40">
                      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </Select>
                  </div>
                ))}
              </div>
              <div className="rounded-glass glass-2 p-3 text-xs text-ink-faint">
                <p className="mb-1 font-semibold text-ink-soft">Role permissions</p>
                <p>• <b>Owner/Admin</b> — full access to everything.</p>
                <p>• <b>Manager</b> — operations, reports, customers, events & billing.</p>
                <p>• <b>Cashier</b> — café POS, orders & payments.</p>
                <p>• <b>Event Staff</b> — events, customers, quotations & event info.</p>
                <p className="mt-1">Switch the active role from the profile menu (top-right) to preview access.</p>
              </div>
              <AddUser onAdd={(name, email, role) => mutate((d) => d.users.push({ id: uid('u'), name, email, role, avatar: '🙂' }))} />
            </Section>
          )}

          {tab === 'tax' && (
            <Section title="GST / Tax configuration">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.taxInclusive} onChange={(e) => set('taxInclusive', e.target.checked)} className="h-4 w-4 accent-[rgb(var(--brand))]" />
                Prices are tax-inclusive
              </label>
              <FieldRow label="Default GST rate (%)"><Field type="number" value={draft.defaultTaxRate} onChange={(e) => set('defaultTaxRate', +e.target.value || 0)} className="w-32" /></FieldRow>
              <div>
                <Label>Tax rates</Label>
                <div className="space-y-2">
                  {draft.taxRates.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-2 rounded-lg glass-2 p-2">
                      <Field value={r.name} onChange={(e) => set('taxRates', draft.taxRates.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="flex-1" />
                      <Field type="number" value={r.rate} onChange={(e) => set('taxRates', draft.taxRates.map((x, j) => j === i ? { ...x, rate: +e.target.value || 0 } : x))} className="w-24" />
                      <button onClick={() => set('taxRates', draft.taxRates.filter((_, j) => j !== i))} className="text-ink-faint hover:text-bad"><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <Btn variant="glass" className="mt-2" onClick={() => set('taxRates', [...draft.taxRates, { id: uid('tx'), name: 'New rate', rate: 0 }])}><Plus size={15} /> Add rate</Btn>
              </div>
              <p className="text-xs text-ink-faint">CGST + SGST split is applied automatically for intra-state sales. Configure IGST per invoice for inter-state.</p>
            </Section>
          )}

          {tab === 'data' && (
            <Section title="Demo data">
              <p className="text-sm text-ink-soft">This app runs on an in-browser demo store (saved to your browser). Use these tools to manage it.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-glass glass-2 p-4">
                  <div className="font-semibold">Reset demo data</div>
                  <p className="my-2 text-xs text-ink-faint">Restore the full sample menu, customers, events, invoices and payments.</p>
                  <Btn variant="glass" onClick={() => setConfirmReset(true)}>Reset to demo</Btn>
                </div>
                <div className="rounded-glass glass-2 p-4">
                  <div className="font-semibold">Clear transactions</div>
                  <p className="my-2 text-xs text-ink-faint">Remove all orders, events, invoices, payments & customers. Keeps menu & settings.</p>
                  <Btn variant="danger" onClick={() => setConfirmClear(true)}><Trash2 size={15} /> Clear data</Btn>
                </div>
              </div>
              <div className="rounded-glass glass-2 p-4 text-sm">
                <div className="mb-2 font-semibold">Current data snapshot</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-ink-soft sm:grid-cols-3">
                  <Snap label="Products" v={data.products.length} />
                  <Snap label="Customers" v={data.customers.length} />
                  <Snap label="Orders" v={data.orders.length} />
                  <Snap label="Events" v={data.events.length} />
                  <Snap label="Invoices" v={data.invoices.length} />
                  <Snap label="Payments" v={data.payments.length} />
                  <Snap label="Expenses" v={data.expenses.length} />
                  <Snap label="Quotations" v={data.quotations.length} />
                  <Snap label="Revenue" v={inr(data.payments.reduce((s, p) => s + p.amount, 0))} />
                </div>
              </div>
            </Section>
          )}
        </Glass>
      </div>

      <ConfirmDialog open={confirmReset} title="Reset demo data?" message="This replaces all current data with fresh sample data." confirmLabel="Reset" onConfirm={resetDemo} onClose={() => setConfirmReset(false)} />
      <ConfirmDialog open={confirmClear} title="Clear all transactions?" message="Orders, events, invoices, payments and customers will be permanently removed." confirmLabel="Clear all" danger onConfirm={clearData} onClose={() => setConfirmClear(false)} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <div className="max-w-2xl space-y-4">{children}</div>
    </div>
  );
}
function Snap({ label, v }: { label: string; v: number | string }) {
  return <div className="flex justify-between"><span className="text-ink-faint">{label}</span><b className="text-ink">{v}</b></div>;
}
function ChipList({ label, values, onAdd, onRemove, placeholder }: { label: string; values: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder: string }) {
  const [v, setV] = useState('');
  return (
    <div>
      <Label>{label}</Label>
      <div className="mb-2 flex flex-wrap gap-2">
        {values.map((val, i) => (
          <span key={i} className="chip text-ink-soft bg-ink/8 border-ink/12">{val}<button onClick={() => onRemove(i)} className="hover:text-bad"><X size={12} /></button></span>
        ))}
      </div>
      <div className="flex gap-2">
        <Field value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === 'Enter' && v.trim()) { onAdd(v.trim()); setV(''); } }} />
        <Btn variant="glass" onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(''); } }}><Plus size={15} /></Btn>
      </div>
    </div>
  );
}
function AddUser({ onAdd }: { onAdd: (name: string, email: string, role: Role) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('cashier');
  const { toast } = useStore();
  return (
    <div className="rounded-glass glass-2 p-3">
      <div className="mb-2 text-sm font-semibold">Add user</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <Field value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <Field value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </Select>
        <Btn variant="primary" onClick={() => { if (!name.trim()) { toast('Name required', 'error'); return; } onAdd(name, email, role); setName(''); setEmail(''); toast('User added', 'success'); }}>Add</Btn>
      </div>
    </div>
  );
}
