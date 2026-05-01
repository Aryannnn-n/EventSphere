import DashboardLayout from '@/components/layout/DashboardLayout';
import EventDetail from '@/components/events/EventDetail';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HostEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { id } = await params;
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto w-full animate-fade-in">
        <EventDetail role="HOST" eventId={id} backPath="/host" />
      </div>
    </DashboardLayout>
  );
}
