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
      return NextResponse.json({ error: 'Forbidden. Only HOD can sign.' }, { status: 403 });
    }

    const { id } = await params;
    const { action } = await req.json(); // Usually just 'APPROVED' for signature

    if (!Object.values(ApprovalAction).includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const hodUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!hodUser?.department || hodUser.department.toLowerCase().trim() !== event.department.toLowerCase().trim()) {
      return NextResponse.json({ error: `Forbidden. Event is in '${event.department}', but you are HOD of '${hodUser?.department}'.` }, { status: 403 });
    }

    if (event.status !== EventStatus.PENDING_HOD_SIGNATURE) {
      return NextResponse.json({ error: 'Event is not pending HOD final signature' }, { status: 400 });
    }

    const newStatus = action === ApprovalAction.APPROVED 
      ? EventStatus.FULLY_APPROVED 
      : EventStatus.REJECTED;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        hodSignatureAction: action,
        hodSignedAt: new Date(),
        hodSignedById: session.user.id,
        status: newStatus,
      },
    });

    await prisma.notification.create({
      data: {
        userId: event.hostId,
        eventId: event.id,
        message: `Your event "${event.title}" is fully approved. The HOD has signed it.`,
      }
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('HOD signature error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
