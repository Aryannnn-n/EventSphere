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
    if (!session?.user || session.user.role !== Role.PRINCIPAL) {
      return NextResponse.json({ error: 'Forbidden. Only Principal can approve.' }, { status: 403 });
    }

    const { id } = await params;
    const { action, reason } = await req.json();

    if (!Object.values(ApprovalAction).includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    if (event.status !== EventStatus.PENDING_PRINCIPAL_APPROVAL) {
      return NextResponse.json({ error: 'Event is not pending Principal approval' }, { status: 400 });
    }

    const newStatus = action === ApprovalAction.APPROVED 
      ? EventStatus.PENDING_HOD_SIGNATURE 
      : EventStatus.REJECTED;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        principalAction: action,
        principalReason: reason || null,
        principalApprovedAt: new Date(),
        principalApprovedById: session.user.id,
        status: newStatus,
      },
    });

    await prisma.notification.create({
      data: {
        userId: event.hostId,
        eventId: event.id,
        message: `Your event "${event.title}" was ${action.toLowerCase()} by the Principal. ${reason ? `Reason: ${reason}` : ''}`,
      }
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Principal approval error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
