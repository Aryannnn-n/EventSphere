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

    const body = await req.json().catch(() => ({}));
    const customEmailHtml = body.customEmailHtml;

    const emailHtml = customEmailHtml || `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
  <div style="background-color: #1a1a2e; color: #ffffff; padding: 30px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Event Final Report</h1>
    <p style="margin: 10px 0 0; opacity: 0.8; font-size: 14px;">${event.title}</p>
  </div>
  
  <div style="padding: 30px;">
    <p style="font-size: 16px; margin-bottom: 25px;">Dear HOD,</p>
    <p style="margin-bottom: 25px;">The following report has been compiled for the recently completed event. Please find the performance metrics and summary below.</p>
    
    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
      <div style="flex: 1; background-color: #f8f9fa; border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #eee;">
        <div style="font-size: 24px; font-weight: bold; color: #1a1a2e;">${event.report.attendanceCount}</div>
        <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Students</div>
      </div>
      <div style="flex: 1; background-color: #f8f9fa; border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #eee;">
        <div style="font-size: 24px; font-weight: bold; color: #1a1a2e;">${event.report.averageRating.toFixed(1)}</div>
        <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Avg Rating</div>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #1a1a2e; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; font-size: 18px;">Executive Summary</h3>
      <p style="color: #444; font-size: 15px; background-color: #fff; border-radius: 8px; border: 1px solid #f0f0f0; padding: 15px;">${event.report.summary}</p>
    </div>

    ${event.report.financials ? `
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1a1a2e; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; font-size: 18px;">Financial Overview</h3>
      <p style="color: #444; font-size: 15px; background-color: #fff; border-radius: 8px; border: 1px solid #f0f0f0; padding: 15px;">${event.report.financials}</p>
    </div>
    ` : ''}

    <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #eee;">
      <p style="margin: 0; font-weight: 600; color: #1a1a2e;">${event.host.name}</p>
      <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Event Coordinator</p>
      <p style="margin: 2px 0 0; color: #666; font-size: 14px;">${event.department} Department</p>
    </div>
  </div>
  
  <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #999;">
    This report was generated via EventSphere Management System.
  </div>
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
