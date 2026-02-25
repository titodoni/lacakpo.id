'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { Search, Package, FileText, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Color Palette
const colors = {
  black: '#000807',
  carbonBlack: '#171e1e',
  gunmetal: '#2c3232',
  hunterGreen: '#3d6646',
  shamrock: '#4d995a',
  emerald: '#50c878',
  brightTeal: '#1978c6',
  skyReflection: '#87b6dd',
  paleSky: '#bed5e8',
  platinum: '#f5f3f3',
};

interface Client {
  id: string;
  name: string;
  code: string;
}

interface SearchResult {
  id: string;
  type: 'po' | 'item';
  poNumber: string;
  itemName?: string;
  clientName: string;
  status: string;
  createdAt: string;
}

export default function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [selectedClient, setSelectedClient] = useState(searchParams.get('client') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchClients();
      // Auto search if URL has query params
      if (searchParams.get('q') || searchParams.get('client')) {
        performSearch(searchParams.get('q') || '');
      }
    }
  }, [user, userLoading, router, searchParams]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() && !selectedClient && !dateFrom && !dateTo && !statusFilter) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedClient) params.set('client', selectedClient);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      if (statusFilter) params.set('status', statusFilter);

      // Update URL
      router.push(`/search?${params.toString()}`);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const clearFilters = () => {
    setSelectedClient('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setQuery('');
    setResults([]);
    router.push('/search');
  };

  const hasActiveFilters = selectedClient || dateFrom || dateTo || statusFilter;

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Memuat...</p>
      </div>
    );
  }

  if (!user) return null;

  const userData = {
    userId: user.userId,
    username: user.username,
    role: user.role,
    department: user.department,
    name: user.name,
    isLoggedIn: user.isLoggedIn,
  };

  return (
    <DashboardLayout user={userData}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.black }}>Pencarian</h1>
          <p className="mt-1" style={{ color: colors.gunmetal }}>
            Cari PO dan Item berdasarkan keyword, client, atau periode
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: colors.paleSky }}>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nomor PO, nama item, client..."
                className="w-full h-14 pl-12 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-zinc-100 transition-all"
                style={{ borderColor: colors.paleSky }}
              />
            </div>

            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: colors.gunmetal }}
            >
              <Filter className="w-4 h-4" />
              Filter Lanjutan
              {hasActiveFilters && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                  Active
                </span>
              )}
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: colors.paleSky }}>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                    Client
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white"
                    style={{ borderColor: colors.paleSky }}
                  >
                    <option value="">Semua Client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                    Status PO
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white"
                    style={{ borderColor: colors.paleSky }}
                  >
                    <option value="">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                    <option value="finished">Finished (Paid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: colors.paleSky }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: colors.paleSky }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-14 flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: colors.shamrock }}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mencari...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Cari
                  </>
                )}
              </button>
              
              {(query || hasActiveFilters) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-6 h-14 rounded-xl font-semibold border transition-colors flex items-center gap-2"
                  style={{ borderColor: colors.paleSky, color: colors.gunmetal }}
                >
                  <X className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: colors.black }}>
                Hasil Pencarian ({results.length})
              </h2>
            </div>

            <div className="space-y-3">
              {results.map((result) => (
                <a
                  key={result.id}
                  href={result.type === 'po' ? `/pos/${result.id}` : `/pos/${result.id}?item=${result.id}`}
                  className="block bg-white rounded-2xl border p-5 hover:border-zinc-400 transition-colors"
                  style={{ borderColor: colors.paleSky }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="p-3 rounded-xl shrink-0"
                      style={{
                        backgroundColor: result.type === 'po' ? colors.paleSky : colors.platinum,
                      }}
                    >
                      {result.type === 'po' ? (
                        <FileText className="w-6 h-6" style={{ color: colors.brightTeal }} />
                      ) : (
                        <Package className="w-6 h-6" style={{ color: colors.shamrock }} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2 py-0.5 text-xs font-bold rounded-full"
                          style={{
                            backgroundColor: result.type === 'po' ? colors.paleSky : colors.platinum,
                            color: result.type === 'po' ? colors.brightTeal : colors.shamrock,
                          }}
                        >
                          {result.type === 'po' ? 'PO' : 'ITEM'}
                        </span>
                        {result.status && (
                          <span
                            className="px-2 py-0.5 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: result.status === 'finished' ? colors.shamrock : result.status === 'active' ? colors.emerald : colors.platinum,
                              color: result.status === 'finished' || result.status === 'active' ? 'white' : colors.gunmetal,
                            }}
                          >
                            {result.status}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg mt-1" style={{ color: colors.black }}>
                        {result.type === 'po' ? result.poNumber : result.itemName}
                      </h3>
                      
                      {result.type === 'item' && (
                        <p className="text-sm" style={{ color: colors.gunmetal }}>
                          {result.poNumber}
                        </p>
                      )}
                      
                      <p className="text-sm mt-1" style={{ color: colors.skyReflection }}>
                        {result.clientName}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : (query || hasActiveFilters) && !loading ? (
          <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: colors.paleSky }}>
            <Search className="w-12 h-12 mx-auto mb-4" style={{ color: colors.paleSky }} />
            <h3 className="font-semibold text-lg" style={{ color: colors.black }}>Tidak ditemukan</h3>
            <p className="text-sm mt-1" style={{ color: colors.gunmetal }}>
              Coba dengan keyword atau filter yang berbeda
            </p>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
