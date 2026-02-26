'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  department: string;
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  sales_admin: 'Sales Admin',
  drafter: 'Drafter',
  purchasing: 'Purchasing',
  cnc_operator: 'CNC Operator',
  milling_operator: 'Milling Operator',
  fab_operator: 'Fab Operator',
  qc: 'QC',
  delivery: 'Delivery',
  finance: 'Finance',
};

// Theme options - synced with lib/themes/color-palette-engine.ts
const themeOptions = [
  { key: 'ocean-flame', name: 'Ocean Flame', primary: '#219ebc', accent: '#fb8500' },
  { key: 'midnight-ember', name: 'Midnight Ember', primary: '#14213d', accent: '#fca311' },
  { key: 'teal-gold-luxe', name: 'Teal Gold Luxe', primary: '#004643', accent: '#d1ac00' },
  { key: 'warm-ivory', name: 'Warm Ivory', primary: '#beb7a4', accent: '#ff7f11' },
] as const;

type ThemeKey = typeof themeOptions[number]['key'];

const THEME_STORAGE_KEY = 'lacakpo-theme';

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('ocean-flame');

  // Reset dataset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeKey | null;
    if (stored && themeOptions.some(t => t.key === stored)) {
      setCurrentTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      document.documentElement.setAttribute('data-theme', 'ocean-flame');
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users?public=true');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    users.forEach(user => {
      depts.add(roleLabels[user.role] || user.department);
    });
    return Array.from(depts).sort();
  }, [users]);

  // Get users for selected department
  const usersInDept = useMemo(() => {
    if (!selectedDept) return [];
    return users.filter(user => (roleLabels[user.role] || user.department) === selectedDept);
  }, [users, selectedDept]);

  const handleDeptChange = (dept: string) => {
    setSelectedDept(dept);
    setSelectedUser('');
    setError('');
  };

  const handleThemeChange = (themeKey: ThemeKey) => {
    setCurrentTheme(themeKey);
    localStorage.setItem(THEME_STORAGE_KEY, themeKey);
    document.documentElement.setAttribute('data-theme', themeKey);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedDept) {
      setError('Pilih departemen terlebih dahulu');
      return;
    }
    if (!selectedUser) {
      setError('Pilih user terlebih dahulu');
      return;
    }
    if (!pin.trim() || pin.length !== 5) {
      setError('Masukkan PIN 5 digit');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedUser, password: pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login gagal');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDataset = async () => {
    if (!resetPassword.trim()) {
      setResetMessage('Masukkan password konfirmasi');
      return;
    }

    setIsResetting(true);
    setResetMessage('');

    try {
      const res = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmPassword: resetPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setResetMessage('✅ Dataset berhasil direset!');
        setResetPassword('');
        setTimeout(() => {
          setShowResetModal(false);
          setResetMessage('');
        }, 2000);
      } else {
        setResetMessage(data.error || 'Gagal mereset dataset');
      }
    } catch {
      setResetMessage('Terjadi kesalahan saat reset');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary">
            <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            lacakPO.id
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sistem Tracking Progress Manufaktur
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl p-6 shadow-sm bg-card border border-border">
          <h2 className="text-lg font-semibold mb-6 text-foreground">
            Masuk
          </h2>

          {error && (
            <div className="mb-4 p-3 text-sm rounded-xl bg-destructive/10 text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Department Selection */}
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Pilih Departemen
              </label>
              <div className="relative">
                <select
                  value={selectedDept}
                  onChange={(e) => handleDeptChange(e.target.value)}
                  disabled={isLoadingUsers || isLoading}
                  className="w-full h-12 px-4 pr-10 rounded-xl border border-input bg-background
                    transition-all appearance-none focus:ring-2 focus:ring-ring focus:border-transparent
                    disabled:opacity-50"
                >
                  <option value="">{isLoadingUsers ? 'Memuat...' : 'Pilih departemen'}</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-muted-foreground" />
              </div>
            </div>

            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Pilih User
              </label>
              <div className="relative">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  disabled={!selectedDept || isLoading}
                  className="w-full h-12 px-4 pr-10 rounded-xl border border-input bg-background
                    transition-all appearance-none focus:ring-2 focus:ring-ring focus:border-transparent
                    disabled:opacity-50"
                >
                  <option value="">{selectedDept ? 'Pilih user' : 'Pilih departemen dulu'}</option>
                  {usersInDept.map((user) => (
                    <option key={user.id} value={user.username}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-muted-foreground" />
              </div>
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                PIN (5 Digit)
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                name="pin"
                data-testid="pin-input"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setPin(value);
                }}
                className="w-full h-12 px-4 rounded-xl border border-input bg-background tracking-[0.5em]
                  transition-all focus:ring-2 focus:ring-ring focus:border-transparent
                  disabled:opacity-50 text-center text-lg font-mono"
                placeholder="•••••"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Masukkan PIN 5 digit
              </p>
            </div>

            <button
              type="submit"
              data-testid="login-button"
              disabled={isLoading || isLoadingUsers}
              className="w-full h-14 text-primary-foreground rounded-xl font-semibold
                bg-primary hover:bg-primary-hover active:bg-primary-active
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-[0.98] transition-all mt-2
                flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>

        {/* Theme Selector */}
        <div className="mt-6">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Pilih Tema Warna
          </p>
          <div className="flex justify-center gap-2">
            {themeOptions.map((theme) => (
              <button
                key={theme.key}
                onClick={() => handleThemeChange(theme.key)}
                className={`relative w-10 h-10 rounded-xl border-2 transition-all ${
                  currentTheme === theme.key
                    ? 'border-primary scale-110 shadow-md'
                    : 'border-border hover:border-muted-foreground'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${theme.primary} 50%, ${theme.accent} 50%)`,
                }}
                title={theme.name}
              >
                {currentTheme === theme.key && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            {themeOptions.find(t => t.key === currentTheme)?.name}
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            PIN Default
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <p className="font-medium text-foreground">12345</p>
            <p className="text-muted-foreground">
              (Semua user menggunakan PIN yang sama)
            </p>
          </div>
        </div>

        {/* Reset Dataset Button */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm
              text-destructive hover:bg-destructive/10
              rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Reset Dataset PO
          </button>
          <p className="text-xs text-muted-foreground mt-1">
            Hapus semua data PO untuk demo ulang
          </p>
        </div>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm bg-card rounded-2xl p-6 border border-border shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Reset Dataset
                </h3>
                <p className="text-sm text-muted-foreground">
                  Semua data PO akan dihapus
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Perhatian:</strong> Tindakan ini akan menghapus:
              </p>
              <ul className="text-sm text-amber-700 mt-1 ml-4 list-disc">
                <li>Semua Purchase Orders</li>
                <li>Semua Items</li>
                <li>Semua Activity Logs</li>
                <li>Semua Issues & Deliveries</li>
              </ul>
              <p className="text-sm text-amber-800 mt-2">
                Data User tetap aman.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Password Konfirmasi
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Masukkan 'resetdemo'"
                  className="w-full h-10 px-3 rounded-lg border border-input
                    bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Password: <code className="bg-muted px-1 rounded">resetdemo</code>
                </p>
              </div>

              {resetMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  resetMessage.startsWith('✅')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {resetMessage}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetPassword('');
                    setResetMessage('');
                  }}
                  className="flex-1 h-10 rounded-lg border border-border
                    bg-background text-foreground hover:bg-muted transition-colors"
                  disabled={isResetting}
                >
                  Batal
                </button>
                <button
                  onClick={handleResetDataset}
                  disabled={isResetting}
                  className="flex-1 h-10 rounded-lg bg-destructive
                    text-destructive-foreground hover:bg-destructive/90
                    transition-colors flex items-center justify-center gap-2"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Reset
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
