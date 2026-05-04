import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import PrintButton from './PrintButton';
import { auth } from '@/lib/auth';
import EditableDocument from '@/components/events/EditableDocument';

import Image from 'next/image';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function LetterPage({ params }: RouteParams) {
  const { id } = await params;
  
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      host: true,
    }
  });

  if (!event) {
    notFound();
  }

  const session = await auth();
  const isHost = session?.user?.id === event.hostId;

  // Format date
  const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const letterDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const defaultHtml = `
<p><span class="font-semibold">Subject:</span> Invitation as a Guest for "${event.title}"</p>
<br/>
<p>Dear ${event.guestName},</p>
<p>We are pleased to invite you as a guest for the upcoming event <strong>"${event.title}"</strong> organized by the ${event.department} department.</p>
<p>The details of the event are as follows:<br/>
<strong>Date:</strong> ${eventDate}<br/>
<strong>Time:</strong> ${event.time}<br/>
<strong>Venue:</strong> ${event.venue}</p>
<p>We look forward to your gracious presence and valuable insights, which will greatly benefit our students and staff.</p>
<p>Thank you.</p>
`;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 print:bg-white print:p-0">
      {/* Print button - hidden when printing */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      {/* Notice paper */}
      <article className="mx-auto max-w-4xl bg-white shadow-xl print:shadow-none px-16 py-10 print:p-8 text-black">
        {/* Header with Logo */}
        <header className="flex items-center justify-center gap-6 mb-8 border-b-2 border-black pb-6">
          <div className="shrink-0">
            <Image src="/logo.png" alt="MET Logo" width={100} height={100} className="object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl md:text-[28px] font-bold leading-tight text-black">
              MET's Institute of Technology, Polytechnic
            </h1>
            <p className="text-lg font-medium text-gray-800">Bhujbal Knowledge City, Adgaon, Nashik - 422003</p>
            <p className="text-sm font-medium text-gray-600 mt-1 uppercase tracking-wider">Affiliated to MSBTE | Approved by AICTE</p>
          </div>
        </header>

        {/* Date */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-900 text-lg">Ref No: MET/ITP/{new Date().getFullYear()}/{event.id.substring(0, 4).toUpperCase()}</p>
          <p className="text-gray-900 text-lg">Date: {letterDate}</p>
        </div>

        {/* To */}
        <p className="text-gray-900 text-lg mb-2">To,</p>
        <div className="text-gray-900 text-lg mb-6 font-medium pl-4">
          <p>{event.guestName}</p>
        </div>

        {/* Body */}
        <EditableDocument 
          eventId={event.id}
          documentType="letter"
          isHost={isHost}
          customHtml={event.customLetterHtml}
          defaultHtml={defaultHtml}
        />

        {/* Footer / signature area */}
        <div className="flex justify-between items-end mt-16">
          <div className="text-gray-900 text-left">
            <div className="h-12 mb-1 flex flex-col justify-end">
              {event.hodSignedAt && (
                <span className="inline-block text-sm text-blue-600 mb-1">
                  Digitally Signed<br/>{new Date(event.hodSignedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-lg font-medium">Head of Department</p>
            <p className="text-gray-600 text-base">{event.department}</p>
          </div>
          <div className="text-gray-900 text-right">
            <div className="h-12 mb-1 flex flex-col items-end justify-end">
              {event.principalApprovedAt && (
                <span className="inline-block text-sm text-blue-600 mb-1">
                  Digitally Signed<br/>{new Date(event.principalApprovedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-lg font-medium mb-1">Principal</p>
            <p className="text-gray-600 text-base">MET's Institute of Tech; Polytechnic</p>
            <p className="text-gray-600 text-base">Bhujbal Knowledge City,</p>
            <p className="text-gray-600 text-base">Adgaon, Nashik-422 003</p>
          </div>
        </div>
      </article>
    </div>
  );
}
