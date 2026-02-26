'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  Shield,
  User as UserIcon,
  ArrowLeft
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  department: string;
  isActive: boolean;
  createdAt: string;
}

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'sales_admin', label: 'Sales Admin' },
  { value: 'drafter', label: 'Drafter' },
  { value: 'purchasing', label: 'Purchasing' },
  { value: 'cnc_operator', label: 'Operator CNC' },
  { value: 'milling_operator', label: 'Operator Milling' },
  { value: 'fab_operator', label: 'Operator Fabrikasi' },
  { value: 'qc', label: 'QC' },
  { value: 'delivery', label: 'Pengiriman' },
  { value: 'finance', label: 'Keuangan' },
];

const DEPARTMENTS = [
  { value: 'management', label: 'Manajemen' },
  { value: 'sales', label: 'Penjualan' },
  { value: 'drafting', label: 'Drafting' },
  { value: 'purchasing', label: 'Purchasing' },
  { value: 'production', label: 'Produksi' },
  { value: 'qc', label: 'QC' },
  { value: 'logistics', label: 'Logistik' },
  { value: 'finance', label: 'Keuangan' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'cnc_operator',
    department: 'production',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user.role !== 'super_admin') {
          router.push('/');
          return;
        }
        setIsAuthorized(true);
        fetchUsers();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingUser ? '/api/admin/users' : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser 
        ? { ...formData, id: editingUser.id }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan pengguna');
        return;
      }

      setSuccess(editingUser ? 'Pengguna berhasil diupdate' : 'Pengguna berhasil dibuat');
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      setError('Terjadi kesalahan');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess('Pengguna berhasil dihapus');
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal menghapus pengguna');
      }
    } catch (error) {
      setError('Terjadi kesalahan');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          isActive: !user.isActive,
        }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      password: '',
      role: 'cnc_operator',
      department: 'production',
    });
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      password: '',
      role: user.role,
      department: user.department,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  if (isAuthorized === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    if (role === 'super_admin') return 'bg-red-100 text-red-700';
    if (role === 'manager') return 'bg-purple-100 text-purple-700';
    if (role === 'sales_admin') return 'bg-blue-100 text-blue-700';
    return 'bg-muted text-foreground';
  };

  return (
    <div className="min-h-screen bg-muted lg:ml-64">
      <main className="p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <a 
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali ke Beranda</span>
          </a>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin - Manajemen Pengguna</h1>
                <p className="text-muted-foreground text-sm">Buat dan kelola pengguna sistem</p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Pengguna
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-xl">
              {success}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Pengguna</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-2xl font-bold text-emerald-700">
                {users.filter(u => u.isActive).length}
              </p>
              <p className="text-sm text-emerald-600">Aktif</p>
            </div>
            <div className="bg-muted rounded-2xl p-4 border border-border">
              <p className="text-2xl font-bold text-foreground">
                {users.filter(u => !u.isActive).length}
              </p>
              <p className="text-sm text-muted-foreground">Tidak Aktif</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <p className="text-2xl font-bold text-red-700">
                {users.filter(u => u.role === 'super_admin').length}
              </p>
              <p className="text-sm text-red-600">Admin</p>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Pengguna</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Peran</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Departemen</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                          {ROLES.find(r => r.value === user.role)?.label || user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground capitalize">
                          {DEPARTMENTS.find(d => d.value === user.department)?.label || user.department}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            user.isActive 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {user.isActive ? (
                            <><CheckCircle2 className="w-3 h-3" /> Aktif</>
                          ) : (
                            <><XCircle className="w-3 h-3" /> Tidak Aktif</>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingUser ? 'Edit Pengguna' : 'Buat Pengguna Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary focus:outline-none"
                  placeholder="john_doe"
                  required
                  disabled={!!editingUser}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary focus:outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Password {editingUser && '(kosongkan untuk mempertahankan)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                  required={!editingUser}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Peran *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary focus:outline-none bg-card"
                  required
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Departemen *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-border focus:border-primary focus:outline-none bg-card"
                  required
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-11 border border-border text-foreground rounded-lg font-medium hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                >
                  {editingUser ? 'Update' : 'Buat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
