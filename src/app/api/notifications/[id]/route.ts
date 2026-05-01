import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (notification.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
