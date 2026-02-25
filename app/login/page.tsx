'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2, CheckCircle2 } from 'lucide-react';

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
      </div>
    </div>
  );
}
