import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.HOST) {
      return NextResponse.json({ error: 'Forbidden. Only Host can update guest status.' }, { status: 403 });
    }

    const { id } = await params;
    const { guestStatus } = await req.json();

    if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(guestStatus)) {
      return NextResponse.json({ error: 'Invalid guest status' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (event.hostId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (event.status !== EventStatus.FULLY_APPROVED && event.status !== EventStatus.GUEST_INVITED) {
      return NextResponse.json({ error: 'Guest status can only be updated when event is fully approved or guest is already invited' }, { status: 400 });
    }

    // Guest acceptance does NOT change event status to ONGOING.
    // Status transitions to ONGOING only when the event date/time arrives (handled in event fetch APIs).
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        guestStatus,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Update guest status error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
