import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const completedBomCsv = `Manufacturer Part Number,Description,Manufacturer,Quantity,Reference Designators\nCRG0603F10K,10kΩ 0603 1% Resistor,TE_Connectivity,1,R1,\nCRG0603F10K,10kΩ 0603 1% Resistor,TE_Connectivity,1,R2,\nC0805C103K1RACTU,10nF 50V X7R 0805 Capacitor,KEMET,1,C1,\nAS1115-BSST,LED Driver 24-QSOP,ams,1,U1,\n1N4148-T,Switching Diode,Diodes_Inc,1,D1,`;

const demoTrace = [
  {
    node: 'Manual Upload',
    output: 'Uploaded file: space-delimited-bom.txt',
  },
  {
    node: 'Structured Generation',
    output: '{\n  "transformed": true,\n  "rows": 123\n}',
    data: completedBomCsv,
  },
  {
    node: 'Loop',
    output: 'Processed 10 items',
  },
  {
    node: 'AI Web Search',
    output: '{\n  "status": "success",\n  "found": 8\n}',
  },
  {
    node: 'CSV Append',
    output: 'Appended 8 rows to output.csv',
  },
  {
    node: 'ERP BOM Generation',
    output: 'Wrote Data',
  },
];

// Simple CSV parser for demo (no quoted fields)
function parseCsv(csv: string): string[][] {
  return csv.trim().split(/\r?\n/).map(line => line.split(','));
}

function CsvTable({ csv }: { csv: string }) {
  const rows = parseCsv(csv);
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-xs">
        <thead>
          <tr>
            {rows[0].map((cell, i) => (
              <th key={i} className="border px-2 py-1 bg-gray-100 text-left font-semibold">{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border px-2 py-1">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
              <pre className="bg-white rounded p-2 text-xs overflow-x-auto border text-gray-800 mb-2">
                {step.output}
              </pre>
              {step.data && (
                <div>
                  <div className="font-semibold text-xs text-gray-600 mb-1">Data</div>
                  {/* If data looks like CSV, render as table; else fallback to code block */}
                  {step.data.includes(',') && step.data.includes('\n') ? (
                    <CsvTable csv={step.data} />
                  ) : (
                    <pre className="bg-white rounded p-2 text-xs overflow-x-auto border text-gray-800">{step.data}</pre>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 