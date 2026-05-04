import DashboardLayout from '@/components/layout/DashboardLayout';
import NoticeList from '@/components/notices/NoticeList';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HodNoticesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto w-full animate-fade-in">
        <NoticeList role="HOD" userId={session.user.id} basePath="/hod" />
      </div>
    </DashboardLayout>
  );
}
