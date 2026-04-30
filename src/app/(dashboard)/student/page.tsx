import EventList from '@/components/events/EventList';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function StudentDashboard() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <EventList role="STUDENT" userId={session.user.id} basePath="/student" />
    </div>
  );
}
