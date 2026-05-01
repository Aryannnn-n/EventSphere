import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.HOST) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const hostId = session.user.id;

    const totalEvents = await prisma.event.count({ where: { hostId } });
    
    const pendingEvents = await prisma.event.count({
      where: {
        hostId,
        status: {
          in: [
            EventStatus.PENDING_HOD_REVIEW,
            EventStatus.PENDING_PRINCIPAL_APPROVAL,
            EventStatus.PENDING_HOD_SIGNATURE
          ]
        }
      }
    });

    const completedEvents = await prisma.event.count({
      where: { hostId, status: EventStatus.COMPLETED }
    });

    return NextResponse.json({
      totalEvents,
      pendingEvents,
      completedEvents
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
