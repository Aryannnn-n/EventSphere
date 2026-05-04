import DashboardLayout from '@/components/layout/DashboardLayout';
import NoticeDetail from '@/components/notices/NoticeDetail';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function HostNoticeDetailPage({ params }: RouteParams) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { id } = await params;

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <NoticeDetail noticeId={id} role="HOST" backPath="/host/notices" />
      </div>
    </DashboardLayout>
  );
}
