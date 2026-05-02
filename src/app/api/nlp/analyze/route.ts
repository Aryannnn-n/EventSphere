import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/nlp/analyze
// Body: { eventId: string }
// Called by Host after event is completed and feedback is collected

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["HOST", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // ── Step 1: Verify event exists and is completed ──────────────────────
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "NLP analysis is only available for completed events" },
        { status: 400 }
      );
    }

    // ── Step 2: Fetch all feedback for this event ─────────────────────────
    const feedbacks = await prisma.feedback.findMany({
      where: { eventId },
      select: {
        id: true,
        comment: true,
        rating: true,
      },
    });

    if (feedbacks.length === 0) {
      return NextResponse.json(
        { error: "No feedback found for this event. Cannot analyze." },
        { status: 400 }
      );
    }

    // ── Step 3: Check if Python NLP service is reachable ─────────────────
    const nlpServiceUrl = process.env.NLP_SERVICE_URL || "http://127.0.0.1:5000";

    try {
      const healthCheck = await fetch(`${nlpServiceUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });

      if (!healthCheck.ok) {
        return NextResponse.json(
          { error: "NLP service is not available. Please start the Python service." },
          { status: 503 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          error:
            "Cannot connect to NLP service. Make sure Python Flask server is running on port 5000.",
        },
        { status: 503 }
      );
    }

    // ── Step 4: Call Python NLP service ──────────────────────────────────
    const nlpResponse = await fetch(`${nlpServiceUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        feedbacks: feedbacks.map((f) => ({
          id: f.id,
          comment: f.comment,
        })),
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout for large batches
    });

    if (!nlpResponse.ok) {
      const errorData = await nlpResponse.json();
      return NextResponse.json(
        { error: errorData.error || "NLP analysis failed" },
        { status: 500 }
      );
    }

    const nlpData = await nlpResponse.json();

    // ── Step 5: Update individual feedback records with sentiment ─────────
    for (const result of nlpData.results) {
      await prisma.feedback.update({
        where: { id: result.id },
        data: { sentiment: result.sentiment },
      });
    }

    // ── Step 6: Save or update NLPResult in DB ────────────────────────────
    const stats = nlpData.stats;

    const nlpResult = await prisma.nLPResult.upsert({
      where: { eventId },
      update: {
        positiveCount: stats.positiveCount,
        neutralCount: stats.neutralCount,
        negativeCount: stats.negativeCount,
        positivePercent: stats.positivePercent,
        neutralPercent: stats.neutralPercent,
        negativePercent: stats.negativePercent,
        keywords: nlpData.keywords,
        summary: nlpData.summary,
        analyzedAt: new Date(),
      },
      create: {
        eventId,
        positiveCount: stats.positiveCount,
        neutralCount: stats.neutralCount,
        negativeCount: stats.negativeCount,
        positivePercent: stats.positivePercent,
        neutralPercent: stats.neutralPercent,
        negativePercent: stats.negativePercent,
        keywords: nlpData.keywords,
        summary: nlpData.summary,
      },
    });

    // ── Step 7: Return full results ───────────────────────────────────────
    return NextResponse.json({
      data: {
        message: `Successfully analyzed ${feedbacks.length} feedback responses.`,
        nlpResult,
        individualResults: nlpData.results,
      },
    });
  } catch (error) {
    console.error("NLP analyze route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
