import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NoticeType, NoticeStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as NoticeStatus | null;
    const type = searchParams.get('type') as NoticeType | null;

    const notices = await prisma.notice.findMany({
      where: {
        AND: [
          status ? { status } : {},
          type ? { type } : {},
          session.user.role === Role.HOST ? { hostId: session.user.id } : {},
          session.user.role === Role.HOD ? { department: session.user.department as string } : {},
          session.user.role === Role.STUDENT ? { 
            AND: [
              { status: NoticeStatus.APPROVED },
              { department: session.user.department as string }
            ]
          } : {},
        ]
      },
      include: {
        host: { select: { name: true, department: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(notices);
  } catch (error) {
    console.error('Fetch notices error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.HOST) {
      return NextResponse.json({ error: 'Only hosts can create notices' }, { status: 403 });
    }

    const body = await req.json();
    const { type, title, content } = body;

    if (!type || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get department from session or fetch from DB if missing
    let department = session.user.department;
    if (!department) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      department = user?.department ?? null;
    }

    if (!department) {
      return NextResponse.json({ error: 'User department not found' }, { status: 400 });
    }

    // Placement notices are auto-approved as per user requirement
    const status = type === NoticeType.PLACEMENT ? NoticeStatus.APPROVED : NoticeStatus.PENDING_HOD_REVIEW;

    const notice = await prisma.notice.create({
      data: {
        type,
        title,
        content,
        department,
        hostId: session.user.id,
        status,
      }
    });

    return NextResponse.json(notice);
  } catch (error) {
    console.error('Create notice error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
