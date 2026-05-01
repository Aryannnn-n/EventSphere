import DashboardLayout from '@/components/layout/DashboardLayout';
import EventList from '@/components/events/EventList';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HostDashboard() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        <DashboardStats role="HOST" />
        <EventList role="HOST" userId={session.user.id} basePath="/host" />
      </div>
    </DashboardLayout>
  );
}
