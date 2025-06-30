import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const demoTrace = [
  {
    node: 'Manual Upload',
    output: 'Uploaded file: data.csv',
  },
  {
    node: 'AI Transform',
    output: '{\n  "transformed": true,\n  "rows": 123\n}',
  },
  {
    node: 'Loop',
    output: 'Processed 10 items',
  },
  {
    node: 'ERP Lookup',
    output: '{\n  "status": "success",\n  "found": 8\n}',
  },
  {
    node: 'CSV Append',
    output: 'Appended 8 rows to output.csv',
  },
];

export function TraceDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [stepsRevealed, setStepsRevealed] = useState(0);
  const revealTimer = useRef<NodeJS.Timeout | null>(null);

  // When file is uploaded, start revealing steps one by one
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUploaded(true);
      setStepsRevealed(1);
      // Reveal each step every 1s for demo
      if (revealTimer.current) clearInterval(revealTimer.current);
      revealTimer.current = setInterval(() => {
        setStepsRevealed(prev => {
          if (prev < demoTrace.length) return prev + 1;
          if (revealTimer.current) clearInterval(revealTimer.current);
          return prev;
        });
      }, 1000);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ boxShadow: 'rgba(0,0,0,0.08) -8px 0px 24px' }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="text-lg font-semibold">Trace</div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close trace">
          <X className="w-5 h-5" />
        </Button>
      </div>
      <div className="overflow-y-auto h-[calc(100%-64px)] px-6 py-4 space-y-6">
        {!fileUploaded ? (
          <div className="border rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center mt-16">
            <div className="font-medium text-gray-700 mb-2 text-lg">Input</div>
            <div className="text-gray-600 mb-4 text-sm text-center">Please select a file to start the workflow execution.</div>
            <input
              type="file"
              accept=".csv,.xlsx,.json,.xml,.pdf,.doc,.docx,.mp4,video/mp4,.txt"
              className="block w-full mb-2"
              onChange={handleFileUpload}
            />
          </div>
        ) : (
          demoTrace.slice(0, stepsRevealed).map((step, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-gray-50">
              <div className="font-medium text-gray-700 mb-2">{step.node}</div>
              <pre className="bg-white rounded p-2 text-xs overflow-x-auto border text-gray-800">
                {step.output}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 