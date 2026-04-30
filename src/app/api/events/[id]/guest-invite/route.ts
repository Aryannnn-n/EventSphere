import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/mail';
import { prisma } from '@/lib/prisma';
import { EventStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.HOST) {
      return NextResponse.json({ error: 'Forbidden. Only Host can invite guest.' }, { status: 403 });
    }

    const { id } = await params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (event.hostId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (event.status !== EventStatus.FULLY_APPROVED) {
      return NextResponse.json({ error: 'Event must be fully approved before inviting guest.' }, { status: 400 });
    }

    if (!event.guestEmail || !event.guestName) {
      return NextResponse.json({ error: 'Guest details are missing from event.' }, { status: 400 });
    }

    // Send Email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Invitation to Event: ${event.title}</h2>
        <p>Dear ${event.guestName},</p>
        <p>You are cordially invited to be a guest at our upcoming event.</p>
        <ul>
          <li><strong>Date:</strong> ${event.date.toDateString()}</li>
          <li><strong>Time:</strong> ${event.time}</li>
          <li><strong>Venue:</strong> ${event.venue}</li>
          <li><strong>Department:</strong> ${event.department}</li>
        </ul>
        <p>Please reply to this email to confirm your attendance.</p>
        <br />
        <p>Best regards,</p>
        <p>EventSphere Team</p>
      </div>
    `;

    const emailSent = await sendEmail({
      to: event.guestEmail,
      subject: `Invitation: ${event.title}`,
      html: emailHtml,
    });

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send invitation email. Check server logs.' }, { status: 500 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        guestInvitedAt: new Date(),
        status: EventStatus.GUEST_INVITED,
      },
    });

    return NextResponse.json({ message: 'Invitation sent successfully', event: updatedEvent });
  } catch (error) {
    console.error('Guest invite error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
