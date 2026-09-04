import type { AppData } from './types';
import { addDays, today } from './format';

// ---------------------------------------------------------------------------
// Seeded demo data for a single business: "Aurora Café & Events".
// Generated relative to the current date so the dashboard always looks live.
// ---------------------------------------------------------------------------

export function buildDemoData(): AppData {
  const t = today();

  const settings: AppData['settings'] = {
    businessName: 'Aurora Café & Events',
    logo: '🌌',
    address: '2nd Floor, Lakeview Arcade, MG Road, Bengaluru 560001',
    phone: '+91 98450 11223',
    email: 'hello@auroracafe.in',
    gstin: '29ABCDE1234F1Z5',
    currency: 'INR',
    invoicePrefix: 'INV-2026-',
    quotePrefix: 'QT-2026-',
    invoiceTerms:
      '1. 50% advance required to confirm the booking.\n2. Balance due before the event date.\n3. Prices are valid for 15 days from the quotation date.',
    invoiceFooter: 'Thank you for choosing Aurora. We look forward to serving you.',
    taxInclusive: false,
    defaultTaxRate: 18,
    taxRates: [
      { id: 'tx0', name: 'GST 0%', rate: 0 },
      { id: 'tx5', name: 'GST 5%', rate: 5 },
      { id: 'tx12', name: 'GST 12%', rate: 12 },
      { id: 'tx18', name: 'GST 18%', rate: 18 },
    ],
    eventTypes: [
      'Wedding',
      'Reception',
      'Birthday',
      'Corporate',
      'Anniversary',
      'Engagement',
      'Conference',
      'Private Party',
    ],
    serviceCategories: ['Venue', 'Food', 'Decor', 'Media', 'Entertainment', 'Logistics', 'Staff'],
  };

  const users: AppData['users'] = [
    { id: 'u1', name: 'Ananya Rao', email: 'ananya@auroracafe.in', role: 'owner', avatar: '👑' },
    { id: 'u2', name: 'Vikram Nair', email: 'vikram@auroracafe.in', role: 'manager', avatar: '🧑‍💼' },
    { id: 'u3', name: 'Priya Das', email: 'priya@auroracafe.in', role: 'cashier', avatar: '💁‍♀️' },
    { id: 'u4', name: 'Karan Mehta', email: 'karan@auroracafe.in', role: 'event_staff', avatar: '🎪' },
  ];

  const categories: AppData['categories'] = [
    { id: 'c_coffee', name: 'Coffee', icon: '☕' },
    { id: 'c_tea', name: 'Tea', icon: '🍵' },
    { id: 'c_snacks', name: 'Snacks', icon: '🥪' },
    { id: 'c_food', name: 'Food', icon: '🍽️' },
    { id: 'c_dessert', name: 'Desserts', icon: '🍰' },
    { id: 'c_bev', name: 'Beverages', icon: '🥤' },
    { id: 'c_other', name: 'Other', icon: '🧺' },
  ];

  const products: AppData['products'] = [
    p('p1', 'Cappuccino', 'c_coffee', 'CFE-001', 180, 55, '☕', 60, 15),
    p('p2', 'Cafe Latte', 'c_coffee', 'CFE-002', 200, 62, '☕', 48, 15),
    p('p3', 'Espresso', 'c_coffee', 'CFE-003', 140, 40, '☕', 80, 20),
    p('p4', 'Cold Brew', 'c_coffee', 'CFE-004', 240, 70, '🧊', 12, 15),
    p('p5', 'Masala Chai', 'c_tea', 'TEA-001', 90, 22, '🍵', 120, 25),
    p('p6', 'Green Tea', 'c_tea', 'TEA-002', 110, 28, '🍵', 40, 15),
    p('p7', 'Lemon Iced Tea', 'c_tea', 'TEA-003', 130, 35, '🧋', 0, 12),
    p('p8', 'Veg Sandwich', 'c_snacks', 'SNK-001', 160, 60, '🥪', 30, 10),
    p('p9', 'French Fries', 'c_snacks', 'SNK-002', 150, 45, '🍟', 25, 10),
    p('p10', 'Samosa (2 pc)', 'c_snacks', 'SNK-003', 70, 20, '🥟', 8, 20),
    p('p11', 'Margherita Pizza', 'c_food', 'FOD-001', 320, 120, '🍕', 18, 8),
    p('p12', 'Pasta Alfredo', 'c_food', 'FOD-002', 340, 130, '🍝', 14, 8),
    p('p13', 'Paneer Wrap', 'c_food', 'FOD-003', 220, 85, '🌯', 22, 10),
    p('p14', 'Chocolate Brownie', 'c_dessert', 'DST-001', 160, 55, '🍫', 20, 10),
    p('p15', 'Cheesecake Slice', 'c_dessert', 'DST-002', 220, 90, '🍰', 6, 8),
    p('p16', 'Tiramisu', 'c_dessert', 'DST-003', 260, 110, '🍮', 10, 6),
    p('p17', 'Fresh Lime Soda', 'c_bev', 'BEV-001', 110, 25, '🥤', 50, 20),
    p('p18', 'Mango Smoothie', 'c_bev', 'BEV-002', 190, 65, '🥭', 16, 10),
    p('p19', 'Sparkling Water', 'c_bev', 'BEV-003', 90, 30, '💧', 35, 12),
    p('p20', 'Gift Hamper', 'c_other', 'OTH-001', 850, 500, '🎁', 5, 3),
  ];

  const tables: AppData['tables'] = [
    { id: 't1', name: 'T1', seats: 2, status: 'occupied', orderId: 'o_open1' },
    { id: 't2', name: 'T2', seats: 2, status: 'available' },
    { id: 't3', name: 'T3', seats: 4, status: 'reserved' },
    { id: 't4', name: 'T4', seats: 4, status: 'occupied', orderId: 'o_open2' },
    { id: 't5', name: 'T5', seats: 4, status: 'available' },
    { id: 't6', name: 'T6', seats: 6, status: 'cleaning' },
    { id: 't7', name: 'T7', seats: 6, status: 'available' },
    { id: 't8', name: 'T8', seats: 2, status: 'available' },
    { id: 't9', name: 'Patio 1', seats: 4, status: 'occupied', orderId: 'o_open3' },
    { id: 't10', name: 'Patio 2', seats: 4, status: 'available' },
    { id: 't11', name: 'Lounge', seats: 8, status: 'reserved' },
    { id: 't12', name: 'Bar', seats: 3, status: 'available' },
  ];

  const customers: AppData['customers'] = [
    cst('cu1', 'Rahul Sharma', '+91 98110 22334', 'rahul.sharma@gmail.com', 'Indiranagar, Bengaluru'),
    cst('cu2', 'Meera Iyer', '+91 99001 55667', 'meera.iyer@gmail.com', 'Koramangala, Bengaluru'),
    cst('cu3', 'Arjun Kapoor', '+91 90080 44556', 'arjun.k@outlook.com', 'Whitefield, Bengaluru'),
    cst('cu4', 'Sana Khan', '+91 97400 88990', 'sana.khan@gmail.com', 'HSR Layout, Bengaluru'),
    cst('cu5', 'Deepak Verma', '+91 98866 11002', 'deepak.verma@yahoo.com', 'Jayanagar, Bengaluru'),
    cst('cu6', 'Nisha Reddy', '+91 96320 77889', 'nisha.reddy@gmail.com', 'Malleshwaram, Bengaluru'),
    cst('cu7', 'TechNova Pvt Ltd', '+91 80410 00011', 'events@technova.io', 'Electronic City, Bengaluru'),
    cst('cu8', 'Fatima Sheikh', '+91 99640 33221', 'fatima.s@gmail.com', 'BTM Layout, Bengaluru'),
  ];

  const packages: AppData['packages'] = [
    {
      id: 'pk1',
      name: 'Essential',
      price: 50000,
      includes: ['Venue (up to 100 guests)', 'Catering — 3 course', 'Basic stage decoration'],
    },
    {
      id: 'pk2',
      name: 'Premium',
      price: 100000,
      featured: true,
      includes: [
        'Venue (up to 250 guests)',
        'Catering — 5 course + live counter',
        'Themed decoration',
        'Photography',
        'Sound system',
      ],
    },
    {
      id: 'pk3',
      name: 'Signature',
      price: 200000,
      includes: [
        'Premium venue (up to 500 guests)',
        'Multi-cuisine catering',
        'Designer decor + floral',
        'Photography + videography',
        'DJ + lighting',
        'Event coordinator',
      ],
    },
  ];

  const services: AppData['services'] = [
    sv('sv1', 'Banquet Venue', 'Venue', 40000),
    sv('sv2', 'Lawn Venue', 'Venue', 60000),
    sv('sv3', 'Catering (per plate)', 'Food', 650),
    sv('sv4', 'Live Counter', 'Food', 15000),
    sv('sv5', 'Stage Decoration', 'Decor', 25000),
    sv('sv6', 'Floral Decor', 'Decor', 18000),
    sv('sv7', 'Photography', 'Media', 20000),
    sv('sv8', 'Videography', 'Media', 25000),
    sv('sv9', 'Sound System', 'Entertainment', 12000),
    sv('sv10', 'Lighting', 'Entertainment', 15000),
    sv('sv11', 'DJ', 'Entertainment', 22000),
    sv('sv12', 'Furniture Rental', 'Logistics', 10000),
    sv('sv13', 'Security (per guard)', 'Staff', 2500),
    sv('sv14', 'Event Staff (per person)', 'Staff', 1500),
    sv('sv15', 'Transportation', 'Logistics', 8000),
  ];

  // --- Café orders --------------------------------------------------------
  const orders: AppData['orders'] = [
    order('o_open1', 'ORD-2041', 'dine-in', 't1', null, [
      li('p1', 'Cappuccino', 2, 180),
      li('p14', 'Chocolate Brownie', 1, 160),
    ], 'open', `${t}T09:20:00`),
    order('o_open2', 'ORD-2042', 'dine-in', 't4', 'cu2', [
      li('p11', 'Margherita Pizza', 1, 320),
      li('p17', 'Fresh Lime Soda', 2, 110),
      li('p9', 'French Fries', 1, 150),
    ], 'open', `${t}T12:05:00`),
    order('o_open3', 'ORD-2043', 'dine-in', 't9', null, [
      li('p5', 'Masala Chai', 3, 90),
      li('p10', 'Samosa (2 pc)', 2, 70),
    ], 'open', `${t}T16:40:00`),
    paidOrder('o_p1', 'ORD-2038', 'dine-in', 'cu1', [li('p2', 'Cafe Latte', 2, 200), li('p15', 'Cheesecake Slice', 1, 220)], `${t}T08:15:00`, 'upi'),
    paidOrder('o_p2', 'ORD-2039', 'takeaway', null, [li('p3', 'Espresso', 1, 140), li('p8', 'Veg Sandwich', 1, 160)], `${t}T10:02:00`, 'cash'),
    paidOrder('o_p3', 'ORD-2040', 'dine-in', 'cu4', [li('p12', 'Pasta Alfredo', 2, 340), li('p18', 'Mango Smoothie', 2, 190)], `${t}T13:30:00`, 'card'),
    paidOrder('o_p4', 'ORD-2035', 'dine-in', null, [li('p11', 'Margherita Pizza', 2, 320), li('p16', 'Tiramisu', 2, 260)], `${addDays(t, -1)}T19:20:00`, 'upi'),
    paidOrder('o_p5', 'ORD-2034', 'takeaway', 'cu5', [li('p1', 'Cappuccino', 4, 180)], `${addDays(t, -1)}T11:10:00`, 'cash'),
    paidOrder('o_p6', 'ORD-2030', 'dine-in', 'cu6', [li('p13', 'Paneer Wrap', 3, 220), li('p17', 'Fresh Lime Soda', 3, 110)], `${addDays(t, -2)}T14:00:00`, 'card'),
    paidOrder('o_p7', 'ORD-2025', 'dine-in', null, [li('p12', 'Pasta Alfredo', 1, 340), li('p2', 'Cafe Latte', 2, 200), li('p14', 'Chocolate Brownie', 2, 160)], `${addDays(t, -3)}T18:45:00`, 'upi'),
  ];

  // --- Events -------------------------------------------------------------
  const events: AppData['events'] = [
    {
      id: 'ev1',
      name: 'Rahul & Priya Wedding Reception',
      type: 'Reception',
      customerId: 'cu1',
      date: addDays(t, 12),
      time: '19:00',
      venue: 'Aurora Grand Banquet',
      guests: 220,
      packageId: 'pk2',
      items: [
        li('pk2', 'Premium Package', 1, 100000),
        li('sv3', 'Catering (extra 40 plates)', 40, 650),
        li('sv7', 'Photography', 1, 20000),
      ],
      discountPct: 5,
      taxRate: 18,
      status: 'confirmed',
      notes: 'Bride prefers pastel floral theme. Welcome drinks at 6:30 PM.',
      createdAt: addDays(t, -20),
    },
    {
      id: 'ev2',
      name: 'TechNova Annual Conference',
      type: 'Corporate',
      customerId: 'cu7',
      date: addDays(t, 5),
      time: '09:30',
      venue: 'Aurora Convention Hall',
      guests: 150,
      packageId: null,
      items: [
        li('sv1', 'Banquet Venue', 1, 40000),
        li('sv3', 'Catering (per plate)', 150, 650),
        li('sv9', 'Sound System', 1, 12000),
        li('sv10', 'Lighting', 1, 15000),
      ],
      discountPct: 0,
      taxRate: 18,
      status: 'confirmed',
      notes: 'AV team on-site by 7 AM. Vegetarian buffet only.',
      createdAt: addDays(t, -14),
    },
    {
      id: 'ev3',
      name: "Aisha's 1st Birthday",
      type: 'Birthday',
      customerId: 'cu4',
      date: t,
      time: '17:00',
      venue: 'Aurora Garden Lawn',
      guests: 60,
      packageId: 'pk1',
      items: [li('pk1', 'Essential Package', 1, 50000), li('sv6', 'Floral Decor', 1, 18000)],
      discountPct: 0,
      taxRate: 18,
      status: 'confirmed',
      notes: 'Jungle theme. Cake at 6 PM.',
      createdAt: addDays(t, -10),
    },
    {
      id: 'ev4',
      name: 'Deepak Engagement',
      type: 'Engagement',
      customerId: 'cu5',
      date: addDays(t, 25),
      time: '18:30',
      venue: 'Aurora Rooftop',
      guests: 90,
      packageId: null,
      items: [li('sv2', 'Lawn Venue', 1, 60000), li('sv3', 'Catering (per plate)', 90, 650), li('sv11', 'DJ', 1, 22000)],
      discountPct: 0,
      taxRate: 18,
      status: 'quoted',
      notes: '',
      createdAt: addDays(t, -3),
    },
    {
      id: 'ev5',
      name: 'Meera Anniversary Dinner',
      type: 'Anniversary',
      customerId: 'cu2',
      date: addDays(t, -8),
      time: '20:00',
      venue: 'Aurora Private Dining',
      guests: 30,
      packageId: null,
      items: [li('sv1', 'Banquet Venue', 1, 40000), li('sv3', 'Catering (per plate)', 30, 650)],
      discountPct: 0,
      taxRate: 18,
      status: 'completed',
      notes: 'Completed successfully.',
      createdAt: addDays(t, -30),
    },
    {
      id: 'ev6',
      name: 'Nisha Private Party',
      type: 'Private Party',
      customerId: 'cu6',
      date: addDays(t, 40),
      time: '21:00',
      venue: 'Aurora Lounge',
      guests: 45,
      packageId: null,
      items: [li('sv1', 'Banquet Venue', 1, 40000), li('sv11', 'DJ', 1, 22000)],
      discountPct: 0,
      taxRate: 18,
      status: 'enquiry',
      notes: 'Awaiting confirmation.',
      createdAt: addDays(t, -1),
    },
  ];

  // --- Quotations ---------------------------------------------------------
  const quotations: AppData['quotations'] = [
    {
      id: 'q1',
      number: 'QT-2026-0009',
      customerId: 'cu5',
      eventId: 'ev4',
      title: 'Deepak Engagement — Quotation',
      items: events[3]!.items,
      discountPct: 0,
      taxRate: 18,
      status: 'sent',
      date: addDays(t, -3),
      validUntil: addDays(t, 12),
      terms: settings.invoiceTerms,
      invoiceId: null,
    },
    {
      id: 'q2',
      number: 'QT-2026-0008',
      customerId: 'cu6',
      eventId: 'ev6',
      title: 'Nisha Private Party — Quotation',
      items: events[5]!.items,
      discountPct: 0,
      taxRate: 18,
      status: 'draft',
      date: addDays(t, -1),
      validUntil: addDays(t, 14),
      terms: settings.invoiceTerms,
      invoiceId: null,
    },
    {
      id: 'q3',
      number: 'QT-2026-0006',
      customerId: 'cu1',
      eventId: 'ev1',
      title: 'Wedding Reception — Quotation',
      items: events[0]!.items,
      discountPct: 5,
      taxRate: 18,
      status: 'converted',
      date: addDays(t, -20),
      validUntil: addDays(t, -5),
      terms: settings.invoiceTerms,
      invoiceId: 'in_ev1',
    },
  ];

  // --- Invoices -----------------------------------------------------------
  const invoices: AppData['invoices'] = [
    {
      id: 'in_ev1',
      number: 'INV-2026-00125',
      kind: 'event',
      customerId: 'cu1',
      eventId: 'ev1',
      orderId: null,
      title: 'Wedding Reception',
      items: events[0]!.items,
      discountPct: 5,
      taxRate: 18,
      status: 'partial',
      date: addDays(t, -18),
      dueDate: addDays(t, 10),
    },
    {
      id: 'in_ev2',
      number: 'INV-2026-00121',
      kind: 'event',
      customerId: 'cu7',
      eventId: 'ev2',
      orderId: null,
      title: 'TechNova Annual Conference',
      items: events[1]!.items,
      discountPct: 0,
      taxRate: 18,
      status: 'partial',
      date: addDays(t, -12),
      dueDate: addDays(t, 3),
    },
    {
      id: 'in_ev3',
      number: 'INV-2026-00118',
      kind: 'event',
      customerId: 'cu2',
      eventId: 'ev5',
      orderId: null,
      title: 'Anniversary Dinner',
      items: events[4]!.items,
      discountPct: 0,
      taxRate: 18,
      status: 'paid',
      date: addDays(t, -28),
      dueDate: addDays(t, -10),
    },
    {
      id: 'in_ev4',
      number: 'INV-2026-00126',
      kind: 'event',
      customerId: 'cu4',
      eventId: 'ev3',
      orderId: null,
      title: "Aisha's 1st Birthday",
      items: events[2]!.items,
      discountPct: 0,
      taxRate: 18,
      status: 'partial',
      date: addDays(t, -9),
      dueDate: t,
    },
  ];

  // --- Payments -----------------------------------------------------------
  const payments: AppData['payments'] = [
    pay('py1', addDays(t, -18), 75000, 'bank', 'in_ev1', 'ev1', 'cu1', 'NEFT-8891', 'Advance — 50%'),
    pay('py2', addDays(t, -12), 60000, 'bank', 'in_ev2', 'ev2', 'cu7', 'NEFT-9921', 'Advance'),
    pay('py3', addDays(t, -26), 141600, 'upi', 'in_ev3', 'ev5', 'cu2', 'UPI-33421', 'Full payment'),
    pay('py4', addDays(t, -9), 30000, 'cash', 'in_ev4', 'ev3', 'cu4', 'CASH', 'Advance'),
    // café payments (from paid orders)
    pay('py5', `${t}T08:15:00`, 620, 'upi', null, null, 'cu1', 'UPI-CAFE-1', 'Café order ORD-2038'),
    pay('py6', `${t}T13:30:00`, 1060, 'card', null, null, 'cu4', 'CARD-CAFE-1', 'Café order ORD-2040'),
  ];

  // --- Expenses -----------------------------------------------------------
  const expenses: AppData['expenses'] = [
    exp('ex1', 'ev1', 'Catering', 'Caterer advance — Royal Feasts', 42000, addDays(t, -10), 'Royal Feasts', 'bank'),
    exp('ex2', 'ev1', 'Decor', 'Floral & stage setup', 22000, addDays(t, -6), 'BloomWorks', 'upi'),
    exp('ex3', 'ev2', 'Food', 'Buffet catering', 55000, addDays(t, -4), 'Spice Route', 'bank'),
    exp('ex4', 'ev2', 'Media', 'AV equipment rental', 9000, addDays(t, -3), 'SoundLab', 'cash'),
    exp('ex5', 'ev5', 'Food', 'Private dining catering', 15000, addDays(t, -12), 'In-house', 'cash'),
    exp('ex6', null, 'Inventory', 'Weekly coffee bean restock', 8500, addDays(t, -2), 'BeanCo', 'upi'),
    exp('ex7', null, 'Utilities', 'Electricity bill', 12400, addDays(t, -5), 'BESCOM', 'bank'),
  ];

  // --- Notifications ------------------------------------------------------
  const notifications: AppData['notifications'] = [
    notif('n1', 'low_stock', 'Low stock alert', 'Cold Brew is below minimum (12 left).', `${t}T09:05:00`, false),
    notif('n2', 'low_stock', 'Out of stock', 'Lemon Iced Tea is out of stock.', `${t}T08:40:00`, false),
    notif('n3', 'event_upcoming', 'Event today', "Aisha's 1st Birthday starts at 5:00 PM.", `${t}T07:30:00`, false),
    notif('n4', 'payment_pending', 'Balance pending', 'Wedding Reception has ₹1,19,700 balance due.', `${addDays(t, -1)}T18:00:00`, true),
    notif('n5', 'quote_accepted', 'Quotation viewed', 'Deepak Engagement quotation was sent.', `${addDays(t, -3)}T11:00:00`, true),
    notif('n6', 'payment_received', 'Payment received', '₹30,000 advance received for Birthday event.', `${addDays(t, -9)}T15:20:00`, true),
  ];

  return {
    users,
    customers,
    categories,
    products,
    tables,
    orders,
    packages,
    services,
    events,
    quotations,
    invoices,
    payments,
    expenses,
    notifications,
    settings,
  };
}

// --- tiny builders ---------------------------------------------------------
function p(id: string, name: string, categoryId: string, sku: string, price: number, cost: number, image: string, stock: number, minStock: number): AppData['products'][number] {
  return { id, name, categoryId, sku, price, cost, image, available: stock > 0, stock, minStock };
}
function cst(id: string, name: string, phone: string, email: string, address: string): AppData['customers'][number] {
  return { id, name, phone, email, address, createdAt: new Date().toISOString() };
}
function sv(id: string, name: string, category: string, unitPrice: number): AppData['services'][number] {
  return { id, name, category, unitPrice };
}
function li(refId: string, name: string, qty: number, price: number): AppData['orders'][number]['items'][number] {
  return { id: `${refId}_${Math.random().toString(36).slice(2, 7)}`, refId, name, qty, price };
}
function order(id: string, number: string, type: AppData['orders'][number]['type'], tableId: string | null, customerId: string | null, items: AppData['orders'][number]['items'], status: AppData['orders'][number]['status'], createdAt: string): AppData['orders'][number] {
  return { id, number, type, tableId, customerId, items, discountPct: 0, taxRate: 5, status, createdAt, paymentMethod: null, invoiceId: null };
}
function paidOrder(id: string, number: string, type: AppData['orders'][number]['type'], customerId: string | null, items: AppData['orders'][number]['items'], createdAt: string, method: AppData['orders'][number]['paymentMethod']): AppData['orders'][number] {
  return { id, number, type, tableId: null, customerId, items, discountPct: 0, taxRate: 5, status: 'paid', createdAt, paymentMethod: method, invoiceId: null };
}
function pay(id: string, date: string, amount: number, method: AppData['payments'][number]['method'], invoiceId: string | null, eventId: string | null, customerId: string | null, reference: string, notes: string): AppData['payments'][number] {
  return { id, date, amount, method, kind: 'in', invoiceId, eventId, customerId, reference, notes };
}
function exp(id: string, eventId: string | null, category: string, description: string, amount: number, date: string, payee: string, method: AppData['expenses'][number]['method']): AppData['expenses'][number] {
  return { id, eventId, category, description, amount, date, payee, method };
}
function notif(id: string, type: AppData['notifications'][number]['type'], title: string, message: string, time: string, read: boolean): AppData['notifications'][number] {
  return { id, type, title, message, time, read };
}
