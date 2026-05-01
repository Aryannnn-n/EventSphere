import DashboardHeader from '@/components/layout/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <DashboardHeader roleTitle="Admin" />
      <DashboardStats role="ADMIN" />
      <div className="mt-8">
        <Link href="/admin/users">
          <Button size="lg"><Users className="mr-2" /> Manage Users</Button>
        </Link>
      </div>
    </div>
  );
}
