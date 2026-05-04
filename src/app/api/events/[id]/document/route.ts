import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.HOST) {
      return NextResponse.json({ error: 'Forbidden. Only Host can edit.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (event.hostId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Ensure we only update the document HTML fields
    const dataToUpdate: any = {};
    if (body.customLetterHtml !== undefined) dataToUpdate.customLetterHtml = body.customLetterHtml;
    if (body.customNoticeHtml !== undefined) dataToUpdate.customNoticeHtml = body.customNoticeHtml;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
