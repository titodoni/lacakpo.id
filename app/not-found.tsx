import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-zinc-900">404</h1>
        <p className="text-xl text-zinc-500 mt-4">Halaman tidak ditemukan</p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
