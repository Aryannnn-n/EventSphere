import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import PrintButton from './PrintButton';

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

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 print:bg-white print:p-0">
      {/* Print button - hidden when printing */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      {/* Notice paper */}
      <article className="mx-auto max-w-4xl bg-white shadow-xl print:shadow-none px-16 py-14 print:p-12 text-black">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-2xl md:text-[26px] font-semibold leading-relaxed text-gray-900">
            MET's Institute of Technology, Polytechnic
            <br />
            Bhujbal Knowledge City,
            <br />
            Adgaon, Nashik.
          </h1>
        </header>

        {/* Date */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-900 text-lg">Ref No: MET/ITP/{new Date().getFullYear()}/{event.id.substring(0, 4).toUpperCase()}</p>
          <p className="text-gray-900 text-lg">Date: {letterDate}</p>
        </div>

        {/* To */}
        <p className="text-gray-900 text-lg mb-2">To,</p>
        <div className="text-gray-900 text-lg mb-8 font-medium pl-4">
          <p>{event.guestName}</p>
        </div>

        {/* Subject */}
        <p className="text-gray-900 text-lg mb-8">
          <span className="font-semibold">Subject:</span> Invitation as a Guest for "{event.title}"
        </p>

        {/* Body */}
        <div className="space-y-6 text-gray-900 text-lg leading-loose mb-12">
          <p>
            Dear {event.guestName},
          </p>
          <p>
            We are pleased to invite you as a guest for the upcoming event <strong>"{event.title}"</strong> organized by the {event.department} department.
          </p>
          <p>
            The details of the event are as follows:
            <br/>
            <strong>Date:</strong> {eventDate}
            <br/>
            <strong>Time:</strong> {event.time}
            <br/>
            <strong>Venue:</strong> {event.venue}
          </p>
          <p>
            We look forward to your gracious presence and valuable insights, which will greatly benefit our students and staff.
          </p>
          <p>
            Thank you.
          </p>
        </div>

        {/* Footer / signature area */}
        <div className="flex justify-between items-end mt-32">
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
