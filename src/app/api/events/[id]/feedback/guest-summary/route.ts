// ONE CLICK — sends NLP feedback summary to guest

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "HOST") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // ── Fetch event with host info ────────────────────────────────────────
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        host: { select: { name: true, email: true, designation: true } },
        attendance: true,
        feedback: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.hostId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (event.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Event must be completed before sending guest summary" },
        { status: 400 }
      );
    }

    // ── Fetch NLP results ─────────────────────────────────────────────────
    const nlpResult = await prisma.nLPResult.findUnique({
      where: { eventId: id },
    });

    if (!nlpResult) {
      return NextResponse.json(
        {
          error:
            "NLP analysis not yet performed. Please run feedback analysis first.",
        },
        { status: 400 }
      );
    }

    // ── Calculate stats ───────────────────────────────────────────────────
    const totalAttended = event.attendance.length;
    const totalFeedback = event.feedback.length;
    const avgRating =
      totalFeedback > 0
        ? event.feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
        : 0;

    const stars = "★".repeat(Math.round(avgRating)) +
                  "☆".repeat(5 - Math.round(avgRating));

    // ── Build keyword pills HTML ──────────────────────────────────────────
    const keywordPills = nlpResult.keywords
      .map(
        (kw) =>
          `<span style="display:inline-block; background:#e8f4fd; color:#1a6fa8; padding:4px 12px; border-radius:20px; font-size:13px; margin:3px;">${kw}</span>`
      )
      .join(" ");

    // ── Sentiment bar HTML ────────────────────────────────────────────────
    const sentimentBar = `
      <div style="margin: 16px 0;">
        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;">
          <span style="color:#28a745;">Positive ${nlpResult.positivePercent}%</span>
          <span style="color:#6c757d;">Neutral ${nlpResult.neutralPercent}%</span>
          <span style="color:#dc3545;">Negative ${nlpResult.negativePercent}%</span>
        </div>
        <div style="height:12px; border-radius:6px; overflow:hidden; display:flex; background:#e9ecef;">
          <div style="width:${nlpResult.positivePercent}%; background:#28a745;"></div>
          <div style="width:${nlpResult.neutralPercent}%; background:#adb5bd;"></div>
          <div style="width:${nlpResult.negativePercent}%; background:#dc3545;"></div>
        </div>
      </div>
    `;

    const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    // ── Build the full email HTML ─────────────────────────────────────────
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">
        <div style="max-width:620px; margin:30px auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background:#1a1a2e; padding:28px 36px;">
            <h1 style="margin:0; color:#ffffff; font-size:22px; letter-spacing:0.5px;">EventSphere</h1>
            <p style="margin:4px 0 0; color:#aaaaaa; font-size:13px;">
              ${process.env.NEXT_PUBLIC_COLLEGE_NAME || "MET's Institute of Technology"} — ${event.department}
            </p>
          </div>

          <!-- Body -->
          <div style="padding:36px;">

            <h2 style="margin:0 0 8px; color:#1a1a2e; font-size:20px;">
              Student Feedback Summary
            </h2>
            <p style="margin:0 0 24px; color:#555; font-size:14px;">
              Thank you for your valuable contribution to our institution.
              Here is a summary of how students responded to your session.
            </p>

            <!-- Event Info Box -->
            <div style="background:#f8f9fa; border-left:4px solid #1a1a2e; padding:18px; border-radius:4px; margin-bottom:24px;">
              <p style="margin:0 0 6px; font-size:14px;"><strong>Event:</strong> ${event.title}</p>
              <p style="margin:0 0 6px; font-size:14px;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin:0 0 6px; font-size:14px;"><strong>Venue:</strong> ${event.venue}</p>
              <p style="margin:0 0 6px; font-size:14px;"><strong>Organized by:</strong> ${event.host.name}</p>
              <p style="margin:0; font-size:14px;"><strong>Department:</strong> ${event.department}</p>
            </div>

            <!-- Attendance + Rating Stats -->
            <div style="display:flex; gap:16px; margin-bottom:24px;">
              <div style="flex:1; background:#e8f5e9; border-radius:8px; padding:16px; text-align:center;">
                <div style="font-size:28px; font-weight:bold; color:#2e7d32;">${totalAttended}</div>
                <div style="font-size:12px; color:#555; margin-top:4px;">Students Attended</div>
              </div>
              <div style="flex:1; background:#e3f2fd; border-radius:8px; padding:16px; text-align:center;">
                <div style="font-size:28px; font-weight:bold; color:#1565c0;">${totalFeedback}</div>
                <div style="font-size:12px; color:#555; margin-top:4px;">Feedback Responses</div>
              </div>
              <div style="flex:1; background:#fff8e1; border-radius:8px; padding:16px; text-align:center;">
                <div style="font-size:20px; font-weight:bold; color:#f57f17;">${stars}</div>
                <div style="font-size:13px; color:#333; margin-top:2px;">${avgRating.toFixed(1)} / 5.0</div>
                <div style="font-size:12px; color:#555;">Average Rating</div>
              </div>
            </div>

            <!-- Sentiment Analysis -->
            <h3 style="color:#1a1a2e; font-size:16px; margin:0 0 8px;">Sentiment Analysis</h3>
            <p style="margin:0 0 8px; color:#555; font-size:13px;">
              Based on NLP analysis of ${totalFeedback} student responses:
            </p>
            ${sentimentBar}

            <!-- Summary -->
            <h3 style="color:#1a1a2e; font-size:16px; margin:24px 0 8px;">What Students Said</h3>
            <div style="background:#f8f9fa; border-radius:8px; padding:18px; margin-bottom:24px;">
              <p style="margin:0; color:#333; font-size:14px; line-height:1.8; font-style:italic;">
                "${nlpResult.summary}"
              </p>
            </div>

            <!-- Keywords -->
            <h3 style="color:#1a1a2e; font-size:16px; margin:0 0 10px;">Key Themes from Feedback</h3>
            <div style="margin-bottom:28px;">
              ${keywordPills}
            </div>

            <!-- Thank you note -->
            <div style="border-top:1px solid #eee; padding-top:20px; margin-top:8px;">
              <p style="color:#333; font-size:14px; line-height:1.7; margin:0;">
                We deeply appreciate your time and expertise. The overwhelmingly positive 
                response from our students reflects the quality of your session. 
                We hope to have you with us again in the future.
              </p>
              <p style="color:#333; font-size:14px; margin:16px 0 0;">
                Warm regards,<br/>
                <strong>${event.host.name}</strong><br/>
                ${event.host.designation || "Faculty"}<br/>
                ${event.department}<br/>
                ${process.env.NEXT_PUBLIC_COLLEGE_NAME || "MET's Institute of Technology"}
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background:#f8f9fa; padding:16px 36px; text-align:center; border-top:1px solid #eee;">
            <p style="margin:0; font-size:12px; color:#888;">
              This feedback summary was generated automatically by EventSphere.<br/>
              ${process.env.NEXT_PUBLIC_COLLEGE_NAME || "MET's Institute of Technology"}, Nashik
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    // ── Send email ────────────────────────────────────────────────────────
    await sendEmail({
      to: event.guestEmail,
      subject: `Student Feedback Summary — ${event.title} | ${process.env.NEXT_PUBLIC_COLLEGE_NAME || "MET's Institute of Technology"}`,
      html: emailHtml,
    });

    return NextResponse.json({
      data: {
        message: `Feedback summary successfully sent to ${event.guestEmail}`,
        sentTo: event.guestEmail,
        guestName: event.guestName,
        stats: {
          totalAttended,
          totalFeedback,
          avgRating: avgRating.toFixed(1),
          positivePercent: nlpResult.positivePercent,
          neutralPercent: nlpResult.neutralPercent,
          negativePercent: nlpResult.negativePercent,
        },
      },
    });
  } catch (error) {
    console.error("Guest summary email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
