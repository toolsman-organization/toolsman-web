import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminShell from './AdminShell';

export const metadata = {
  title: 'Admin Console | TOOLSMAN',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // Check role from profile or metadata
  let isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin';

  if (!isAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    redirect('/login?error=unauthorized_admin&redirect=/admin');
  }

  return (
    <AdminShell userEmail={user.email}>
      {children}
    </AdminShell>
  );
}
