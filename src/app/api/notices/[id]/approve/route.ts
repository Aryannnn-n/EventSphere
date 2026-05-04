import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, ApprovalAction, NoticeStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { action, reason } = body; // action: APPROVED | REJECTED

    if (!action) return NextResponse.json({ error: 'Action required' }, { status: 400 });

    const notice = await prisma.notice.findUnique({ where: { id } });
    if (!notice) return NextResponse.json({ error: 'Notice not found' }, { status: 404 });

    const userRole = session.user.role;
    let updateData: any = {};

    if (userRole === Role.HOD) {
      if (notice.department !== session.user.department) {
        return NextResponse.json({ error: 'Forbidden. Different department.' }, { status: 403 });
      }
      updateData = {
        hodReviewAction: action,
        hodReviewReason: reason,
        hodReviewedAt: new Date(),
        status: action === ApprovalAction.APPROVED ? NoticeStatus.PENDING_PRINCIPAL_APPROVAL : NoticeStatus.REJECTED
      };
    } else if (userRole === Role.PRINCIPAL) {
      if (notice.status !== NoticeStatus.PENDING_PRINCIPAL_APPROVAL) {
        return NextResponse.json({ error: 'HOD approval required first' }, { status: 400 });
      }
      updateData = {
        principalAction: action,
        principalReason: reason,
        principalApprovedAt: new Date(),
        status: action === ApprovalAction.APPROVED ? NoticeStatus.APPROVED : NoticeStatus.REJECTED
      };
    } else {
      return NextResponse.json({ error: 'Forbidden. Role not authorized.' }, { status: 403 });
    }

    const updatedNotice = await prisma.notice.update({
      where: { id },
      data: updateData
    });

    // Create notification for host
    await prisma.notification.create({
      data: {
        userId: notice.hostId,
        message: `Your notice "${notice.title}" has been ${action.toLowerCase()} by ${userRole}.`,
      }
    });

    return NextResponse.json(updatedNotice);
  } catch (error) {
    console.error('Approve notice error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
