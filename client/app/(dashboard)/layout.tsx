import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/login');
  const user = session.user;

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={user.email ?? 'admin@noma.co'} />
      <main className="flex-1 min-w-0 max-w-full bg-bg">
        {children}
      </main>
    </div>
  );
}
