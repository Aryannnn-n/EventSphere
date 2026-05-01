import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EventSphere — College Event Management',
  description:
    'Automated Event Management System for MET\'s Institute of Technology. Streamline event proposals, approvals, attendance tracking, and reporting.',
  keywords: ['college events', 'event management', 'MET', 'EventSphere'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                borderRadius: '12px',
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
