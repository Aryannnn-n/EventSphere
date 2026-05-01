import EventList from '@/components/events/EventList';
import DashboardHeader from '@/components/layout/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PrincipalDashboard() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <DashboardHeader roleTitle="Principal" />
      <DashboardStats role="PRINCIPAL" />
      <EventList role="PRINCIPAL" userId={session.user.id} basePath="/principal" />
    </div>
  );
}
