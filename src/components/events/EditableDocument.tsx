'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface EditableDocumentProps {
  eventId: string;
  documentType: 'letter' | 'notice';
  isHost: boolean;
  customHtml: string | null;
  defaultHtml: string;
}

export default function EditableDocument({
  eventId,
  documentType,
  isHost,
  customHtml,
  defaultHtml,
}: EditableDocumentProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(customHtml || defaultHtml);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (!editorRef.current) return;
    
    setIsSaving(true);
    const newHtml = editorRef.current.innerHTML;
    
    try {
      const payload = documentType === 'letter' 
        ? { customLetterHtml: newHtml } 
        : { customNoticeHtml: newHtml };
        
      const res = await fetch(`/api/events/${eventId}/document`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save document');
      }
      
      setContent(newHtml);
      setIsEditing(false);
      toast.success('Document updated successfully');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(customHtml || defaultHtml);
    setIsEditing(false);
  };

  return (
    <div className="relative group">
      {isHost && !isEditing && (
        <div className="absolute -top-12 right-0 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2 bg-white shadow-sm hover:bg-gray-50">
            <Edit2 className="w-4 h-4" /> Edit Text
          </Button>
        </div>
      )}
      
      {isEditing && (
        <div className="absolute -top-14 right-0 print:hidden flex gap-2 z-10 bg-white p-1.5 rounded-xl shadow-md border">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="rounded-lg">
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-lg">
            <Save className="w-4 h-4 mr-1" /> {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}

      <div 
        ref={editorRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        className={`space-y-4 text-gray-900 text-lg leading-relaxed mb-8 outline-none ${
          isEditing ? 'border-2 border-primary/50 rounded-xl p-4 bg-muted/10 min-h-[200px]' : ''
        }`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
