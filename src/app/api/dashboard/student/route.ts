import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.STUDENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const studentId = session.user.id;

    const upcomingEvents = await prisma.event.count({
      where: {
        status: { in: [EventStatus.FULLY_APPROVED, EventStatus.GUEST_INVITED] }
      }
    });

    const attendedEvents = await prisma.attendance.count({
      where: {
        studentId,
        attended: true
      }
    });

    return NextResponse.json({
      upcomingEvents,
      attendedEvents
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
