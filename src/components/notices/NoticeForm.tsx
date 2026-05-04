'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type NoticeType = 'EXAM' | 'SCHEDULE' | 'PLACEMENT' | 'GENERAL';

export default function NoticeForm({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<NoticeType>('GENERAL');
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  
  // Placement Fields
  const [placementData, setPlacementData] = useState({
    companyName: '',
    time: '',
    eligibility: '',
    applyLink: '',
    salary: '',
    jobType: '',
    skills: '',
    responsibilities: ''
  });

  // Tabular Fields (for EXAM and SCHEDULE)
  const [tableRows, setTableRows] = useState([{ date: '', subject: '', time: '' }]);

  // General Fields
  const [generalData, setGeneralData] = useState({
    subject: '',
    content: '',
    date: ''
  });

  const addRow = () => setTableRows([...tableRows, { date: '', subject: '', time: '' }]);
  const removeRow = (index: number) => setTableRows(tableRows.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let content: any = {};
    if (type === 'PLACEMENT') content = placementData;
    else if (type === 'EXAM' || type === 'SCHEDULE') content = { rows: tableRows };
    else content = generalData;

    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, content }),
      });

      if (!res.ok) throw new Error('Failed to create notice');

      toast.success(type === 'PLACEMENT' ? 'Notice published successfully!' : 'Notice submitted for review!');
      setIsOpen(false);
      onSuccess();
      // Reset
      setTitle('');
      setPlacementData({ companyName: '', time: '', eligibility: '', applyLink: '', salary: '', jobType: '', skills: '', responsibilities: '' });
      setTableRows([{ date: '', subject: '', time: '' }]);
      setGeneralData({ subject: '', content: '', date: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="rounded-xl">
        <Plus className="w-4 h-4 mr-2" /> Create Notice
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Notice</DialogTitle>
            <DialogDescription>Select the notice type and fill in the details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Notice Type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General Notice</SelectItem>
                    <SelectItem value="EXAM">Exam Notice</SelectItem>
                    <SelectItem value="SCHEDULE">College Schedule</SelectItem>
                    <SelectItem value="PLACEMENT">Placement/Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notice Title</Label>
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit Test-I Time Table" className="rounded-xl h-11" />
              </div>
            </div>

            {/* PLACEMENT FIELDS */}
            {type === 'PLACEMENT' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input required value={placementData.companyName} onChange={(e) => setPlacementData({...placementData, companyName: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Interview Time</Label>
                  <Input required value={placementData.time} onChange={(e) => setPlacementData({...placementData, time: e.target.value})} placeholder="e.g. 10:00 AM onwards" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Student Eligibility</Label>
                  <Input required value={placementData.eligibility} onChange={(e) => setPlacementData({...placementData, eligibility: e.target.value})} placeholder="e.g. Final Year IT/Comp" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Apply Link</Label>
                  <Input required value={placementData.applyLink} onChange={(e) => setPlacementData({...placementData, applyLink: e.target.value})} placeholder="https://..." className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Salary / Stipend</Label>
                  <Input required value={placementData.salary} onChange={(e) => setPlacementData({...placementData, salary: e.target.value})} placeholder="e.g. 4.5 LPA or 15k/month" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Input required value={placementData.jobType} onChange={(e) => setPlacementData({...placementData, jobType: e.target.value})} placeholder="Full-time / Internship" className="rounded-xl" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Required Skills</Label>
                  <Input required value={placementData.skills} onChange={(e) => setPlacementData({...placementData, skills: e.target.value})} placeholder="React, Node.js, SQL..." className="rounded-xl" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Key Responsibilities</Label>
                  <Textarea required value={placementData.responsibilities} onChange={(e) => setPlacementData({...placementData, responsibilities: e.target.value})} className="rounded-xl" />
                </div>
              </div>
            )}

            {/* TABULAR FIELDS (EXAM / SCHEDULE) */}
            {(type === 'EXAM' || type === 'SCHEDULE') && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <Label>Schedule Details</Label>
                {tableRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 items-end border p-3 rounded-xl relative group">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Date</Label>
                      <Input type="date" value={row.date} onChange={(e) => {
                        const newRows = [...tableRows];
                        newRows[index].date = e.target.value;
                        setTableRows(newRows);
                      }} className="h-9 rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Subject</Label>
                      <Input value={row.subject} onChange={(e) => {
                        const newRows = [...tableRows];
                        newRows[index].subject = e.target.value;
                        setTableRows(newRows);
                      }} className="h-9 rounded-lg" />
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="space-y-1 flex-1">
                        <Label className="text-[10px] uppercase">Time</Label>
                        <Input value={row.time} onChange={(e) => {
                          const newRows = [...tableRows];
                          newRows[index].time = e.target.value;
                          setTableRows(newRows);
                        }} placeholder="10:30-1:30" className="h-9 rounded-lg" />
                      </div>
                      {tableRows.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)} className="h-9 w-9 text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addRow} className="w-full rounded-xl border-dashed">
                  <Plus className="w-4 h-4 mr-2" /> Add Row
                </Button>
              </div>
            )}

            {/* GENERAL FIELDS */}
            {type === 'GENERAL' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input required value={generalData.subject} onChange={(e) => setGeneralData({...generalData, subject: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Content (Paragraph)</Label>
                  <Textarea required value={generalData.content} onChange={(e) => setGeneralData({...generalData, content: e.target.value})} className="rounded-xl min-h-[150px]" />
                </div>
                <div className="space-y-2">
                  <Label>Notice Date</Label>
                  <Input type="date" required value={generalData.date} onChange={(e) => setGeneralData({...generalData, date: e.target.value})} className="rounded-xl" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={loading} className="rounded-xl px-8">
                {loading ? 'Submitting...' : type === 'PLACEMENT' ? 'Publish Immediately' : 'Submit for Approval'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
