'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Masukkan username dan password');
      return;
    }
    
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo/Title */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Tracking Proyek</h1>
          <p className="text-zinc-500 mt-2">Sistem Tracking Progress Manufaktur</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm animate-scale-in stagger-1">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Masuk</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100 transition-all"
                placeholder="Masukkan username"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100 transition-all"
                placeholder="Masukkan password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-zinc-900 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform mt-2"
            >
              {isLoading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-400">Akun Demo</p>
          <div className="mt-2 space-y-1 text-xs text-zinc-500">
            <p>admin / admin123</p>
            <p>andi / andi123 (CNC) | budi / budi123 (Drafter)</p>
            <p>sari / sari123 (Purchasing) | dewi / dewi123 (QC)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
