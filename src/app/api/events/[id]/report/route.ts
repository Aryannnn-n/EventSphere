import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const report = await prisma.report.findUnique({
      where: { eventId: id },
    });

    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Fetch report error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.HOST) {
      return NextResponse.json({ error: 'Forbidden. Only Host can generate reports.' }, { status: 403 });
    }

    const { id } = await params;
    const { summary, financials } = await req.json();

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (event.hostId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Calculate metrics
    const attendanceCount = await prisma.attendance.count({
      where: { eventId: id, attended: true },
    });

    const feedbacks = await prisma.feedback.findMany({
      where: { eventId: id },
      select: { rating: true },
    });

    const averageRating = feedbacks.length > 0
      ? feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length
      : 0;

    const report = await prisma.report.upsert({
      where: { eventId: id },
      update: {
        summary,
        financials,
        attendanceCount,
        averageRating,
      },
      create: {
        eventId: id,
        summary,
        financials,
        attendanceCount,
        averageRating,
      },
    });

    await prisma.event.update({
      where: { id },
      data: {
        reportGeneratedAt: new Date(),
        status: EventStatus.COMPLETED, // Mark event as completed once report is generated
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
