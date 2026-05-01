'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const iconMap: Record<string, React.ElementType> = {
  totalUsers: Users,
  totalEvents: CalendarDays,
  upcomingEvents: Clock,
  attendedEvents: CheckCircle2,
  pendingReviews: Clock,
  approvedEvents: CheckCircle2,
  default: TrendingUp,
};

const colorMap: Record<string, string> = {
  totalUsers: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  totalEvents: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  upcomingEvents: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  attendedEvents: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  pendingReviews: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  approvedEvents: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  default: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
};

export default function DashboardStats({ role }: { role: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/dashboard/${role.toLowerCase()}`);
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (e) {
        console.error('Error fetching stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [role]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="skeleton h-3 w-20 rounded-full" />
                  <div className="skeleton h-8 w-16 rounded-lg" />
                </div>
                <div className="skeleton w-10 h-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Object.entries(stats).map(([key, value]) => {
        if (typeof value !== 'number') return null;
        const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        const Icon = iconMap[key] || iconMap.default;
        const color = colorMap[key] || colorMap.default;

        return (
          <Card key={key} className="card-hover border-border/50 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {title}
                  </p>
                  <p className="text-3xl font-bold mt-2 animate-count-up">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
