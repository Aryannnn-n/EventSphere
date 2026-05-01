'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardStats({ role }: { role: string }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/dashboard/${role.toLowerCase()}`);
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (e) {
        console.error('Error fetching stats', e);
      }
    };
    fetchStats();
  }, [role]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Object.entries(stats).map(([key, value]) => {
        if (typeof value !== 'number') return null;
        // Format key from camelCase to Title Case
        const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return (
          <Card key={key} className="bg-white dark:bg-black shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold mt-2 text-primary">{value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
