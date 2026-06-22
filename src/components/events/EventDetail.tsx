'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, Clock, Edit, Loader2, Mail, MapPin, RefreshCw, Shield, Star, Trash2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type EventData = {
  id: string; title: string; description: string; date: string; time: string;
  venue: string; department: string; guestName: string; guestEmail: string;
  guestStatus: string; status: string; host: { name: string; email: string };
  reportGeneratedAt?: string; reportEmailedAt?: string;
  customLetterHtml?: string | null;
  customNoticeHtml?: string | null;
};

type AttendanceRecord = {
  id: string; attended: boolean; student: { id: string; name: string; email: string };
};

type FeedbackRecord = {
  id: string; rating: number; comment: string; sentiment?: string; student: { name: string; department: string };
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  PENDING_HOD_REVIEW: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  PENDING_PRINCIPAL_APPROVAL: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  PENDING_HOD_SIGNATURE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  FULLY_APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  GUEST_INVITED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  ONGOING: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function EventDetail({ role, eventId, backPath }: { role: string; eventId: string; backPath: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Attendance
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [studentEmail, setStudentEmail] = useState('');

  // Feedback
  const [feedbackData, setFeedbackData] = useState<{ feedbacks: FeedbackRecord[]; averageRating: number; totalResponses: number; nlpResult?: any }>({ feedbacks: [], averageRating: 0, totalResponses: 0 });
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');

  // Report
  const [reportSummary, setReportSummary] = useState('');
  const [reportFinancials, setReportFinancials] = useState('');
  const [report, setReport] = useState<any>(null);

  // Guest status
  const [guestStatusValue, setGuestStatusValue] = useState('');

  // Edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '', description: '', date: '', time: '', venue: '', guestName: '', guestEmail: ''
  });
  const [activeTab, setActiveTab] = useState('actions');

  // Generic Email Preview
  const [previewData, setPreviewData] = useState<{
    isOpen: boolean;
    type: 'invite' | 'summary' | 'report' | null;
    html: string;
    endpoint: string;
  }>({
    isOpen: false,
    type: null,
    html: '',
    endpoint: '',
  });

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) throw new Error('Failed to fetch event');
      const data = await res.json();
      setEvent(data);
      setGuestStatusValue(data.guestStatus);
      setEditFormData({
        title: data.title,
        description: data.description,
        date: new Date(data.date).toISOString().split('T')[0],
        time: data.time,
        venue: data.venue,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
      });
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/attendance`);
      if (res.ok) setAttendance(await res.json());
    } catch {}
  };

  const fetchFeedback = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/feedback`);
      if (res.ok) setFeedbackData(await res.json());
    } catch {}
  };

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/report`);
      if (res.ok) setReport(await res.json());
    } catch {}
  };

  useEffect(() => { fetchEvent(); }, [eventId]);

  useEffect(() => {
    if (!event) return;
    if (role === 'HOST' || role === 'ADMIN') { fetchAttendance(); fetchFeedback(); fetchReport(); }
  }, [event]);

  const doAction = async (path: string, method = 'POST', body: any = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}${path ? '/' + path : ''}`, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      toast.success(data.message || 'Success!');
      fetchEvent();
      return data;
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doAction('', 'PATCH', editFormData);
    setIsEditOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!event) return <div className="text-center py-20 text-muted-foreground">Event not found.</div>;

  const isHost = role === 'HOST';
  const isStudent = role === 'STUDENT';
  const isHod = role === 'HOD';
  const isPrincipal = role === 'PRINCIPAL';

  return (
    <div className="space-y-6 pb-20">
      <Button variant="ghost" onClick={() => router.push(backPath)} className="rounded-xl -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
            {isHost && !['FULLY_APPROVED', 'GUEST_INVITED', 'ONGOING', 'COMPLETED', 'CANCELLED'].includes(event.status) && (
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="rounded-xl">
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">Hosted by {event.host.name} &middot; {event.department}</p>
        </div>
        <div className="flex flex-col md:items-end gap-3">
          <Badge className={`self-start md:self-end px-3 py-1.5 text-xs font-semibold border-0 ${STATUS_BADGE[event.status] || 'bg-gray-100 text-gray-700'}`}>
            {event.status.replace(/_/g, ' ')}
          </Badge>
          <div className="flex flex-wrap gap-2">
            {isHost && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(`/letter/${event.id}`, '_blank')}>
                View Guest Letter
              </Button>
            )}
            {(isHost || isHod || isPrincipal) && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(`/notice/${event.id}`, '_blank')}>
                Print Notice
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Calendar, label: 'Date', value: new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
          { icon: Clock, label: 'Time', value: event.time },
          { icon: MapPin, label: 'Venue', value: event.venue },
          { icon: User, label: 'Guest', value: `${event.guestName} (${event.guestStatus})` },
        ].map((item) => (
          <Card key={item.label} className="border-border/50">
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                <p className="font-medium text-sm truncate">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Description */}
      <Card className="border-border/50">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="actions" className="rounded-lg data-[state=active]:shadow-sm">Actions</TabsTrigger>
          {(isHost || role === 'ADMIN') && ['GUEST_INVITED', 'ONGOING', 'COMPLETED'].includes(event.status) && <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:shadow-sm">Attendance</TabsTrigger>}
          {(isHost || role === 'ADMIN') && <TabsTrigger value="feedback" className="rounded-lg data-[state=active]:shadow-sm">Feedback</TabsTrigger>}
          {(isHost || role === 'ADMIN') && ['ONGOING', 'GUEST_INVITED', 'COMPLETED'].includes(event.status) && <TabsTrigger value="report" className="rounded-lg data-[state=active]:shadow-sm">Report</TabsTrigger>}
          {isStudent && event.status === 'COMPLETED' && <TabsTrigger value="my-feedback" className="rounded-lg data-[state=active]:shadow-sm">My Feedback</TabsTrigger>}
        </TabsList>

        {/* ===== ACTIONS TAB ===== */}
        <TabsContent value="actions" className="space-y-4 pt-4">
          {/* HOD Review */}
          {isHod && event.status === 'PENDING_HOD_REVIEW' && (
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">HOD Review</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Reason (optional)</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a note..." className="h-11 rounded-xl mt-1" /></div>
                <div className="flex gap-2">
                  <Button variant="destructive" className="rounded-xl" disabled={actionLoading} onClick={() => doAction('hod-review', 'POST', { action: 'REJECTED', reason })}>Reject</Button>
                  <Button className="rounded-xl" disabled={actionLoading} onClick={() => doAction('hod-review', 'POST', { action: 'APPROVED', reason })}>Approve</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {/* HOD Signature */}
          {isHod && event.status === 'PENDING_HOD_SIGNATURE' && (
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">Final Signature</CardTitle></CardHeader>
              <CardContent>
                <Button className="rounded-xl" disabled={actionLoading} onClick={() => doAction('hod-signature', 'POST', { action: 'APPROVED' })}>Sign &amp; Finalize Approval</Button>
              </CardContent>
            </Card>
          )}
          {/* Principal Approval */}
          {isPrincipal && event.status === 'PENDING_PRINCIPAL_APPROVAL' && (
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">Principal Approval</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Reason (optional)</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a note..." className="h-11 rounded-xl mt-1" /></div>
                <div className="flex gap-2">
                  <Button variant="destructive" className="rounded-xl" disabled={actionLoading} onClick={() => doAction('principal-approval', 'POST', { action: 'REJECTED', reason })}>Reject</Button>
                  <Button className="rounded-xl" disabled={actionLoading} onClick={() => doAction('principal-approval', 'POST', { action: 'APPROVED', reason })}>Approve</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Host: Guest Invite */}
          {isHost && event.status === 'FULLY_APPROVED' && (
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">Invite Guest</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Send an email invitation to <strong>{event.guestName}</strong> ({event.guestEmail}).</p>
                <div className="flex gap-2">
                  <Button className="rounded-xl" disabled={actionLoading} onClick={() => {
                    const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    });
                    const defaultHtml = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; padding: 20px;">
  <div style="text-align: center; margin-bottom: 25px;">
    <img src="${window.location.origin}/logo.png" alt="MET Logo" style="width: 80px; height: 80px; object-fit: contain;">
  </div>
  <p><span style="font-weight: bold;">Subject:</span> Invitation as a Guest for "${event.title}"</p>
  <br/>
  <p>Dear ${event.guestName},</p>
  <p>We are pleased to invite you as a guest for the upcoming event <strong>"${event.title}"</strong> organized by the ${event.department} department.</p>
  <p>The details of the event are as follows:<br/>
  <strong>Date:</strong> ${eventDate}<br/>
  <strong>Time:</strong> ${event.time}<br/>
  <strong>Venue:</strong> ${event.venue}</p>
  <p>We look forward to your gracious presence and valuable insights, which will greatly benefit our students and staff.</p>
  <p>Thank you.</p>
</div>
`;
                    setPreviewData({
                      isOpen: true,
                      type: 'invite',
                      html: event.customLetterHtml || defaultHtml,
                      endpoint: 'guest-invite'
                    });
                  }}><Mail className="w-4 h-4 mr-2" /> Preview & Send Invite</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Host: Guest Status */}
          {isHost && ['GUEST_INVITED', 'FULLY_APPROVED'].includes(event.status) && (
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">Update Guest Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <select className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm" value={guestStatusValue} onChange={(e) => setGuestStatusValue(e.target.value)}>
                  <option value="PENDING">Pending</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option>
                </select>
                <Button className="rounded-xl" disabled={actionLoading} onClick={async () => { await doAction('guest-status', 'PATCH', { guestStatus: guestStatusValue }); fetchEvent(); }}>Update Guest Status</Button>
              </CardContent>
            </Card>
          )}
          {/* Host: Danger Zone / Manual Override */}
          {isHost && (
            <Card className="border-red-200 dark:border-red-800/30 border-border/50 bg-red-50/5">
              <CardHeader>
                <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Danger Zone / Manual Override
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Manual Status Transition</Label>
                  <p className="text-xs text-muted-foreground mb-2">Use this to manually move the event status if it becomes stuck.</p>
                  <select 
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-red-500 outline-none" 
                    value={event.status} 
                    onChange={async (e) => {
                      if (!confirm(`Manually change status to ${e.target.value.replace(/_/g, ' ')}?`)) return;
                      await doAction('', 'PATCH', { status: e.target.value });
                      fetchEvent();
                    }}
                  >
                    {Object.keys(STATUS_BADGE).map(status => (
                      <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-6 mt-6 border-t border-red-100 dark:border-red-900/30">
                  <Label className="text-sm font-semibold text-red-600">Delete Event</Label>
                  <p className="text-xs text-muted-foreground mb-4 mt-1">Once deleted, an event cannot be recovered. All attendance and feedback records will be permanently removed.</p>
                  <Button 
                    variant="destructive" 
                    className="rounded-xl w-full sm:w-auto shadow-lg shadow-red-500/20" 
                    onClick={async () => { 
                      if (!confirm('CRITICAL: Delete this event permanently? This will remove all associated reports, feedback, and attendance records.')) return; 
                      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' }); 
                      if (res.ok) { 
                        toast.success('Event deleted successfully'); 
                        router.push(backPath); 
                      } else {
                        const data = await res.json();
                        toast.error(data.error || 'Failed to delete event');
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Event Permanently
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {!isHost && !isHod && !isPrincipal && !isStudent && (
            <p className="text-muted-foreground">No actions available.</p>
          )}
        </TabsContent>

        {/* ===== ATTENDANCE TAB ===== */}
        {(isHost || role === 'ADMIN') && (
          <TabsContent value="attendance" className="space-y-4 pt-4">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">Mark Attendance</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Student email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="h-11 rounded-xl" />
                  <Button className="rounded-xl shrink-0" onClick={async () => {
                    if (!studentEmail) return;
                    const uRes = await fetch(`/api/admin/users?role=STUDENT`);
                    if (!uRes.ok) { toast.error('Cannot fetch students'); return; }
                    const users = await uRes.json();
                    const student = users.find((u: any) => u.email === studentEmail.toLowerCase());
                    if (!student) { toast.error('Student not found'); return; }
                    await doAction('attendance', 'POST', { studentId: student.id, attended: true });
                    setStudentEmail('');
                    fetchAttendance();
                  }}>Mark Present</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">Attendance Records ({attendance.length})</CardTitle></CardHeader>
              <CardContent>
                {attendance.length === 0 ? <p className="text-sm text-muted-foreground">No attendance records yet.</p> : (
                  <div className="border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                      <TableBody>{attendance.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.student.name}</TableCell>
                          <TableCell>{a.student.email}</TableCell>
                          <TableCell>
                            <Badge className={`border-0 ${a.attended ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                              {a.attended ? 'Present' : 'Absent'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}</TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ===== FEEDBACK TAB ===== */}
        {(isHost || role === 'ADMIN') && (
          <TabsContent value="feedback" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-5 text-center">
                  <p className="text-3xl font-bold text-primary">{feedbackData.averageRating}</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Rating / 5</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-5 text-center">
                  <p className="text-3xl font-bold text-primary">{feedbackData.totalResponses}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Responses</p>
                </CardContent>
              </Card>
            </div>

            {/* NLP Analysis Section */}
            {feedbackData.nlpResult && (
              <div className="space-y-4 my-6 animate-fade-in">
                <h3 className="text-lg font-semibold">NLP Analysis Summary</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-border/50 bg-primary/5">
                    <CardHeader className="pb-2"><CardTitle className="text-base text-primary">Sentiment Analysis</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-green-600">Positive {feedbackData.nlpResult.positivePercent}%</span>
                          <span className="text-gray-500">Neutral {feedbackData.nlpResult.neutralPercent}%</span>
                          <span className="text-red-600">Negative {feedbackData.nlpResult.negativePercent}%</span>
                        </div>
                        <div className="h-3 w-full rounded-full overflow-hidden flex">
                          <div style={{ width: `${feedbackData.nlpResult.positivePercent}%` }} className="bg-green-500"></div>
                          <div style={{ width: `${feedbackData.nlpResult.neutralPercent}%` }} className="bg-gray-400"></div>
                          <div style={{ width: `${feedbackData.nlpResult.negativePercent}%` }} className="bg-red-500"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-primary/5">
                    <CardHeader className="pb-2"><CardTitle className="text-base text-primary">Key Themes</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {feedbackData.nlpResult.keywords.map((kw: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">{kw}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="border-border/50 bg-primary/5">
                  <CardContent className="pt-6">
                    <h4 className="text-sm font-semibold mb-2">AI Summary</h4>
                    <p className="text-sm italic leading-relaxed text-muted-foreground">"{feedbackData.nlpResult.summary}"</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                  <CardTitle className="text-lg">Feedback</CardTitle>
                  {isHost && event.status === 'COMPLETED' && feedbackData.feedbacks.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl" disabled={actionLoading} onClick={async () => {
                        setActionLoading(true);
                        try {
                          const res = await fetch('/api/nlp/analyze', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: event.id }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'NLP analysis failed');
                          toast.success(data.data?.message || 'NLP Analysis Complete!');
                          fetchFeedback(); // Refresh to show new NLP data
                        } catch (e: any) { toast.error(e.message); }
                        finally { setActionLoading(false); }
                      }}>
                        Run NLP Analysis
                      </Button>
                      <Button size="sm" className="rounded-xl" disabled={actionLoading} onClick={() => {
                        const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        });
                        const defaultHtml = `
<h2 style="margin:0 0 8px; color:#1a1a2e; font-size:20px;">Student Feedback Summary</h2>
<p style="margin:0 0 24px; color:#555; font-size:14px;">Thank you for your valuable contribution to our institution. Here is a summary of how students responded to your session.</p>
<div style="background:#f8f9fa; border-left:4px solid #1a1a2e; padding:18px; border-radius:4px; margin-bottom:24px;">
  <p style="margin:0 0 6px; font-size:14px;"><strong>Event:</strong> ${event.title}</p>
  <p style="margin:0 0 6px; font-size:14px;"><strong>Date:</strong> ${formattedDate}</p>
  <p style="margin:0 0 6px; font-size:14px;"><strong>Venue:</strong> ${event.venue}</p>
  <p style="margin:0 0 6px; font-size:14px;"><strong>Organized by:</strong> ${event.host.name}</p>
</div>
<h3 style="color:#1a1a2e; font-size:16px; margin:24px 0 8px;">What Students Said</h3>
<div style="background:#f8f9fa; border-radius:8px; padding:18px; margin-bottom:24px;">
  <p style="margin:0; color:#333; font-size:14px; line-height:1.8; font-style:italic;">"${feedbackData.nlpResult.summary}"</p>
</div>
<p style="color:#333; font-size:14px; line-height:1.7; margin:0;">We deeply appreciate your time and expertise. The response from our students reflects the quality of your session. We hope to have you with us again in the future.</p>
`;
                        setPreviewData({
                          isOpen: true,
                          type: 'summary',
                          html: defaultHtml,
                          endpoint: 'feedback/guest-summary'
                        });
                      }}>
                        Send Guest Summary Email
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {feedbackData.feedbacks.length === 0 ? <p className="text-sm text-muted-foreground">No feedback yet.</p> : (
                  <div className="space-y-3">{feedbackData.feedbacks.map((f) => (
                    <div key={f.id} className="border border-border/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{f.student.name}</span>
                        <div className="flex items-center gap-3">
                          {f.sentiment && (
                            <Badge variant="outline" className={`text-[10px] uppercase tracking-wide border-0 ${f.sentiment === 'POSITIVE' ? 'text-green-700 bg-green-100' : f.sentiment === 'NEGATIVE' ? 'text-red-700 bg-red-100' : 'text-gray-700 bg-gray-100'}`}>
                              {f.sentiment}
                            </Badge>
                          )}
                          <span className="flex items-center gap-0.5">{Array.from({ length: f.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{f.comment}</p>
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ===== REPORT TAB ===== */}
        {(isHost || role === 'ADMIN') && (
          <TabsContent value="report" className="space-y-4 pt-4">
            {report ? (
              <>
                <Card className="border-border/50">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Generated Report</CardTitle>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => {
                        setReportSummary(report.summary);
                        setReportFinancials(report.financials || '');
                        setReport(null);
                      }}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" /> Edit & Regenerate
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground">Attendance</p>
                        <p className="text-2xl font-bold mt-1">{report.attendanceCount}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground">Avg Rating</p>
                        <p className="text-2xl font-bold mt-1">{report.averageRating?.toFixed(1)}</p>
                      </div>
                    </div>
                    <div><p className="text-xs text-muted-foreground mb-1">Summary</p><p className="text-sm">{report.summary}</p></div>
                    {report.financials && <div><p className="text-xs text-muted-foreground mb-1">Financials</p><p className="text-sm">{report.financials}</p></div>}
                  </CardContent>
                </Card>
                <Button className="rounded-xl" disabled={actionLoading} onClick={() => {
                  const defaultHtml = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
  <div style="background-color: #1a1a2e; color: #ffffff; padding: 30px; text-align: center;">
    <div style="background: white; width: 60px; height: 60px; border-radius: 10px; padding: 5px; margin: 0 auto 15px;">
      <img src="${window.location.origin}/logo.png" alt="MET Logo" style="width: 100%; height: 100%; object-fit: contain;">
    </div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Event Final Report</h1>
    <p style="margin: 10px 0 0; opacity: 0.8; font-size: 14px;">${event.title}</p>
  </div>
  
  <div style="padding: 30px;">
    <p style="font-size: 16px; margin-bottom: 25px;">Dear HOD,</p>
    <p style="margin-bottom: 25px;">The following report has been compiled for the recently completed event. Please find the performance metrics and summary below.</p>
    
    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
      <div style="flex: 1; background-color: #f8f9fa; border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #eee;">
        <div style="font-size: 24px; font-weight: bold; color: #1a1a2e;">${report.attendanceCount}</div>
        <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Students</div>
      </div>
      <div style="flex: 1; background-color: #f8f9fa; border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #eee;">
        <div style="font-size: 24px; font-weight: bold; color: #1a1a2e;">${report.averageRating.toFixed(1)}</div>
        <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Avg Rating</div>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #1a1a2e; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; font-size: 18px;">Executive Summary</h3>
      <p style="color: #444; font-size: 15px; background-color: #fff; border-radius: 8px; border: 1px solid #f0f0f0; padding: 15px;">${report.summary}</p>
    </div>

    ${report.financials ? `
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1a1a2e; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; font-size: 18px;">Financial Overview</h3>
      <p style="color: #444; font-size: 15px; background-color: #fff; border-radius: 8px; border: 1px solid #f0f0f0; padding: 15px;">${report.financials}</p>
    </div>
    ` : ''}

    <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #eee;">
      <p style="margin: 0; font-weight: 600; color: #1a1a2e;">${event.host.name}</p>
      <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Event Coordinator</p>
      <p style="margin: 2px 0 0; color: #666; font-size: 14px;">${event.department} Department</p>
    </div>
  </div>
  
  <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #999;">
    This report was generated via EventSphere Management System.
  </div>
</div>
`;
                  setPreviewData({
                    isOpen: true,
                    type: 'report',
                    html: defaultHtml,
                    endpoint: 'report/email'
                  });
                }}><Mail className="w-4 h-4 mr-2" /> Email Report to HOD</Button>
              </>
            ) : (
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-lg">Generate Report</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label>Summary</Label><Textarea value={reportSummary} onChange={(e) => setReportSummary(e.target.value)} placeholder="Write a summary of the event..." className="rounded-xl mt-1" /></div>
                  <div><Label>Financials (optional)</Label><Textarea value={reportFinancials} onChange={(e) => setReportFinancials(e.target.value)} placeholder="Budget breakdown..." className="rounded-xl mt-1" /></div>
                  <Button className="rounded-xl" onClick={async () => { await doAction('report', 'POST', { summary: reportSummary, financials: reportFinancials }); fetchReport(); }}>Generate Report</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* ===== STUDENT FEEDBACK TAB ===== */}
        {isStudent && (
          <TabsContent value="my-feedback" className="pt-4">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">Submit Your Feedback</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Rating (1-5)</Label>
                  <div className="flex gap-1 mt-2">{[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setMyRating(n)} className="focus:outline-none transition-transform hover:scale-110">
                      <Star className={`w-7 h-7 ${n <= myRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    </button>
                  ))}</div>
                </div>
                <div><Label>Comment</Label><Textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder="Share your thoughts..." className="rounded-xl mt-1" /></div>
                <Button className="rounded-xl" onClick={async () => {
                  if (!myComment) { toast.error('Please add a comment'); return; }
                  await doAction('feedback', 'POST', { rating: myRating, comment: myComment });
                }}>Submit Feedback</Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Event Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Event</DialogTitle>
            <DialogDescription>Update the event details. Note that this will reset approvals.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label>Event Title</Label>
              <Input required value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea required value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" required value={editFormData.date} onChange={(e) => setEditFormData({...editFormData, date: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label>Time</Label>
                <Input type="time" required value={editFormData.time} onChange={(e) => setEditFormData({...editFormData, time: e.target.value})} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Venue</Label>
              <Input required value={editFormData.venue} onChange={(e) => setEditFormData({...editFormData, venue: e.target.value})} className="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Guest Name</Label>
                <Input required value={editFormData.guestName} onChange={(e) => setEditFormData({...editFormData, guestName: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label>Guest Email</Label>
                <Input type="email" required value={editFormData.guestEmail} onChange={(e) => setEditFormData({...editFormData, guestEmail: e.target.value})} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="rounded-xl">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Generic Email Preview Dialog */}
      <Dialog open={previewData.isOpen} onOpenChange={(open) => setPreviewData(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewData.type === 'invite' && 'Preview Guest Invitation'}
              {previewData.type === 'summary' && 'Preview Guest Feedback Summary'}
              {previewData.type === 'report' && 'Preview HOD Report Email'}
            </DialogTitle>
            <DialogDescription>Review and edit the email content before sending.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block text-sm font-medium">Email Content</Label>
            <div 
              contentEditable
              suppressContentEditableWarning
              className="min-h-[300px] max-h-[500px] overflow-y-auto p-6 border rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-base leading-relaxed bg-white text-black"
              onBlur={(e) => {
                const html = e.currentTarget.innerHTML;
                setPreviewData(prev => ({ ...prev, html }));
              }}
              dangerouslySetInnerHTML={{ __html: previewData.html }}
            />
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              {previewData.type === 'invite' && '* Header, footer, and signatures will be added automatically.'}
              {previewData.type === 'summary' && '* Technical stats and branding will be added automatically.'}
              {previewData.type === 'report' && '* This content will be sent as the final report email.'}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewData(prev => ({ ...prev, isOpen: false }))} className="rounded-xl">Cancel</Button>
            <Button className="rounded-xl px-6" disabled={actionLoading} onClick={async () => {
              await doAction(previewData.endpoint, 'POST', { customEmailHtml: previewData.html });
              setPreviewData(prev => ({ ...prev, isOpen: false }));
            }}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Send Email Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
