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

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // Host can view attendance. Admin/Principal/HOD can too.
    if (session.user.role === Role.STUDENT) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (session.user.role === Role.HOST && event.hostId !== session.user.id) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: { eventId: id },
      include: {
        student: { select: { id: true, name: true, email: true, department: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    // Usually Host marks attendance
    if (!session?.user || session.user.role !== Role.HOST) {
      return NextResponse.json({ error: 'Forbidden. Only Host can mark attendance.' }, { status: 403 });
    }

    const { id } = await params;
    const { studentId, attended } = await req.json(); // attended: boolean

    if (!studentId || typeof attended !== 'boolean') {
      return NextResponse.json({ error: 'Missing studentId or attended status' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (event.hostId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (event.status !== 'ONGOING' && event.status !== 'GUEST_INVITED') {
      return NextResponse.json({ error: 'Attendance can only be marked when event is ongoing or guest is invited' }, { status: 400 });
    }

    // Upsert attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        eventId_studentId: {
          eventId: id,
          studentId,
        },
      },
      update: { attended },
      create: {
        eventId: id,
        studentId,
        attended,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
      }
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
