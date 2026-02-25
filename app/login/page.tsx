'use client';

import { useState, useEffect } from 'react';
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

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  // Reset dataset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedUser || !password.trim()) {
      setError('Pilih user dan masukkan password');
      return;
    }
    
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedUser, password }),
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

  const groupedUsers = users.reduce((acc, user) => {
    const group = roleLabels[user.role] || user.department;
    if (!acc[group]) acc[group] = [];
    acc[group].push(user);
    return acc;
  }, {} as Record<string, User[]>);

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
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Pilih User
              </label>
              <div className="relative">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  disabled={isLoadingUsers || isLoading}
                  className="w-full h-12 px-4 pr-10 rounded-xl border border-input bg-white 
                    transition-all appearance-none focus:ring-2 focus:ring-ring focus:border-transparent
                    disabled:opacity-50"
                >
                  <option value="">{isLoadingUsers ? 'Memuat...' : 'Pilih user'}</option>
                  {Object.entries(groupedUsers).map(([group, groupUsers]) => (
                    <optgroup key={group} label={group}>
                      {groupUsers.map((user) => (
                        <option key={user.id} value={user.username}>
                          {user.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                Password
              </label>
              <input
                type="password"
                name="password"
                data-testid="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-input bg-white 
                  transition-all focus:ring-2 focus:ring-ring focus:border-transparent
                  disabled:opacity-50"
                placeholder="Masukkan password"
                disabled={isLoading}
              />
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

        {/* Demo Credentials */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Password Default
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <p className="font-medium text-foreground">demo</p>
            <p className="text-muted-foreground">
              (Semua user menggunakan password yang sama)
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
                    bg-white focus:ring-2 focus:ring-ring focus:border-transparent"
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
                    bg-white text-foreground hover:bg-muted transition-colors"
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
