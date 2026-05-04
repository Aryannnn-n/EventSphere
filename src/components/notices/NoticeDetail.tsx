'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Briefcase, Clock, ExternalLink, FileText, GraduationCap, Link as LinkIcon, Printer, Shield, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const isHod = role === 'HOD';
  const isPrincipal = role === 'PRINCIPAL';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <Button variant="ghost" onClick={() => router.push(backPath)} className="rounded-xl -ml-2 print:hidden">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Notices
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 print:hidden">
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

      <Card className="border-border/50 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <CardContent className="p-8 md:p-12 print:p-0 print:flex print:flex-col print:min-h-[18cm]">
          {/* Institution Header for Print */}
          <header className="hidden print:flex items-center justify-center gap-6 mb-8 border-b-2 border-black pb-6">
            <div className="shrink-0">
              <img src="/logo.png" alt="MET Logo" width="100" height="100" style={{ objectFit: 'contain' }} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl md:text-[28px] font-bold leading-tight text-black">
                MET's Institute of Technology, Polytechnic
              </h1>
              <p className="text-lg font-medium text-gray-800">Bhujbal Knowledge City, Adgaon, Nashik - 422003</p>
              <p className="text-sm font-medium text-gray-600 mt-1 uppercase tracking-wider">Affiliated to MSBTE | Approved by AICTE</p>
            </div>
          </header>

          <div className="hidden print:block text-center mb-6">
            <h2 className="text-2xl font-bold underline decoration-2 underline-offset-4">
              {notice.type === 'EXAM' ? 'EXAM NOTICE' : 
               notice.type === 'SCHEDULE' ? 'TIME TABLE' : 
               notice.type === 'PLACEMENT' ? 'PLACEMENT OPPORTUNITY' : 
               'OFFICIAL NOTICE'}
            </h2>
          </div>

          <div className="space-y-8">
            <div className="flex justify-between text-sm font-medium">
              <span>Ref: MET/ITP/{new Date(notice.createdAt).getFullYear()}/NOT-{notice.id.substring(0,4).toUpperCase()}</span>
              <span>Date: {new Date(notice.createdAt).toLocaleDateString()}</span>
            </div>

            {/* EXAM NOTICE */}
            {notice.type === 'EXAM' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold uppercase underline underline-offset-4 decoration-2">{notice.title}</h2>
                </div>
                
                {notice.content.rows && (
                  <div className="border border-black rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 border-b border-black">
                          <TableHead className="font-bold text-black border-r border-black">Date</TableHead>
                          <TableHead className="font-bold text-black border-r border-black">Subject</TableHead>
                          <TableHead className="font-bold text-black text-center">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notice.content.rows.map((row: any, i: number) => (
                          <TableRow key={i} className="border-b border-black last:border-0">
                            <TableCell className="border-r border-black font-medium">{new Date(row.date).toLocaleDateString()}</TableCell>
                            <TableCell className="border-r border-black">{row.subject}</TableCell>
                            <TableCell className="text-center font-medium">{row.time}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {notice.content.paragraph && (
                  <div className="mt-6 text-base leading-relaxed text-gray-800 dark:text-gray-200 border-l-4 border-muted pl-4 italic">
                    {notice.content.paragraph}
                  </div>
                )}
              </div>
            )}

            {/* COLLEGE SCHEDULE */}
            {notice.type === 'SCHEDULE' && (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold uppercase underline underline-offset-4 decoration-2">{notice.title}</h2>
                  <p className="font-bold text-lg">Year: {notice.content.year} &middot; Branch: {notice.content.branch}</p>
                </div>

                <div className="border border-black rounded-xl overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-muted/30 border-b border-black">
                        <th className="border-r border-black p-2 font-bold text-black bg-muted/20">Time Slot</th>
                        {notice.content.days.map((day: string) => (
                          <th key={day} className="border-r border-black p-2 font-bold text-black last:border-0">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {notice.content.slots.map((slot: string, sIdx: number) => (
                        <tr key={slot} className="border-b border-black last:border-0">
                          <td className="border-r border-black p-2 font-bold text-center bg-muted/10">{slot}</td>
                          {notice.content.days.map((day: string) => {
                            const isLunch = slot.includes('Lunch');
                            return (
                              <td key={day} className="border-r border-black p-2 text-center last:border-0">
                                {isLunch ? (
                                  <span className="text-[10px] font-bold text-muted-foreground">BREAK</span>
                                ) : (
                                  notice.content.timetable[day][sIdx] || '-'
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PLACEMENT / OPPORTUNITY */}
            {notice.type === 'PLACEMENT' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold uppercase underline underline-offset-4 decoration-2 text-primary">{notice.title}</h2>
                </div>

                <div className="grid grid-cols-2 gap-y-6 text-sm border-2 border-black p-8 rounded-3xl bg-muted/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 bg-red-600 text-white font-bold rounded-bl-2xl">
                    Last Date: {new Date(notice.content.lastDate).toLocaleDateString()}
                  </div>
                  
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5 font-bold">Company</p><p className="font-black text-2xl">{notice.content.companyName}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5 font-bold">Interview Time</p><p className="font-bold text-xl">{notice.content.time}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5 font-bold">Salary / Stipend</p><p className="font-bold text-xl text-primary">{notice.content.salary}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5 font-bold">Job Type</p><p className="font-bold text-xl">{notice.content.jobType}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5 font-bold">Eligibility</p><p className="font-bold text-lg">{notice.content.eligibility}</p></div>
                </div>

                <div className="space-y-4">
                  <div><h3 className="font-bold text-sm uppercase tracking-widest mb-2 border-b-2 border-primary inline-block">Required Skills</h3><p className="text-base leading-relaxed pl-2">{notice.content.skills}</p></div>
                  <div><h3 className="font-bold text-sm uppercase tracking-widest mb-2 border-b-2 border-primary inline-block">Key Responsibilities</h3><p className="text-base leading-relaxed pl-2 whitespace-pre-wrap">{notice.content.responsibilities}</p></div>
                </div>

                <div className="pt-6 space-y-4">
                  <div className="p-4 border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <LinkIcon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Application Link</p>
                        <p className="text-sm font-medium break-all text-blue-600 underline">{notice.content.applyLink}</p>
                      </div>
                    </div>
                    <a 
                      href={notice.content.applyLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 print:hidden"
                    >
                      Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </div>
                  <p className="hidden print:block text-[10px] text-muted-foreground italic">
                    Note: Interested students can apply directly using the link above or by scanning the QR code (if available).
                  </p>
                </div>
              </div>
            )}

            {/* GENERAL NOTICE */}
            {notice.type === 'GENERAL' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold uppercase underline underline-offset-4 decoration-2">{notice.title}</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-lg font-bold uppercase border-b border-black pb-2">Subject: {notice.content.subject}</p>
                  <div className="text-lg leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {notice.content.content}
                  </div>
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-24 mt-auto">
              {notice.type === 'PLACEMENT' ? (
                <>
                  <div className="text-center invisible"></div>
                  <div className="text-center">
                    <div className="h-16 mb-2 flex items-end justify-center border-b border-black pb-2">
                      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter italic">Digitally Signed By {notice.host.name}</span>
                    </div>
                    <p className="text-sm font-bold uppercase">Placement Coordinator</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{notice.department} Department</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="h-16 mb-2 flex items-end justify-center border-b border-black pb-2">
                      {(notice.hodReviewedAt || notice.status === 'APPROVED') && <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter italic">Digitally Signed By HOD</span>}
                    </div>
                    <p className="text-sm font-bold uppercase">Head of Department</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{notice.department} Department</p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 mb-2 flex items-end justify-center border-b border-black pb-2">
                      {notice.principalApprovedAt && <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter italic">Digitally Signed By Principal</span>}
                    </div>
                    <p className="text-sm font-bold uppercase">Principal</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">MET's Institute of Tech; Polytechnic</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Section for Approvers */}
      {(isHod || isPrincipal) && notice.status.includes('PENDING') && (
        <Card className="border-primary/20 bg-primary/5 print:hidden">
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
        <div className="pt-10 flex justify-center print:hidden">
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
