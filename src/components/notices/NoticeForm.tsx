'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Info } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type NoticeType = 'EXAM' | 'SCHEDULE' | 'PLACEMENT' | 'GENERAL';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 12:30 (Lunch)',
  '12:30 - 01:30',
  '01:30 - 02:30'
];

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
    responsibilities: '',
    lastDate: ''
  });

  // Exam Fields
  const [examRows, setExamRows] = useState([{ date: '', subject: '', time: '' }]);
  const [examParagraph, setExamParagraph] = useState('');

  // Schedule Fields
  const [scheduleInfo, setScheduleInfo] = useState({ year: '', branch: '' });
  const [scheduleTable, setScheduleTable] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    DAYS.forEach(day => {
      initial[day] = Array(TIME_SLOTS.length).fill('');
    });
    return initial;
  });

  // General Fields
  const [generalData, setGeneralData] = useState({
    subject: '',
    content: '',
    date: ''
  });

  const resetForm = () => {
    setTitle('');
    setPlacementData({ companyName: '', time: '', eligibility: '', applyLink: '', salary: '', jobType: '', skills: '', responsibilities: '', lastDate: '' });
    setExamRows([{ date: '', subject: '', time: '' }]);
    setExamParagraph('');
    setScheduleInfo({ year: '', branch: '' });
    setGeneralData({ subject: '', content: '', date: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let content: any = {};
    if (type === 'PLACEMENT') content = placementData;
    else if (type === 'EXAM') content = { rows: examRows, paragraph: examParagraph };
    else if (type === 'SCHEDULE') content = { ...scheduleInfo, timetable: scheduleTable, slots: TIME_SLOTS, days: DAYS };
    else content = generalData;

    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, content }),
      });

      if (!res.ok) throw new Error('Failed to create notice');

      toast.success(type === 'PLACEMENT' ? 'Opportunity published!' : 'Notice submitted for review!');
      setIsOpen(false);
      onSuccess();
      resetForm();
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
        <DialogContent className="sm:max-w-[1100px] w-[95vw] max-h-[92vh] overflow-y-auto rounded-2xl p-6 md:p-10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">Create New Institutional Notice</DialogTitle>
            <DialogDescription className="text-lg">Select the appropriate type to generate a structured document.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-10 pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-semibold">Notice Type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="GENERAL">General Notice</SelectItem>
                    <SelectItem value="EXAM">Exam Notice</SelectItem>
                    <SelectItem value="SCHEDULE">College Schedule</SelectItem>
                    <SelectItem value="PLACEMENT">Placement/Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Main Title</Label>
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SEMESTER END EXAMINATION" className="rounded-xl h-11" />
              </div>
            </div>

            {/* PLACEMENT / OPPORTUNITY FIELDS */}
            {type === 'PLACEMENT' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 border p-6 rounded-2xl bg-muted/20">
                <div className="space-y-1"><Label className="text-sm">Company Name</Label><Input required value={placementData.companyName} onChange={(e) => setPlacementData({...placementData, companyName: e.target.value})} className="h-10 rounded-lg" /></div>
                <div className="space-y-1"><Label className="text-sm">Interview Time</Label><Input required value={placementData.time} onChange={(e) => setPlacementData({...placementData, time: e.target.value})} placeholder="e.g. 10 AM" className="h-10 rounded-lg" /></div>
                <div className="space-y-1"><Label className="text-sm">Eligibility</Label><Input required value={placementData.eligibility} onChange={(e) => setPlacementData({...placementData, eligibility: e.target.value})} className="h-10 rounded-lg" /></div>
                <div className="space-y-1"><Label className="text-sm">Last Date to Apply</Label><Input required type="date" value={placementData.lastDate} onChange={(e) => setPlacementData({...placementData, lastDate: e.target.value})} className="h-10 rounded-lg" /></div>
                <div className="space-y-1"><Label className="text-sm">Salary / Stipend</Label><Input required value={placementData.salary} onChange={(e) => setPlacementData({...placementData, salary: e.target.value})} className="h-10 rounded-lg" /></div>
                <div className="space-y-1"><Label className="text-sm">Apply Link</Label><Input required value={placementData.applyLink} onChange={(e) => setPlacementData({...placementData, applyLink: e.target.value})} className="h-10 rounded-lg" /></div>
                <div className="space-y-1 col-span-2"><Label className="text-sm">Required Skills</Label><Input required value={placementData.skills} onChange={(e) => setPlacementData({...placementData, skills: e.target.value})} className="h-10 rounded-lg" /></div>
                <div className="space-y-1 col-span-2"><Label className="text-sm">Key Responsibilities</Label><Textarea required value={placementData.responsibilities} onChange={(e) => setPlacementData({...placementData, responsibilities: e.target.value})} className="min-h-[80px] rounded-lg" /></div>
              </div>
            )}

            {/* EXAM FIELDS */}
            {type === 'EXAM' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 border p-6 rounded-2xl bg-muted/20">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-lg font-bold">Exam Time Table</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setExamRows([...examRows, { date: '', subject: '', time: '' }])} className="rounded-lg h-8 text-xs border-primary text-primary hover:bg-primary/5"><Plus className="w-3 h-3 mr-1" /> Add Row</Button>
                </div>
                
                <div className="overflow-hidden border rounded-xl bg-background">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="p-2 text-left font-bold text-muted-foreground w-1/4">Date</th>
                        <th className="p-2 text-left font-bold text-muted-foreground w-1/2">Subject Name</th>
                        <th className="p-2 text-left font-bold text-muted-foreground w-1/4">Time Slot</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {examRows.map((row, i) => (
                        <tr key={i} className="group">
                          <td className="p-1">
                            <Input type="date" value={row.date} onChange={(e) => {
                              const n = [...examRows]; n[i].date = e.target.value; setExamRows(n);
                            }} className="border-0 shadow-none focus-visible:ring-1 h-9 rounded-md" />
                          </td>
                          <td className="p-1">
                            <Input value={row.subject} onChange={(e) => {
                              const n = [...examRows]; n[i].subject = e.target.value; setExamRows(n);
                            }} placeholder="e.g. Applied Mathematics" className="border-0 shadow-none focus-visible:ring-1 h-9 rounded-md" />
                          </td>
                          <td className="p-1">
                            <Input value={row.time} onChange={(e) => {
                              const n = [...examRows]; n[i].time = e.target.value; setExamRows(n);
                            }} placeholder="10:30-1:30" className="border-0 shadow-none focus-visible:ring-1 h-9 rounded-md" />
                          </td>
                          <td className="p-1 text-center">
                            {examRows.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => setExamRows(examRows.filter((_, idx) => idx !== i))} className="h-8 w-8 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-1 mt-4">
                  <Label className="font-bold text-xs">Additional Instructions (Optional)</Label>
                  <Textarea value={examParagraph} onChange={(e) => setExamParagraph(e.target.value)} placeholder="Rules for exam day..." className="min-h-[60px] rounded-lg text-sm" />
                </div>
              </div>
            )}

            {/* COLLEGE SCHEDULE (WEEKLY) */}
            {type === 'SCHEDULE' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 border p-6 rounded-2xl bg-muted/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-sm font-bold">Branch</Label><Input required value={scheduleInfo.branch} onChange={(e) => setScheduleInfo({...scheduleInfo, branch: e.target.value})} className="h-10 rounded-lg" /></div>
                  <div className="space-y-1"><Label className="text-sm font-bold">Year / Semester</Label><Input required value={scheduleInfo.year} onChange={(e) => setScheduleInfo({...scheduleInfo, year: e.target.value})} className="h-10 rounded-lg" /></div>
                </div>
                
                <div className="overflow-x-auto border rounded-xl bg-background">
                  <table className="w-full text-xs border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border p-2 w-32">Time Slot</th>
                        {DAYS.map(day => <th key={day} className="border p-2">{day}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_SLOTS.map((slot, sIdx) => (
                        <tr key={slot}>
                          <td className="border p-2 font-bold bg-muted/20 text-center">{slot}</td>
                          {DAYS.map(day => (
                            <td key={day} className="border p-0.5">
                              {slot.includes('Lunch') ? (
                                <div className="text-[9px] text-center text-muted-foreground uppercase py-1">BREAK</div>
                              ) : (
                                <Input 
                                  value={scheduleTable[day][sIdx]} 
                                  onChange={(e) => {
                                    const n = { ...scheduleTable };
                                    n[day][sIdx] = e.target.value;
                                    setScheduleTable(n);
                                  }}
                                  className="border-0 shadow-none focus-visible:ring-1 rounded-sm text-[11px] h-8 p-1"
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* GENERAL FIELDS */}
            {type === 'GENERAL' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 border p-8 rounded-3xl bg-muted/20">
                <div className="space-y-3"><Label className="font-bold">Document Subject</Label><Input required value={generalData.subject} onChange={(e) => setGeneralData({...generalData, subject: e.target.value})} className="h-12 rounded-xl" /></div>
                <div className="space-y-3"><Label className="font-bold">Full Content (Paragraphs)</Label><Textarea required value={generalData.content} onChange={(e) => setGeneralData({...generalData, content: e.target.value})} className="min-h-[250px] rounded-xl text-lg" /></div>
                <div className="space-y-3"><Label className="font-bold">Official Notice Date</Label><Input type="date" required value={generalData.date} onChange={(e) => setGeneralData({...generalData, date: e.target.value})} className="h-12 rounded-xl" /></div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-11 px-8 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={loading} className="h-11 px-10 rounded-xl font-bold">
                {loading ? 'Processing...' : type === 'PLACEMENT' ? 'Publish Opportunity' : 'Submit for Review'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
