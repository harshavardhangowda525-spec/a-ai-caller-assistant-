'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AppData, Mode, Notification, Role, Theme } from './types';
import { buildDemoData } from './demoData';
import { uid } from './format';

const DATA_KEY = 'lg-data-v2';
const THEME_KEY = 'lg-theme';
const PREF_KEY = 'lg-prefs-v1';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface Prefs {
  mode: Mode;
  currentUserId: string;
}

interface StoreValue {
  data: AppData;
  ready: boolean;
  mutate: (recipe: (draft: AppData) => void) => void;
  resetDemo: () => void;
  clearData: () => void;
  // ui
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  role: Role;
  toasts: Toast[];
  toast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
  notify: (n: Omit<Notification, 'id' | 'time' | 'read'>) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function clone<T>(v: T): T {
  if (typeof structuredClone === 'function') return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => buildDemoData());
  const [ready, setReady] = useState(false);
  const [theme, setThemeState] = useState<Theme>('light');
  const [mode, setModeState] = useState<Mode>('cafe');
  const [currentUserId, setCurrentUserIdState] = useState<string>('u1');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    try {
      const th = (localStorage.getItem(THEME_KEY) as Theme) || 'light';
      setThemeState(th === 'dark' ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    try {
      const p = localStorage.getItem(PREF_KEY);
      if (p) {
        const prefs: Prefs = JSON.parse(p);
        if (prefs.mode) setModeState(prefs.mode);
        if (prefs.currentUserId) setCurrentUserIdState(prefs.currentUserId);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // Persist data (debounced).
  useEffect(() => {
    if (!ready) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(data));
      } catch {
        /* quota / private mode — ignore */
      }
    }, 250);
  }, [data, ready]);

  // Persist prefs.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({ mode, currentUserId } satisfies Prefs));
    } catch {
      /* ignore */
    }
  }, [mode, currentUserId, ready]);

  const mutate = useCallback((recipe: (draft: AppData) => void) => {
    setData((prev) => {
      const draft = clone(prev);
      recipe(draft);
      return draft;
    });
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const setMode = useCallback((m: Mode) => setModeState(m), []);
  const setCurrentUserId = useCallback((id: string) => setCurrentUserIdState(id), []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: Toast['type'] = 'success') => {
      const id = uid('t');
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismissToast(id), 3200);
    },
    [dismissToast],
  );

  const notify = useCallback(
    (n: Omit<Notification, 'id' | 'time' | 'read'>) => {
      mutate((d) => {
        d.notifications.unshift({ ...n, id: uid('n'), time: new Date().toISOString(), read: false });
      });
    },
    [mutate],
  );

  const resetDemo = useCallback(() => {
    const fresh = buildDemoData();
    setData(fresh);
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(fresh));
    } catch {
      /* ignore */
    }
    toast('Demo data restored', 'success');
  }, [toast]);

  const clearData = useCallback(() => {
    const empty = buildDemoData();
    // wipe transactional collections but keep settings + catalog
    empty.orders = [];
    empty.events = [];
    empty.quotations = [];
    empty.invoices = [];
    empty.payments = [];
    empty.expenses = [];
    empty.notifications = [];
    empty.customers = [];
    empty.tables = empty.tables.map((t) => ({ ...t, status: 'available', orderId: null }));
    setData(empty);
    toast('Demo transactions cleared', 'info');
  }, [toast]);

  const role: Role = useMemo(
    () => data.users.find((u) => u.id === currentUserId)?.role ?? 'owner',
    [data.users, currentUserId],
  );

  const value: StoreValue = {
    data,
    ready,
    mutate,
    resetDemo,
    clearData,
    theme,
    setTheme,
    toggleTheme,
    mode,
    setMode,
    currentUserId,
    setCurrentUserId,
    role,
    toasts,
    toast,
    dismissToast,
    notify,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// --- Role-based access helpers --------------------------------------------
export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner / Admin',
  manager: 'Manager',
  cashier: 'Cashier',
  event_staff: 'Event Staff',
};

// Which nav keys each role may access.
const ROLE_ACCESS: Record<Role, string[] | 'all'> = {
  owner: 'all',
  manager: [
    'dashboard', 'pos', 'orders', 'tables', 'products', 'inventory', 'customers',
    'events', 'quotations', 'packages', 'services', 'invoices', 'payments', 'expenses',
    'reports', 'calendar', 'notifications', 'settings',
  ],
  cashier: ['dashboard', 'pos', 'orders', 'tables', 'payments', 'invoices', 'customers', 'notifications'],
  event_staff: ['dashboard', 'events', 'quotations', 'packages', 'services', 'customers', 'calendar', 'invoices', 'notifications'],
};

export function canAccess(role: Role, key: string): boolean {
  const acc = ROLE_ACCESS[role];
  return acc === 'all' || acc.includes(key);
}
