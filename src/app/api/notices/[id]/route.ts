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
    const notice = await prisma.notice.findUnique({
      where: { id },
      include: {
        host: { select: { name: true, department: true } }
      }
    });

    if (!notice) return NextResponse.json({ error: 'Notice not found' }, { status: 404 });

    return NextResponse.json(notice);
  } catch (error) {
    console.error('Fetch notice error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const notice = await prisma.notice.findUnique({ where: { id } });
    if (!notice) return NextResponse.json({ error: 'Notice not found' }, { status: 404 });

    // Only host can edit their own notice
    if (notice.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedNotice = await prisma.notice.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
        // Reset status if edited, unless it's placement which stays approved
        status: notice.type === 'PLACEMENT' ? 'APPROVED' : 'PENDING_HOD_REVIEW',
        hodReviewAction: null,
        principalAction: null,
      }
    });

    return NextResponse.json(updatedNotice);
  } catch (error) {
    console.error('Update notice error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const notice = await prisma.notice.findUnique({ where: { id } });
    if (!notice) return NextResponse.json({ error: 'Notice not found' }, { status: 404 });

    if (notice.hostId !== session.user.id && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.notice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notice error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
