import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Settings, Users } from 'lucide-react';

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        <DashboardStats role="ADMIN" />

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/users">
              <Card className="card-hover border-border/50 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-base">Manage Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Add, edit, or remove users and manage roles across the system.</CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-border/50 opacity-60">
              <CardHeader className="pb-3">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center mb-2">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">All Events</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>View and monitor all events across the platform.</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 opacity-60">
              <CardHeader className="pb-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center mb-2">
                  <Settings className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Configure system preferences and global settings.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
