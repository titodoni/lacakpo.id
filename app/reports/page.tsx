import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

export default async function ReportsPage() {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    redirect('/login');
  }

  // Extract only plain serializable values from session
  const userData = {
    userId: session.userId,
    username: session.username,
    role: session.role,
    department: session.department,
    name: session.name,
    isLoggedIn: session.isLoggedIn,
  };

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Laporan</h1>
        
        <div className="bg-white rounded-2xl p-12 border border-zinc-200 text-center">
          <p className="text-zinc-500">Laporan akan diimplementasikan di Fase 6</p>
          <p className="text-sm text-zinc-400 mt-2">
            Ini akan menampilkan statistik progress dan performa departemen
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
