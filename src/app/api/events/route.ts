import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, department: true },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let whereClause: any = {};

    switch (user.role) {
      case Role.ADMIN:
      case Role.PRINCIPAL:
        // See all events
        break;
      case Role.HOD:
        // See all events in their department
        if (user.department) {
          whereClause.department = user.department;
        }
        break;
      case Role.HOST:
        // See only their own events
        whereClause.hostId = session.user.id;
        break;
      case Role.STUDENT:
        // See only confirmed events (FULLY_APPROVED or beyond)
        whereClause.status = {
          in: [
            EventStatus.FULLY_APPROVED,
            EventStatus.GUEST_INVITED,
            EventStatus.ONGOING,
            EventStatus.COMPLETED,
          ],
        };
        break;
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        host: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-transition: If event date+time has passed and status is FULLY_APPROVED or GUEST_INVITED, mark as ONGOING
    const now = new Date();
    const updatePromises: Promise<any>[] = [];

    for (const event of events) {
      if (event.status === EventStatus.FULLY_APPROVED || event.status === EventStatus.GUEST_INVITED) {
        const eventDateTime = new Date(event.date);
        // Parse time string (e.g., "14:30") and apply to the event date
        const [hours, minutes] = event.time.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          eventDateTime.setHours(hours, minutes, 0, 0);
        }

        if (eventDateTime <= now) {
          event.status = EventStatus.ONGOING;
          updatePromises.push(
            prisma.event.update({
              where: { id: event.id },
              data: { status: EventStatus.ONGOING },
            })
          );
        }
      }
    }

    // Fire-and-forget the status updates (don't block the response)
    if (updatePromises.length > 0) {
      Promise.all(updatePromises).catch((err) =>
        console.error('Auto-transition status update error:', err)
      );
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Fetch events error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== Role.HOST && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden. Only Hosts can create events.' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.department) {
      return NextResponse.json({ error: 'User must have a department to create an event' }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, date, time, venue, guestName, guestEmail } = body;

    if (!title || !description || !date || !time || !venue || !guestName || !guestEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      return NextResponse.json({ error: 'Event date cannot be in the past' }, { status: 400 });
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        time,
        venue,
        department: user.department,
        guestName,
        guestEmail,
        hostId: user.id,
        status: EventStatus.PENDING_HOD_REVIEW, // Automatically submit for review
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
