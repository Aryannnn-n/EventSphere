import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">✅ Admin Dashboard</h1>
      <p className="mt-2">Welcome, {session.user.name}</p>
      <p className="mt-1">Role: {session.user.role}</p>
      <p className="mt-1">Email: {session.user.email}</p>
    </div>
  );
}
