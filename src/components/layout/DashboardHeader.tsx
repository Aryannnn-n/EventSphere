import { auth, signOut } from '@/lib/auth';
import NotificationBell from './NotificationBell';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default async function DashboardHeader({ roleTitle }: { roleTitle: string }) {
  const session = await auth();
  
  return (
    <header className="flex items-center justify-between mb-8 pb-4 border-b">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">{roleTitle} Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, {session?.user?.name}</p>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
          <Button variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </form>
      </div>
    </header>
  );
}
