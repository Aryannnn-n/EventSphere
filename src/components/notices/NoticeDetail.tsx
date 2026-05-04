'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Briefcase, Calendar, Clock, FileText, GraduationCap, Printer, Shield, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, string> = {
  PENDING_HOD_REVIEW: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PENDING_PRINCIPAL_APPROVAL: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TYPE_ICONS = {
  EXAM: GraduationCap,
  SCHEDULE: Clock,
  PLACEMENT: Briefcase,
  GENERAL: FileText,
};

export default function NoticeDetail({ noticeId, role, backPath }: { noticeId: string, role: string, backPath: string }) {
  const router = useRouter();
  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState('');

  const fetchNotice = async () => {
    try {
      const res = await fetch(`/api/notices/${noticeId}`);
      if (!res.ok) throw new Error('Failed to fetch notice');
      setNotice(await res.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotice();
  }, [noticeId]);

  const handleAction = async (action: 'APPROVED' | 'REJECTED') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/notices/${noticeId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) throw new Error('Failed to perform action');
      toast.success(`Notice ${action.toLowerCase()}!`);
      fetchNotice();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20 animate-pulse text-muted-foreground">Loading notice...</div>;
  if (!notice) return <div className="text-center py-20 text-muted-foreground">Notice not found.</div>;

  const Icon = TYPE_ICONS[notice.type as keyof typeof TYPE_ICONS] || FileText;
  const isHost = notice.hostId === noticeId; // Placeholder logic
  const isHod = role === 'HOD';
  const isPrincipal = role === 'PRINCIPAL';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Button variant="ghost" onClick={() => router.push(backPath)} className="rounded-xl -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Notices
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{notice.title}</h1>
            <p className="text-sm text-muted-foreground">Created by {notice.host.name} &middot; {notice.department}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={`px-3 py-1.5 text-xs font-semibold border-0 ${STATUS_BADGE[notice.status]}`}>
            {notice.status.replace(/_/g, ' ')}
          </Badge>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print Notice
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-8 md:p-12">
          {/* Institution Header for Print */}
          <div className="hidden print:flex items-center justify-center gap-6 mb-10 border-b-2 border-black pb-6">
            <div className="shrink-0">
              <Image src="/logo.png" alt="MET Logo" width={80} height={80} className="object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold uppercase">MET's Institute of Technology, Polytechnic</h1>
              <p className="text-sm font-medium">Bhujbal Knowledge City, Adgaon, Nashik - 422003</p>
              <div className="mt-2 inline-block px-6 py-1 border-2 border-black font-bold text-lg uppercase tracking-widest">
                NOTICE
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex justify-between text-sm font-medium">
              <span>Ref: MET/ITP/{new Date(notice.createdAt).getFullYear()}/NOT-{notice.id.substring(0,4).toUpperCase()}</span>
              <span>Date: {new Date(notice.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold underline underline-offset-4 decoration-2 uppercase">{notice.title}</h2>
            </div>

            {/* EXAM / SCHEDULE TABLE */}
            {(notice.type === 'EXAM' || notice.type === 'SCHEDULE') && notice.content.rows && (
              <div className="border rounded-xl overflow-hidden mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold text-black border-r">Date</TableHead>
                      <TableHead className="font-bold text-black border-r">Subject</TableHead>
                      <TableHead className="font-bold text-black text-center">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notice.content.rows.map((row: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="border-r font-medium">{new Date(row.date).toLocaleDateString()}</TableCell>
                        <TableCell className="border-r">{row.subject}</TableCell>
                        <TableCell className="text-center font-medium">{row.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* PLACEMENT DETAILS */}
            {notice.type === 'PLACEMENT' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-y-4 text-sm border p-6 rounded-2xl bg-muted/20">
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Company</p><p className="font-bold text-lg">{notice.content.companyName}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Salary/Stipend</p><p className="font-bold text-lg text-primary">{notice.content.salary}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Job Type</p><p className="font-medium">{notice.content.jobType}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Interview Time</p><p className="font-medium">{notice.content.time}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Eligibility</p><p className="font-medium">{notice.content.eligibility}</p></div>
                </div>
                <div><h3 className="font-bold text-sm uppercase tracking-widest mb-2">Required Skills</h3><p className="text-sm leading-relaxed">{notice.content.skills}</p></div>
                <div><h3 className="font-bold text-sm uppercase tracking-widest mb-2">Responsibilities</h3><p className="text-sm leading-relaxed whitespace-pre-wrap">{notice.content.responsibilities}</p></div>
                <div className="pt-4"><Button className="rounded-xl w-full sm:w-auto px-10" onClick={() => window.open(notice.content.applyLink, '_blank')}>Apply Now</Button></div>
              </div>
            )}

            {/* GENERAL CONTENT */}
            {notice.type === 'GENERAL' && (
              <div className="space-y-6">
                <p className="text-sm font-bold uppercase">Subject: {notice.content.subject}</p>
                <div className="text-base leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                  {notice.content.content}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="pt-16 grid grid-cols-2 gap-20">
              <div className="text-center">
                <div className="h-14 mb-2 flex items-end justify-center border-b border-dashed border-gray-300 pb-2">
                  {notice.hodReviewedAt && <span className="text-xs text-blue-600 font-bold uppercase tracking-tighter italic">Digitally Signed By HOD</span>}
                </div>
                <p className="text-sm font-bold uppercase">Head of Department</p>
                <p className="text-[10px] text-muted-foreground uppercase">{notice.department} Department</p>
              </div>
              <div className="text-center">
                <div className="h-14 mb-2 flex items-end justify-center border-b border-dashed border-gray-300 pb-2">
                  {notice.principalApprovedAt && <span className="text-xs text-blue-600 font-bold uppercase tracking-tighter italic">Digitally Signed By Principal</span>}
                </div>
                <p className="text-sm font-bold uppercase">Principal</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">MET's Institute of Tech; Polytechnic</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Section for Approvers */}
      {(isHod || isPrincipal) && notice.status.includes('PENDING') && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5" /> Review Action Required</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Action Reason (Optional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason if rejecting..." className="rounded-xl h-11 bg-background" />
            </div>
            <div className="flex gap-3">
              <Button variant="destructive" className="rounded-xl flex-1 h-11" disabled={actionLoading} onClick={() => handleAction('REJECTED')}>Reject Notice</Button>
              <Button className="rounded-xl flex-1 h-11" disabled={actionLoading} onClick={() => handleAction('APPROVED')}>Approve & Sign</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete for Host */}
      {role === 'HOST' && (
        <div className="pt-10 flex justify-center">
          <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={async () => {
            if (!confirm('Delete this notice?')) return;
            const res = await fetch(`/api/notices/${noticeId}`, { method: 'DELETE' });
            if (res.ok) { toast.success('Notice deleted'); router.push(backPath); }
          }}><Trash2 className="w-4 h-4 mr-2" /> Delete Notice Permanently</Button>
        </div>
      )}
    </div>
  );
}
