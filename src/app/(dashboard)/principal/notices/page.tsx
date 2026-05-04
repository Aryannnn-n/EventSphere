import DashboardLayout from '@/components/layout/DashboardLayout';
import NoticeList from '@/components/notices/NoticeList';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PrincipalNoticesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto w-full animate-fade-in">
        <NoticeList role="PRINCIPAL" userId={session.user.id} basePath="/principal" />
      </div>
    </DashboardLayout>
  );
}
