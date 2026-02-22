import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

export default async function ProfilePage() {
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
        <h1 className="text-2xl font-bold text-zinc-900">Profil</h1>
        
        <div className="bg-white rounded-2xl p-6 border border-zinc-200">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-500">Nama</label>
              <p className="text-lg font-semibold text-zinc-900">{session.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-500">Username</label>
              <p className="text-lg font-semibold text-zinc-900">{session.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-500">Peran</label>
              <p className="text-lg font-semibold text-zinc-900 capitalize">
                {session.role.replace('_', ' ')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-500">Departemen</label>
              <p className="text-lg font-semibold text-zinc-900 capitalize">
                {session.department}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
