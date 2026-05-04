import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PrintButton from './PrintButton';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function NoticePage({ params }: RouteParams) {
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
      <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <article className="mx-auto max-w-4xl bg-white shadow-xl print:shadow-none px-16 py-10 print:p-8 text-black">
        <header className="text-center mb-6">
          <h1 className="text-2xl md:text-[26px] font-semibold leading-snug text-gray-900">
            MET's Institute of Technology, Polytechnic
            <br />
            Bhujbal Knowledge City,
            <br />
            Adgaon, Nashik.
          </h1>
        </header>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold underline decoration-2 underline-offset-4">NOTICE</h2>
        </div>

        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-900 text-lg font-semibold">Department: {event.department}</p>
          <p className="text-gray-900 text-lg font-semibold">Date: {letterDate}</p>
        </div>

        <p className="text-gray-900 text-lg mb-6">
          <span className="font-semibold">Subject:</span> Notice regarding "{event.title}"
        </p>

        <div className="space-y-4 text-gray-900 text-lg leading-relaxed mb-8">
          <p>
            All the students of {event.department} department are hereby informed that our department is organizing an event <strong>"{event.title}"</strong>. 
          </p>
          <p>
            The details of the event are as follows:
            <br/>
            <strong>Date:</strong> {eventDate}
            <br/>
            <strong>Time:</strong> {event.time}
            <br/>
            <strong>Venue:</strong> {event.venue}
            <br/>
            <strong>Guest:</strong> {event.guestName}
          </p>
          <p>
            {event.description}
          </p>
          <p>
            All students are required to attend the event punctually. Attendance will be recorded.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 items-end mt-16 text-center">
          <div className="text-gray-900 text-left">
            <div className="h-12 mb-1 flex flex-col justify-end">
              <span className="inline-block text-sm text-blue-600 mb-1">
                Digitally Signed<br/>{new Date(event.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-lg font-medium">{event.host.name}</p>
            <p className="text-gray-600 text-base">Event Coordinator</p>
          </div>

          <div className="text-gray-900">
            <div className="h-12 mb-1 flex flex-col items-center justify-end">
              {event.hodSignedAt && (
                <span className="inline-block text-sm text-blue-600 mb-1">
                  Digitally Signed<br/>{new Date(event.hodSignedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-lg font-medium mb-1">Head of Department</p>
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
            <p className="text-gray-600 text-base">MET's Institute of Tech.</p>
          </div>
        </div>
      </article>
    </div>
  );
}
