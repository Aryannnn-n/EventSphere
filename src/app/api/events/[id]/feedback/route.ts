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

    // Host or Admin/HOD/Principal can view feedback
    if (session.user.role === Role.STUDENT) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (session.user.role === Role.HOST && event.hostId !== session.user.id) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { eventId: id },
      include: {
        student: { select: { name: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const averageRating = feedbacks.length > 0 
      ? feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length 
      : 0;

    return NextResponse.json({
      feedbacks,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalResponses: feedbacks.length,
    });
  } catch (error) {
    console.error('Fetch feedback error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.STUDENT) {
      return NextResponse.json({ error: 'Forbidden. Only Students can submit feedback.' }, { status: 403 });
    }

    const { id } = await params;
    const { rating, comment } = await req.json();

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating. Must be between 1 and 5.' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // Check if the student actually attended (optional strict check)
    // const attendance = await prisma.attendance.findUnique({
    //   where: { eventId_studentId: { eventId: id, studentId: session.user.id } }
    // });
    // if (!attendance || attendance.status !== 'PRESENT') {
    //   return NextResponse.json({ error: 'You must attend the event to leave feedback.' }, { status: 400 });
    // }

    const feedback = await prisma.feedback.upsert({
      where: {
        eventId_studentId: {
          eventId: id,
          studentId: session.user.id,
        },
      },
      update: { rating, comment },
      create: {
        eventId: id,
        studentId: session.user.id,
        rating,
        comment,
      },
    });

    return NextResponse.json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Submit feedback error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
