import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/mail';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.HOST) {
      return NextResponse.json({ error: 'Forbidden. Only Host can email the report.' }, { status: 403 });
    }

    const { id } = await params;
    
    // Find the event and the report
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        report: true,
      }
    });

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!event.report) return NextResponse.json({ error: 'Report not generated yet' }, { status: 400 });

    // Fetch HOD email
    const hods = await prisma.user.findMany({
      where: { role: Role.HOD, department: event.department },
    });

    if (hods.length === 0) {
      return NextResponse.json({ error: 'No HOD found for this department' }, { status: 400 });
    }

    const hodEmail = hods[0].email; // Send to first HOD

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Event Final Report: ${event.title}</h2>
        <p>Dear HOD,</p>
        <p>The final report for the event <strong>${event.title}</strong> has been generated.</p>
        
        <h3>Metrics</h3>
        <ul>
          <li><strong>Total Attendance:</strong> ${event.report.attendanceCount}</li>
          <li><strong>Average Rating:</strong> ${event.report.averageRating.toFixed(1)} / 5.0</li>
        </ul>

        <h3>Summary</h3>
        <p>${event.report.summary}</p>

        ${event.report.financials ? `<h3>Financials</h3><p>${event.report.financials}</p>` : ''}
        
        <br />
        <p>Best regards,</p>
        <p>EventSphere System</p>
      </div>
    `;

    const emailSent = await sendEmail({
      to: hodEmail,
      subject: `Final Event Report: ${event.title}`,
      html: emailHtml,
    });

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    await prisma.event.update({
      where: { id },
      data: { reportEmailedAt: new Date() },
    });

    return NextResponse.json({ message: 'Report emailed successfully' });
  } catch (error) {
    console.error('Email report error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
