import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground mt-4">Halaman tidak ditemukan</p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-foreground text-white rounded-xl font-medium hover:bg-foreground/90 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
