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
import { ArrowLeft, Calendar, Clock, Edit, Mail, MapPin, Star, User } from 'lucide-react';
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

export default function EventDetail({ role, eventId, backPath }: { role: string; eventId: string; backPath: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');

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
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doAction('', 'PATCH', editFormData);
    setIsEditOpen(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!event) return <div className="text-center py-20">Event not found.</div>;

  const isHost = role === 'HOST';
  const isStudent = role === 'STUDENT';
  const isHod = role === 'HOD';
  const isPrincipal = role === 'PRINCIPAL';

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push(backPath)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">{event.title}</h1>
            {isHost && !['FULLY_APPROVED', 'GUEST_INVITED', 'ONGOING', 'COMPLETED', 'CANCELLED'].includes(event.status) && (
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Hosted by {event.host.name} &middot; {event.department}</p>
        </div>
        <Badge className="self-start text-white px-3 py-1 text-sm bg-primary shrink-0">{event.status.replace(/_/g, ' ')}</Badge>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Calendar, label: 'Date', value: new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
          { icon: Clock, label: 'Time', value: event.time },
          { icon: MapPin, label: 'Venue', value: event.venue },
          { icon: User, label: 'Guest', value: `${event.guestName} (${event.guestStatus})` },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <item.icon className="w-5 h-5 text-primary shrink-0" />
              <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="font-medium text-sm">{item.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{event.description}</p></CardContent></Card>

      {/* Tabs for role-specific actions */}
      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          {(isHost || role === 'ADMIN') && <TabsTrigger value="attendance">Attendance</TabsTrigger>}
          {(isHost || role === 'ADMIN') && <TabsTrigger value="feedback">Feedback</TabsTrigger>}
          {(isHost || role === 'ADMIN') && <TabsTrigger value="report">Report</TabsTrigger>}
          {isStudent && <TabsTrigger value="my-feedback">My Feedback</TabsTrigger>}
        </TabsList>

        {/* ===== ACTIONS TAB ===== */}
        <TabsContent value="actions" className="space-y-4 pt-4">
          {/* HOD Review */}
          {isHod && event.status === 'PENDING_HOD_REVIEW' && (
            <Card><CardHeader><CardTitle className="text-lg">HOD Review</CardTitle></CardHeader><CardContent className="space-y-3">
              <div><Label>Reason (optional)</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a note..." /></div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => doAction('hod-review', 'POST', { action: 'REJECTED', reason })}>Reject</Button>
                <Button onClick={() => doAction('hod-review', 'POST', { action: 'APPROVED', reason })}>Approve</Button>
              </div>
            </CardContent></Card>
          )}
          {/* HOD Signature */}
          {isHod && event.status === 'PENDING_HOD_SIGNATURE' && (
            <Card><CardHeader><CardTitle className="text-lg">Final Signature</CardTitle></CardHeader><CardContent>
              <Button onClick={() => doAction('hod-signature', 'POST', { action: 'APPROVED' })}>Sign &amp; Finalize Approval</Button>
            </CardContent></Card>
          )}
          {/* Principal Approval */}
          {isPrincipal && event.status === 'PENDING_PRINCIPAL_APPROVAL' && (
            <Card><CardHeader><CardTitle className="text-lg">Principal Approval</CardTitle></CardHeader><CardContent className="space-y-3">
              <div><Label>Reason (optional)</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a note..." /></div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => doAction('principal-approval', 'POST', { action: 'REJECTED', reason })}>Reject</Button>
                <Button onClick={() => doAction('principal-approval', 'POST', { action: 'APPROVED', reason })}>Approve</Button>
              </div>
            </CardContent></Card>
          )}
          {/* Host: Guest Invite */}
          {isHost && event.status === 'FULLY_APPROVED' && (
            <Card><CardHeader><CardTitle className="text-lg">Invite Guest</CardTitle></CardHeader><CardContent>
              <p className="text-sm text-muted-foreground mb-3">Send an email invitation to <strong>{event.guestName}</strong> ({event.guestEmail}).</p>
              <Button onClick={() => doAction('guest-invite')}><Mail className="w-4 h-4 mr-2" /> Send Invitation Email</Button>
            </CardContent></Card>
          )}
          {/* Host: Guest Status */}
          {isHost && ['GUEST_INVITED', 'FULLY_APPROVED'].includes(event.status) && (
            <Card><CardHeader><CardTitle className="text-lg">Update Guest Status</CardTitle></CardHeader><CardContent className="space-y-3">
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={guestStatusValue} onChange={(e) => setGuestStatusValue(e.target.value)}>
                <option value="PENDING">Pending</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option>
              </select>
              <Button onClick={async () => { await doAction('guest-status', 'PATCH', { guestStatus: guestStatusValue }); fetchEvent(); }}>Update Guest Status</Button>
            </CardContent></Card>
          )}
          {/* Host: Delete */}
          {isHost && !['COMPLETED', 'ONGOING'].includes(event.status) && (
            <Card className="border-red-200"><CardContent className="pt-4">
              <Button variant="destructive" onClick={async () => { if (!confirm('Delete this event permanently?')) return; const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' }); if (res.ok) { toast.success('Event deleted'); router.push(backPath); } }}>Delete Event</Button>
            </CardContent></Card>
          )}
          {/* No actions available */}
          {!isHost && !isHod && !isPrincipal && !isStudent && (
            <p className="text-muted-foreground">No actions available.</p>
          )}
        </TabsContent>

        {/* ===== ATTENDANCE TAB (Host) ===== */}
        {(isHost || role === 'ADMIN') && (
          <TabsContent value="attendance" className="space-y-4 pt-4">
            <Card><CardHeader><CardTitle className="text-lg">Mark Attendance</CardTitle></CardHeader><CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Student email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} />
                <Button onClick={async () => {
                  if (!studentEmail) return;
                  // Look up student by email first
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
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-lg">Attendance Records ({attendance.length})</CardTitle></CardHeader><CardContent>
              {attendance.length === 0 ? <p className="text-sm text-muted-foreground">No attendance records yet.</p> : (
                <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>{attendance.map((a) => (
                    <TableRow key={a.id}><TableCell>{a.student.name}</TableCell><TableCell>{a.student.email}</TableCell>
                      <TableCell><Badge className={a.attended ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}>{a.attended ? 'Present' : 'Absent'}</Badge></TableCell>
                    </TableRow>
                  ))}</TableBody></Table>
              )}
            </CardContent></Card>
          </TabsContent>
        )}

        {/* ===== FEEDBACK TAB (Host views) ===== */}
        {(isHost || role === 'ADMIN') && (
          <TabsContent value="feedback" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-primary">{feedbackData.averageRating}</p><p className="text-xs text-muted-foreground">Avg Rating / 5</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-primary">{feedbackData.totalResponses}</p><p className="text-xs text-muted-foreground">Total Responses</p></CardContent></Card>
            </div>
            <Card><CardHeader><CardTitle className="text-lg">Feedback</CardTitle></CardHeader><CardContent>
              {feedbackData.feedbacks.length === 0 ? <p className="text-sm text-muted-foreground">No feedback yet.</p> : (
                <div className="space-y-3">{feedbackData.feedbacks.map((f) => (
                  <div key={f.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">{f.student.name}</span>
                      <span className="flex items-center gap-1 text-sm">{Array.from({ length: f.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{f.comment}</p>
                  </div>
                ))}</div>
              )}
            </CardContent></Card>
          </TabsContent>
        )}

        {/* ===== REPORT TAB (Host) ===== */}
        {(isHost || role === 'ADMIN') && (
          <TabsContent value="report" className="space-y-4 pt-4">
            {report ? (
              <>
                <Card><CardHeader><CardTitle className="text-lg">Generated Report</CardTitle></CardHeader><CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-muted-foreground">Attendance</p><p className="text-2xl font-bold">{report.attendanceCount}</p></div>
                    <div><p className="text-xs text-muted-foreground">Avg Rating</p><p className="text-2xl font-bold">{report.averageRating?.toFixed(1)}</p></div>
                  </div>
                  <div><p className="text-xs text-muted-foreground">Summary</p><p className="text-sm">{report.summary}</p></div>
                  {report.financials && <div><p className="text-xs text-muted-foreground">Financials</p><p className="text-sm">{report.financials}</p></div>}
                </CardContent></Card>
                <Button onClick={async () => { await doAction('report/email'); }}><Mail className="w-4 h-4 mr-2" /> Email Report to HOD</Button>
              </>
            ) : (
              <Card><CardHeader><CardTitle className="text-lg">Generate Report</CardTitle></CardHeader><CardContent className="space-y-3">
                <div><Label>Summary</Label><Textarea value={reportSummary} onChange={(e) => setReportSummary(e.target.value)} placeholder="Write a summary of the event..." /></div>
                <div><Label>Financials (optional)</Label><Textarea value={reportFinancials} onChange={(e) => setReportFinancials(e.target.value)} placeholder="Budget breakdown..." /></div>
                <Button onClick={async () => { await doAction('report', 'POST', { summary: reportSummary, financials: reportFinancials }); fetchReport(); }}>Generate Report</Button>
              </CardContent></Card>
            )}
          </TabsContent>
        )}

        {/* ===== STUDENT FEEDBACK TAB ===== */}
        {isStudent && (
          <TabsContent value="my-feedback" className="pt-4">
            <Card><CardHeader><CardTitle className="text-lg">Submit Your Feedback</CardTitle></CardHeader><CardContent className="space-y-4">
              <div><Label>Rating (1-5)</Label>
                <div className="flex gap-1 mt-1">{[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setMyRating(n)} className="focus:outline-none">
                    <Star className={`w-6 h-6 ${n <= myRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  </button>
                ))}</div>
              </div>
              <div><Label>Comment</Label><Textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder="Share your thoughts..." /></div>
              <Button onClick={async () => {
                if (!myComment) { toast.error('Please add a comment'); return; }
                await doAction('feedback', 'POST', { rating: myRating, comment: myComment });
              }}>Submit Feedback</Button>
            </CardContent></Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Event Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update the event details. Note that this will reset approvals.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label>Event Title</Label>
              <Input required value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea required value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" required value={editFormData.date} onChange={(e) => setEditFormData({...editFormData, date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Time</Label>
                <Input type="time" required value={editFormData.time} onChange={(e) => setEditFormData({...editFormData, time: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Venue</Label>
              <Input required value={editFormData.venue} onChange={(e) => setEditFormData({...editFormData, venue: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Guest Name</Label>
                <Input required value={editFormData.guestName} onChange={(e) => setEditFormData({...editFormData, guestName: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Guest Email</Label>
                <Input type="email" required value={editFormData.guestEmail} onChange={(e) => setEditFormData({...editFormData, guestEmail: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
