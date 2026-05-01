import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.PRINCIPAL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const totalEvents = await prisma.event.count();
    const pendingApprovals = await prisma.event.count({
      where: { status: EventStatus.PENDING_PRINCIPAL_APPROVAL }
    });
    const fullyApproved = await prisma.event.count({
      where: { 
        status: {
          in: [EventStatus.FULLY_APPROVED, EventStatus.GUEST_INVITED, EventStatus.ONGOING, EventStatus.COMPLETED]
        }
      }
    });

    return NextResponse.json({
      totalEvents,
      pendingApprovals,
      fullyApproved
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
