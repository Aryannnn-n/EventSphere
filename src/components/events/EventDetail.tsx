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
import { ArrowLeft, Calendar, Clock, Edit, Loader2, Mail, MapPin, Star, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type EventData = {
  id: string; title: string; description: string; date: string; time: string;
  venue: string; department: string; guestName: string; guestEmail: string;
  guestStatus: string; status: string; host: { name: string; email: string };
  reportGeneratedAt?: string; reportEmailedAt?: string;
};

type AttendanceRecord = {
  id: string; attended: boolean; student: { id: string; name: string; email: string };
};

type FeedbackRecord = {
  id: string; rating: number; comment: string; student: { name: string; department: string };
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
  const [feedbackData, setFeedbackData] = useState<{ feedbacks: FeedbackRecord[]; averageRating: number; totalResponses: number }>({ feedbacks: [], averageRating: 0, totalResponses: 0 });
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
    <div className="space-y-6">
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
        <Badge className={`self-start px-3 py-1.5 text-xs font-semibold border-0 ${STATUS_BADGE[event.status] || 'bg-gray-100 text-gray-700'}`}>
          {event.status.replace(/_/g, ' ')}
        </Badge>
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
      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="actions" className="rounded-lg data-[state=active]:shadow-sm">Actions</TabsTrigger>
          {(isHost || role === 'ADMIN') && <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:shadow-sm">Attendance</TabsTrigger>}
          {(isHost || role === 'ADMIN') && <TabsTrigger value="feedback" className="rounded-lg data-[state=active]:shadow-sm">Feedback</TabsTrigger>}
          {(isHost || role === 'ADMIN') && <TabsTrigger value="report" className="rounded-lg data-[state=active]:shadow-sm">Report</TabsTrigger>}
          {isStudent && <TabsTrigger value="my-feedback" className="rounded-lg data-[state=active]:shadow-sm">My Feedback</TabsTrigger>}
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
                <Button className="rounded-xl" disabled={actionLoading} onClick={() => doAction('guest-invite')}><Mail className="w-4 h-4 mr-2" /> Send Invitation Email</Button>
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
          {/* Host: Delete */}
          {isHost && !['COMPLETED', 'ONGOING'].includes(event.status) && (
            <Card className="border-red-200 dark:border-red-800/30 border-border/50">
              <CardContent className="pt-4">
                <Button variant="destructive" className="rounded-xl" onClick={async () => { if (!confirm('Delete this event permanently?')) return; const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' }); if (res.ok) { toast.success('Event deleted'); router.push(backPath); } }}>Delete Event</Button>
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
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">Feedback</CardTitle></CardHeader>
              <CardContent>
                {feedbackData.feedbacks.length === 0 ? <p className="text-sm text-muted-foreground">No feedback yet.</p> : (
                  <div className="space-y-3">{feedbackData.feedbacks.map((f) => (
                    <div key={f.id} className="border border-border/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{f.student.name}</span>
                        <span className="flex items-center gap-0.5">{Array.from({ length: f.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}</span>
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
                  <CardHeader><CardTitle className="text-lg">Generated Report</CardTitle></CardHeader>
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
                <Button className="rounded-xl" onClick={async () => { await doAction('report/email'); }}><Mail className="w-4 h-4 mr-2" /> Email Report to HOD</Button>
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
    </div>
  );
}
