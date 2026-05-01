'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, CalendarPlus, Clock, Eye, MapPin, Plus, Search, User } from 'lucide-react';
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

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-gray-100 dark:bg-gray-900', text: 'text-gray-700 dark:text-gray-300', border: 'border-l-gray-400' },
  PENDING_HOD_REVIEW: { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-l-yellow-500' },
  PENDING_PRINCIPAL_APPROVAL: { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', border: 'border-l-orange-500' },
  PENDING_HOD_SIGNATURE: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-l-blue-500' },
  FULLY_APPROVED: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', border: 'border-l-green-500' },
  GUEST_INVITED: { bg: 'bg-indigo-50 dark:bg-indigo-950', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-l-indigo-500' },
  ONGOING: { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', border: 'border-l-red-500' },
  COMPLETED: { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-l-emerald-600' },
  REJECTED: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', border: 'border-l-red-600' },
  CANCELLED: { bg: 'bg-gray-100 dark:bg-gray-900', text: 'text-gray-600 dark:text-gray-400', border: 'border-l-gray-500' },
};

export default function EventList({ role, userId, basePath }: { role: string; userId: string; basePath: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.host.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{label.title}</h2>
          <p className="text-sm text-muted-foreground">{label.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl w-full sm:w-64"
            />
          </div>
          {(role === 'HOST' || role === 'ADMIN') && (
            <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl h-10 shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border/50">
              <CardHeader>
                <div className="skeleton h-5 w-3/4 rounded-lg" />
                <div className="skeleton h-3 w-full rounded-lg mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="skeleton h-3 w-1/2 rounded-lg" />
                <div className="skeleton h-3 w-2/3 rounded-lg" />
                <div className="skeleton h-9 w-full rounded-xl mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 border rounded-2xl bg-card border-border/50">
          <CalendarPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No events found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {searchQuery ? 'Try a different search term.' : 'Events will appear here once created.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const statusStyle = STATUS_COLORS[event.status] || STATUS_COLORS.DRAFT;
            return (
              <Card
                key={event.id}
                className={`card-hover border-border/50 border-l-4 ${statusStyle.border} overflow-hidden group cursor-pointer`}
                onClick={() => router.push(`${basePath}/events/${event.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-3">
                    <CardTitle className="text-base leading-tight line-clamp-1">{event.title}</CardTitle>
                    <Badge className={`shrink-0 text-[10px] px-2 py-0.5 border-0 ${statusStyle.bg} ${statusStyle.text}`}>
                      {event.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-xs">{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{event.host.name}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                    onClick={(e) => { e.stopPropagation(); router.push(`${basePath}/events/${event.id}`); }}
                  >
                    <Eye className="w-3.5 h-3.5 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Event Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Event</DialogTitle>
            <DialogDescription>Fill out the details to submit a new event for approval.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="create-title">Event Title</Label>
              <Input id="create-title" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-desc">Description</Label>
              <Textarea id="create-desc" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="rounded-xl min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-date">Date</Label>
                <Input id="create-date" type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-time">Time</Label>
                <Input id="create-time" type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-venue">Venue</Label>
              <Input id="create-venue" required value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} className="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-gn">Guest Name</Label>
                <Input id="create-gn" required value={formData.guestName} onChange={(e) => setFormData({...formData, guestName: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-ge">Guest Email</Label>
                <Input id="create-ge" type="email" required value={formData.guestEmail} onChange={(e) => setFormData({...formData, guestEmail: e.target.value})} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="rounded-xl">Submit for Review</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
