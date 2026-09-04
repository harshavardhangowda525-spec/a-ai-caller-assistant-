'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, UserPlus } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { LineItem, PaymentMethod } from '@/lib/types';
import { computeTotals, inr } from '@/lib/money';
import { uid, today, addDays } from '@/lib/format';
import { nextInvoiceNumber } from '@/lib/numbering';
import { Glass, Btn, Field, Select, Modal, FieldRow, Chip } from './ui';
import { PAYMENT_LABEL } from '@/lib/status';

const STEPS = ['Customer', 'Details', 'Package', 'Pricing', 'Advance', 'Confirm'];

export function EventWizard({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  const { data, mutate, toast, notify } = useStore();
  const [step, setStep] = useState(0);

  // customer
  const [customerId, setCustomerId] = useState('');
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '', address: '' });
  const useNew = customerId === '';

  // details
  const [name, setName] = useState('');
  const [type, setType] = useState(data.settings.eventTypes[0] ?? 'Wedding');
  const [date, setDate] = useState(addDays(today(), 14));
  const [time, setTime] = useState('18:00');
  const [venue, setVenue] = useState('');
  const [guests, setGuests] = useState(100);

  // package + services
  const [packageId, setPackageId] = useState<string>('');
  const [items, setItems] = useState<LineItem[]>([]);

  // pricing
  const [discountPct, setDiscountPct] = useState(0);
  const [taxRate, setTaxRate] = useState(data.settings.defaultTaxRate);

  // advance
  const [advance, setAdvance] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('upi');

  const totals = useMemo(() => computeTotals(items, discountPct, taxRate, { inclusive: data.settings.taxInclusive }), [items, discountPct, taxRate, data.settings.taxInclusive]);

  function reset() {
    setStep(0); setCustomerId(''); setNewCust({ name: '', phone: '', email: '', address: '' });
    setName(''); setType(data.settings.eventTypes[0] ?? 'Wedding'); setDate(addDays(today(), 14));
    setTime('18:00'); setVenue(''); setGuests(100); setPackageId(''); setItems([]);
    setDiscountPct(0); setTaxRate(data.settings.defaultTaxRate); setAdvance(0); setMethod('upi');
  }

  function selectPackage(pid: string) {
    setPackageId(pid);
    const pkg = data.packages.find((p) => p.id === pid);
    setItems((prev) => {
      const withoutPkg = prev.filter((i) => !data.packages.some((p) => p.id === i.refId));
      if (!pkg) return withoutPkg;
      return [{ id: uid('li'), refId: pkg.id, name: `${pkg.name} Package`, qty: 1, price: pkg.price }, ...withoutPkg];
    });
  }
  function addService(sid: string) {
    const s = data.services.find((x) => x.id === sid);
    if (!s) return;
    setItems((prev) => [...prev, { id: uid('li'), refId: s.id, name: s.name, qty: 1, price: s.unitPrice }]);
  }
  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const canNext = () => {
    if (step === 0) return useNew ? newCust.name.trim().length > 0 && newCust.phone.trim().length > 0 : true;
    if (step === 1) return name.trim().length > 0 && venue.trim().length > 0;
    if (step === 2) return items.length > 0;
    return true;
  };

  function finish() {
    const eventId = uid('ev');
    let custId = customerId;
    mutate((d) => {
      if (useNew) {
        custId = uid('cu');
        d.customers.push({ id: custId, ...newCust, createdAt: new Date().toISOString() });
      }
      const confirmed = advance > 0;
      d.events.unshift({
        id: eventId, name, type, customerId: custId, date, time, venue, guests,
        packageId: packageId || null, items, discountPct, taxRate,
        status: confirmed ? 'confirmed' : 'quoted', notes: '', createdAt: new Date().toISOString(),
      });

      const invId = uid('in');
      const invNo = nextInvoiceNumber(d);
      d.invoices.unshift({
        id: invId, number: invNo, kind: 'event', customerId: custId, eventId, orderId: null,
        title: name, items, discountPct, taxRate,
        status: advance >= totals.total ? 'paid' : advance > 0 ? 'partial' : 'unpaid',
        date: today(), dueDate: date,
      });

      if (advance > 0) {
        d.payments.unshift({
          id: uid('py'), date: new Date().toISOString(), amount: advance, method, kind: 'in',
          invoiceId: invId, eventId, customerId: custId, reference: method.toUpperCase(), notes: 'Advance payment',
        });
      }
    });
    notify({ type: 'event_upcoming', title: 'New event booked', message: `${name} on ${date}` });
    toast('Event created 🎉', 'success');
    onCreated?.(eventId);
    reset();
    onClose();
  }

  const cust = useNew ? newCust : data.customers.find((c) => c.id === customerId);

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      wide
      title="Create event"
      footer={
        <div className="flex w-full items-center justify-between">
          <Btn variant="ghost" onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}>
            <ChevronLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
          </Btn>
          {step < STEPS.length - 1 ? (
            <Btn variant="primary" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>Next <ChevronRight size={16} /></Btn>
          ) : (
            <Btn variant="primary" onClick={finish}><Check size={16} /> Create event</Btn>
          )}
        </div>
      }
    >
      {/* Stepper */}
      <div className="mb-5 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={clsx('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition', i === step ? 'bg-brand text-white' : i < step ? 'text-good' : 'text-ink-faint')}>
              <span className={clsx('grid h-5 w-5 place-items-center rounded-full text-[10px]', i === step ? 'bg-white/25' : i < step ? 'bg-good/20' : 'glass-2')}>
                {i < step ? <Check size={11} /> : i + 1}
              </span>
              {s}
            </div>
            {i < STEPS.length - 1 && <div className="h-px w-3 bg-glass-border/50" />}
          </div>
        ))}
      </div>

      <div className="min-h-[320px]">
        {/* Step 0: Customer */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-up">
            <FieldRow label="Existing customer">
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">➕ New customer</option>
                {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
              </Select>
            </FieldRow>
            {useNew && (
              <div className="grid grid-cols-2 gap-3 rounded-glass glass-2 p-3">
                <div className="col-span-2 flex items-center gap-2 text-sm font-semibold text-brand"><UserPlus size={15} /> New customer</div>
                <FieldRow label="Name"><Field value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} /></FieldRow>
                <FieldRow label="Phone"><Field value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} /></FieldRow>
                <FieldRow label="Email"><Field value={newCust.email} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} /></FieldRow>
                <FieldRow label="Address"><Field value={newCust.address} onChange={(e) => setNewCust({ ...newCust, address: e.target.value })} /></FieldRow>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3 animate-fade-up">
            <FieldRow label="Event name" className="col-span-2"><Field value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul & Priya Wedding" /></FieldRow>
            <FieldRow label="Event type">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {data.settings.eventTypes.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </FieldRow>
            <FieldRow label="Guests"><Field type="number" value={guests} onChange={(e) => setGuests(+e.target.value || 0)} /></FieldRow>
            <FieldRow label="Date"><Field type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FieldRow>
            <FieldRow label="Time"><Field type="time" value={time} onChange={(e) => setTime(e.target.value)} /></FieldRow>
            <FieldRow label="Venue" className="col-span-2"><Field value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Aurora Grand Banquet" /></FieldRow>
          </div>
        )}

        {/* Step 2: Package + services */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-up">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {data.packages.map((pk) => (
                <button key={pk.id} onClick={() => selectPackage(packageId === pk.id ? '' : pk.id)} className={clsx('glass rounded-glass p-3 text-left transition', packageId === pk.id ? 'ring-2 ring-brand' : 'glass-hover')}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{pk.name}</span>
                    {pk.featured && <Chip tone="brand">Popular</Chip>}
                  </div>
                  <div className="text-lg font-bold text-brand">{inr(pk.price)}</div>
                  <div className="mt-1 text-[11px] text-ink-faint">{pk.includes.length} inclusions</div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Select onChange={(e) => { addService(e.target.value); e.target.value = ''; }} defaultValue="">
                <option value="" disabled>➕ Add a service…</option>
                {data.services.map((s) => <option key={s.id} value={s.id}>{s.name} · {inr(s.unitPrice)}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-2 rounded-xl glass-2 p-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.name}</span>
                  <Field type="number" value={i.qty} onChange={(e) => updateItem(i.id, { qty: Math.max(1, +e.target.value || 1) })} className="w-16 !py-1 text-center" />
                  <Field type="number" value={i.price} onChange={(e) => updateItem(i.id, { price: +e.target.value || 0 })} className="w-24 !py-1 text-right" />
                  <span className="w-24 text-right text-sm font-semibold">{inr(i.qty * i.price)}</span>
                  <button onClick={() => removeItem(i.id)} className="text-ink-faint hover:text-bad"><Trash2 size={14} /></button>
                </div>
              ))}
              {!items.length && <p className="py-6 text-center text-sm text-ink-faint">Select a package or add services.</p>}
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-up">
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Discount %"><Field type="number" value={discountPct} onChange={(e) => setDiscountPct(Math.max(0, Math.min(100, +e.target.value || 0)))} /></FieldRow>
              <FieldRow label="GST">
                <Select value={taxRate} onChange={(e) => setTaxRate(+e.target.value)}>
                  {data.settings.taxRates.map((r) => <option key={r.id} value={r.rate}>{r.name}</option>)}
                </Select>
              </FieldRow>
            </div>
            <Glass className="p-4">
              <TotalsSummary totals={totals} discountPct={discountPct} taxRate={taxRate} />
            </Glass>
          </div>
        )}

        {/* Step 4: Advance */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-up">
            <div className="rounded-glass glass-2 p-4 text-center">
              <div className="text-xs text-ink-faint">Grand total</div>
              <div className="text-2xl font-bold text-gradient">{inr(totals.total)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Advance amount (₹)"><Field type="number" value={advance} onChange={(e) => setAdvance(Math.max(0, Math.min(totals.total, +e.target.value || 0)))} /></FieldRow>
              <FieldRow label="Method">
                <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                  {(['cash', 'upi', 'card', 'bank', 'other'] as PaymentMethod[]).map((m) => <option key={m} value={m}>{PAYMENT_LABEL[m]}</option>)}
                </Select>
              </FieldRow>
            </div>
            <div className="flex flex-wrap gap-2">
              {[25, 50, 100].map((pct) => (
                <button key={pct} onClick={() => setAdvance(Math.round((totals.total * pct) / 100))} className="btn btn-glass !py-1.5 text-xs">{pct}%</button>
              ))}
            </div>
            {advance > 0 && <p className="text-sm text-good">Balance after advance: <b>{inr(totals.total - advance)}</b></p>}
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="space-y-3 animate-fade-up">
            <Glass className="p-4">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <Info label="Customer" value={cust?.name || '—'} />
                <Info label="Phone" value={(cust as any)?.phone || '—'} />
                <Info label="Event" value={name} />
                <Info label="Type" value={type} />
                <Info label="Date" value={`${date} ${time}`} />
                <Info label="Venue" value={venue} />
                <Info label="Guests" value={String(guests)} />
                <Info label="Items" value={`${items.length} lines`} />
              </div>
            </Glass>
            <Glass className="p-4">
              <TotalsSummary totals={totals} discountPct={discountPct} taxRate={taxRate} />
              {advance > 0 && (
                <div className="mt-2 flex justify-between border-t border-glass-border/40 pt-2 text-sm">
                  <span className="text-ink-faint">Advance ({PAYMENT_LABEL[method]})</span>
                  <span className="font-semibold text-good">{inr(advance)}</span>
                </div>
              )}
            </Glass>
            <p className="text-center text-xs text-ink-faint">An event invoice will be generated automatically.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function TotalsSummary({ totals, discountPct, taxRate }: { totals: ReturnType<typeof computeTotals>; discountPct: number; taxRate: number }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between"><span className="text-ink-faint">Subtotal</span><span>{inr(totals.gross)}</span></div>
      {totals.discount > 0 && <div className="flex justify-between text-good"><span>Discount ({discountPct}%)</span><span>- {inr(totals.discount)}</span></div>}
      <div className="flex justify-between"><span className="text-ink-faint">GST ({taxRate}%)</span><span>{inr(totals.tax)}</span></div>
      <div className="flex justify-between border-t border-glass-border/40 pt-1.5 text-base font-bold"><span>Total</span><span className="text-gradient">{inr(totals.total)}</span></div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
