'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Search, Eye, Clock, Calendar, Briefcase, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import NoticeForm from './NoticeForm';

type Notice = {
  id: string;
  type: 'EXAM' | 'SCHEDULE' | 'PLACEMENT' | 'GENERAL';
  title: string;
  status: string;
  department: string;
  createdAt: string;
  host: { name: string; department: string };
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING_HOD_REVIEW: { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-l-yellow-500' },
  PENDING_PRINCIPAL_APPROVAL: { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', border: 'border-l-orange-500' },
  APPROVED: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', border: 'border-l-green-500' },
  REJECTED: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', border: 'border-l-red-600' },
};

const TYPE_ICONS = {
  EXAM: GraduationCap,
  SCHEDULE: Clock,
  PLACEMENT: Briefcase,
  GENERAL: FileText,
};

export default function NoticeList({ role, userId, basePath }: { role: string; userId: string; basePath: string }) {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notices');
      if (!res.ok) throw new Error('Failed to fetch notices');
      const data = await res.json();
      setNotices(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notices</h2>
          <p className="text-sm text-muted-foreground">Manage and view official institution notices.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl w-full sm:w-64"
            />
          </div>
          {(role === 'HOST' || role === 'ADMIN') && (
            <NoticeForm onSuccess={fetchNotices} />
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="text-center py-20 border rounded-2xl bg-card border-border/50">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No notices found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotices.map((notice) => {
            const statusStyle = STATUS_COLORS[notice.status] || STATUS_COLORS.PENDING_HOD_REVIEW;
            const Icon = TYPE_ICONS[notice.type] || FileText;
            return (
              <Card
                key={notice.id}
                className={`card-hover border-border/50 border-l-4 ${statusStyle.border} overflow-hidden group cursor-pointer`}
                onClick={() => router.push(`${basePath}/notices/${notice.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <Badge className={`shrink-0 text-[10px] px-2 py-0.5 border-0 ${statusStyle.bg} ${statusStyle.text}`}>
                      {notice.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-tight line-clamp-2 mt-2">{notice.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </div>
                    <span>{notice.department}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl group-hover:bg-primary group-hover:text-white transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 mr-2" />
                    View Notice
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
