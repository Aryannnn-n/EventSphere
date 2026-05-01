import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApprovalAction, EventStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.HOD) {
      return NextResponse.json({ error: 'Forbidden. Only HOD can review.' }, { status: 403 });
    }

    const { id } = await params;
    const { action, reason } = await req.json(); // action is 'APPROVED' or 'REJECTED'

    if (!Object.values(ApprovalAction).includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: { host: true },
    });

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // Enforce department check: HOD can only review events in their department
    const hodUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!hodUser?.department || hodUser.department.toLowerCase().trim() !== event.department.toLowerCase().trim()) {
      return NextResponse.json({ error: `Forbidden. Event is in '${event.department}', but you are HOD of '${hodUser?.department}'.` }, { status: 403 });
    }

    if (event.status !== EventStatus.PENDING_HOD_REVIEW) {
      return NextResponse.json({ error: 'Event is not pending HOD review' }, { status: 400 });
    }

    const newStatus = action === ApprovalAction.APPROVED 
      ? EventStatus.PENDING_PRINCIPAL_APPROVAL 
      : EventStatus.REJECTED;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        hodReviewAction: action,
        hodReviewReason: reason || null,
        hodReviewedAt: new Date(),
        hodReviewedById: session.user.id,
        status: newStatus,
      },
    });

    // Optional: send notification/email to Host about the review outcome.
    await prisma.notification.create({
      data: {
        userId: event.hostId,
        eventId: event.id,
        message: `Your event "${event.title}" was ${action.toLowerCase()} by the HOD. ${reason ? `Reason: ${reason}` : ''}`,
      }
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('HOD review error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
