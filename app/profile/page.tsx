import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PaletteOptions } from '@/components/PaletteOptions';
import { User, Building2, Shield, Palette } from 'lucide-react';

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
        <h1 className="text-2xl font-bold text-foreground">Profil</h1>
        
        {/* User Info Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Informasi Pengguna</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Nama
              </label>
              <p className="text-lg font-semibold text-foreground">{session.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <p className="text-lg font-semibold text-foreground">{session.username}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Peran
              </label>
              <p className="text-lg font-semibold text-foreground capitalize">
                {session.role.replace('_', ' ')}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Departemen
              </label>
              <p className="text-lg font-semibold text-foreground capitalize">
                {session.department}
              </p>
            </div>
          </div>
        </div>

        {/* Theme Settings Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Tema Aplikasi</h2>
              <p className="text-sm text-muted-foreground">Pilih tema warna yang sesuai dengan preferensi Anda</p>
            </div>
          </div>
          
          <PaletteOptions variant="grid" showLabel={false} />
        </div>
      </div>
    </DashboardLayout>
  );
}
