import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.HOD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const hodUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!hodUser?.department) return NextResponse.json({ error: 'Department not assigned' }, { status: 400 });

    const deptRegex = hodUser.department.toLowerCase().trim();

    // Since Prisma doesn't directly support complex case-insensitive joins easily without raw query, 
    // we'll fetch all department events and filter if needed, but since it's an exact match in our DB mostly, we do an insensitive query.
    
    const allDeptEvents = await prisma.event.findMany({
      where: { department: { equals: hodUser.department, mode: 'insensitive' } },
      select: { status: true }
    });

    const totalEvents = allDeptEvents.length;
    const pendingReview = allDeptEvents.filter(e => e.status === EventStatus.PENDING_HOD_REVIEW).length;
    const pendingSignature = allDeptEvents.filter(e => e.status === EventStatus.PENDING_HOD_SIGNATURE).length;

    return NextResponse.json({
      totalEvents,
      pendingReview,
      pendingSignature
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
