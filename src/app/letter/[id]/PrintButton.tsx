'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  const handlePrint = () => window.print();

  return (
    <Button onClick={handlePrint} size="lg" className="gap-2">
      <Printer className="w-4 h-4" />
      Print Notice
    </Button>
  );
}
