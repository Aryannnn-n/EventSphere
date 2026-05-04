import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        host: { select: { name: true, email: true, department: true } },
      },
    });

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // Authorization checks
    if (session.user.role === Role.HOST && event.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Note: HOD and Principal logic can be added if strict isolation is needed.
    // For now, if they have the ID, they can view it.

    // Auto-transition: If event date+time has passed and status is FULLY_APPROVED or GUEST_INVITED, mark as ONGOING
    if (event.status === 'FULLY_APPROVED' || event.status === 'GUEST_INVITED') {
      const now = new Date();
      const eventDateTime = new Date(event.date);
      const [hours, minutes] = event.time.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        eventDateTime.setHours(hours, minutes, 0, 0);
      }

      if (eventDateTime <= now) {
        event.status = 'ONGOING' as any;
        // Update in DB (fire-and-forget)
        prisma.event.update({
          where: { id },
          data: { status: 'ONGOING' },
        }).catch((err: any) => console.error('Auto-transition error:', err));
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Fetch event error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.HOST) {
      return NextResponse.json({ error: 'Forbidden. Only Host can edit.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (event.hostId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // If the user is specifically trying to update the status (manual override),
    // we skip the non-editable check.
    const isStatusOnly = Object.keys(body).length === 1 && body.status;
    
    if (!isStatusOnly) {
      // Only allow editing content if not fully approved or in progress.
      const nonEditableStatuses = ['FULLY_APPROVED', 'GUEST_INVITED', 'ONGOING', 'COMPLETED', 'CANCELLED'];
      if (nonEditableStatuses.includes(event.status)) {
        return NextResponse.json({ error: 'Cannot edit event content in current status. Use Manual Override to change status first.' }, { status: 400 });
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        date: body.date ? new Date(body.date) : undefined,
        time: body.time,
        venue: body.venue,
        guestName: body.guestName,
        guestEmail: body.guestEmail,
        // Allow manual status update, or fallback to review if editing
        status: body.status || 'PENDING_HOD_REVIEW',
        hodReviewAction: body.status ? undefined : null,
        principalAction: body.status ? undefined : null,
        hodSignatureAction: body.status ? undefined : null,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== Role.HOST && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { id } = await params;
    
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (session.user.role === Role.HOST && event.hostId !== session.user.id) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Allow deleting even if ongoing, but keep COMPLETED restricted unless admin?
    // Actually, user said "event is not completed so there give me delete button".
    // So if it's NOT completed, allow deletion.
    if (event.status === 'COMPLETED' && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Cannot delete completed events' }, { status: 400 });
    }

    // Cascade delete related records
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { eventId: id } }),
      prisma.feedback.deleteMany({ where: { eventId: id } }),
      prisma.notification.deleteMany({ where: { eventId: id } }),
      prisma.report.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
