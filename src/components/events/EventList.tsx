'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Eye, MapPin, Plus, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  department: string;
  guestName: string;
  guestEmail: string;
  guestStatus: string;
  status: string;
  host: { name: string; email: string };
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-500',
  PENDING_HOD_REVIEW: 'bg-yellow-500',
  PENDING_PRINCIPAL_APPROVAL: 'bg-orange-500',
  PENDING_HOD_SIGNATURE: 'bg-blue-500',
  FULLY_APPROVED: 'bg-green-600',
  GUEST_INVITED: 'bg-indigo-500',
  ONGOING: 'bg-primary',
  COMPLETED: 'bg-emerald-600',
  REJECTED: 'bg-red-600',
  CANCELLED: 'bg-gray-600',
};

export default function EventList({ role, userId, basePath }: { role: string; userId: string; basePath: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', date: '', time: '', venue: '', guestName: '', guestEmail: ''
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create event');
      }
      toast.success('Event created and submitted for review!');
      setIsCreateOpen(false);
      setFormData({ title: '', description: '', date: '', time: '', venue: '', guestName: '', guestEmail: '' });
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const roleLabels: Record<string, { title: string; subtitle: string }> = {
    HOST: { title: 'My Events', subtitle: 'Create and manage your events through the full lifecycle.' },
    HOD: { title: 'Department Events', subtitle: 'Review, approve, and sign events for your department.' },
    PRINCIPAL: { title: 'All Events', subtitle: 'Review and approve events across departments.' },
    STUDENT: { title: 'Event Schedule', subtitle: 'Browse upcoming confirmed events and share feedback.' },
    ADMIN: { title: 'All Events', subtitle: 'Overview of all events across the platform.' },
  };

  const label = roleLabels[role] || { title: 'Events', subtitle: '' };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">{label.title}</h2>
          <p className="text-muted-foreground">{label.subtitle}</p>
        </div>
        {(role === 'HOST' || role === 'ADMIN') && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-card">
          <p className="text-lg text-muted-foreground">No events found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="group hover:shadow-lg hover:border-primary/50 transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-3">
                  <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
                  <Badge className={`shrink-0 text-white text-[10px] px-2 py-0.5 ${STATUS_COLORS[event.status] || 'bg-gray-500'}`}>
                    {event.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 text-xs">{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {event.time}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {event.venue}</div>
                  <div className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> {event.host.name}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 group-hover:bg-primary group-hover:text-white transition-colors"
                  onClick={() => router.push(`${basePath}/events/${event.id}`)}
                >
                  <Eye className="w-3.5 h-3.5 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Event Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>Fill out the details to submit a new event for approval.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="create-title">Event Title</Label>
              <Input id="create-title" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-desc">Description</Label>
              <Textarea id="create-desc" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-date">Date</Label>
                <Input id="create-date" type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-time">Time</Label>
                <Input id="create-time" type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-venue">Venue</Label>
              <Input id="create-venue" required value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-gn">Guest Name</Label>
                <Input id="create-gn" required value={formData.guestName} onChange={(e) => setFormData({...formData, guestName: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-ge">Guest Email</Label>
                <Input id="create-ge" type="email" required value={formData.guestEmail} onChange={(e) => setFormData({...formData, guestEmail: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Submit for Review</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
