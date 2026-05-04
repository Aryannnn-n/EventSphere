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

    const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const letterDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const refNo = `MET/ITP/${new Date().getFullYear()}/${event.id.substring(0, 4).toUpperCase()}`;

    const body = await req.json().catch(() => ({}));
    const customEmailBody = body.customEmailHtml;

    // Send Email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background-color: #ffffff; color: #000000; border: 1px solid #eaeaea;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 24px; font-weight: bold; margin: 0; line-height: 1.5;">
            MET's Institute of Technology, Polytechnic<br />
            Bhujbal Knowledge City,<br />
            Adgaon, Nashik.
          </h1>
        </div>

        <div style="margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="text-align: left; font-size: 16px;">Ref No: ${refNo}</td>
              <td style="text-align: right; font-size: 16px;">Date: ${letterDate}</td>
            </tr>
          </table>
        </div>

        <div style="font-size: 16px; margin-bottom: 30px;">
          <p style="margin: 0 0 5px 0;">To,</p>
          <p style="margin: 0; padding-left: 20px; font-weight: bold;">${event.guestName}</p>
        </div>

        ${customEmailBody ? `
          <div style="font-size: 16px; line-height: 1.8; margin-bottom: 50px;">
            ${customEmailBody}
          </div>
        ` : `
          <div style="font-size: 16px; margin-bottom: 30px;">
            <p style="margin: 0;"><span style="font-weight: bold;">Subject:</span> Invitation as a Guest for "${event.title}"</p>
          </div>

          <div style="font-size: 16px; line-height: 1.8; margin-bottom: 50px;">
            <p>Dear ${event.guestName},</p>
            <p>We are pleased to invite you as a guest for the upcoming event <strong>"${event.title}"</strong> organized by the ${event.department} department.</p>
            <p>The details of the event are as follows:<br/>
            <strong>Date:</strong> ${eventDate}<br/>
            <strong>Time:</strong> ${event.time}<br/>
            <strong>Venue:</strong> ${event.venue}</p>
            <p>We look forward to your gracious presence and valuable insights, which will greatly benefit our students and staff.</p>
            <p>Thank you.</p>
          </div>
        `}

        <table style="width: 100%; border-collapse: collapse; margin-top: 50px;">
          <tr>
            <td style="text-align: left; vertical-align: bottom; width: 50%;">
              ${event.hodSignedAt ? `<p style="color: #2563eb; font-size: 12px; margin: 0 0 5px 0;">Digitally Signed<br/>${new Date(event.hodSignedAt).toLocaleDateString()}</p>` : ''}
              <p style="font-weight: bold; font-size: 16px; margin: 0 0 5px 0;">Head of Department</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0;">${event.department}</p>
            </td>
            <td style="text-align: right; vertical-align: bottom; width: 50%;">
              ${event.principalApprovedAt ? `<p style="color: #2563eb; font-size: 12px; margin: 0 0 5px 0;">Digitally Signed<br/>${new Date(event.principalApprovedAt).toLocaleDateString()}</p>` : ''}
              <p style="font-weight: bold; font-size: 16px; margin: 0 0 5px 0;">Principal</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0;">MET's Institute of Tech; Polytechnic</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0;">Bhujbal Knowledge City,</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0;">Adgaon, Nashik-422 003</p>
            </td>
          </tr>
        </table>
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
