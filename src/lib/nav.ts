import {
  LayoutDashboard,
  Coffee,
  ReceiptText,
  LayoutGrid,
  Package,
  Boxes,
  Users,
  PartyPopper,
  FileText,
  FileCheck2,
  Wallet,
  Banknote,
  BarChart3,
  CalendarDays,
  Bell,
  Settings,
  Gift,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: 'Overview' | 'Café' | 'Events' | 'Business';
}

export const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Overview' },
  { key: 'pos', label: 'Café POS', href: '/pos', icon: Coffee, group: 'Café' },
  { key: 'orders', label: 'Orders', href: '/orders', icon: ReceiptText, group: 'Café' },
  { key: 'tables', label: 'Tables', href: '/tables', icon: LayoutGrid, group: 'Café' },
  { key: 'products', label: 'Products', href: '/products', icon: Package, group: 'Café' },
  { key: 'inventory', label: 'Inventory', href: '/inventory', icon: Boxes, group: 'Café' },
  { key: 'events', label: 'Events', href: '/events', icon: PartyPopper, group: 'Events' },
  { key: 'quotations', label: 'Quotations', href: '/quotations', icon: FileText, group: 'Events' },
  { key: 'packages', label: 'Packages', href: '/packages', icon: Gift, group: 'Events' },
  { key: 'services', label: 'Services', href: '/services', icon: Sparkles, group: 'Events' },
  { key: 'calendar', label: 'Calendar', href: '/calendar', icon: CalendarDays, group: 'Events' },
  { key: 'expenses', label: 'Expenses', href: '/expenses', icon: Banknote, group: 'Events' },
  { key: 'customers', label: 'Customers', href: '/customers', icon: Users, group: 'Business' },
  { key: 'invoices', label: 'Invoices', href: '/invoices', icon: FileCheck2, group: 'Business' },
  { key: 'payments', label: 'Payments', href: '/payments', icon: Wallet, group: 'Business' },
  { key: 'reports', label: 'Reports', href: '/reports', icon: BarChart3, group: 'Business' },
  { key: 'notifications', label: 'Notifications', href: '/notifications', icon: Bell, group: 'Business' },
  { key: 'settings', label: 'Settings', href: '/settings', icon: Settings, group: 'Business' },
];

export const NAV_GROUPS: NavItem['group'][] = ['Overview', 'Café', 'Events', 'Business'];

// Items promoted to the mobile bottom bar.
export const MOBILE_NAV_KEYS = ['dashboard', 'pos', 'events', 'invoices', 'more'];
