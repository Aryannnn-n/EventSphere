import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const totalUsers = await prisma.user.count();
    const totalEvents = await prisma.event.count();
    
    const eventsByStatus = await prisma.event.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusCounts = eventsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalUsers,
      totalEvents,
      statusCounts
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
