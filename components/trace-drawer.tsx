import { useState, useRef, useEffect } from 'react';
import { X, Download, FileUp, Wand2, Globe, FileSpreadsheet, ChevronDown, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import path from 'path';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const completedBomCsv = `Manufacturer Part Number,Description,Manufacturer,Quantity,Reference Designators\nCRG0603F10K,10kΩ 0603 1% Resistor,TE_Connectivity,1,R1,\nCRG0603F10K,10kΩ 0603 1% Resistor,TE_Connectivity,1,R2,\nC0805C103K1RACTU,10nF 50V X7R 0805 Capacitor,KEMET,1,C1,\nAS1115-BSST,LED Driver 24-QSOP,ams,1,U1,\n1N4148-T,Switching Diode,Diodes_Inc,1,D1,`;

const bomNiceCsv = `RefDes,MPN,Manufacturer,Qty,Description,Notes\nR1,CRG0603F10K,TE_Connectivity,1,10kΩ 0603 1% Resistor,-\nR2,CRG0603F10K,TE_Connectivity,1,10kΩ 0603 1% Resistor,-\nC1,C0805C103K1RACTU,KEMET,1,10nF 50V X7R 0805 Capacitor,Alternate for C1\nU1,AS1115-BSST,ams,1,LED Driver 24-QSOP,-\nD1,1N4148-T,Diodes_Inc,1,Switching Diode,Fast\nR3,-,-,1,1kΩ 0603 Resistor,No PN provided`;

const supplierFiles = [
  'artifacts/supplier/CRG0603F10K.csv',
  'artifacts/supplier/CRG0603F10K.csv',
  'artifacts/supplier/C0805C103K1RACTU.csv',
  'artifacts/supplier/AS1115-BSST.csv',
  'artifacts/supplier/1N4148-T.csv',
  '', // No supplier file for R3
];
const substituteFiles = [
  'artifacts/substitute/CRG0603F10K.csv',
  'artifacts/substitute/CRG0603F10K.csv',
  'artifacts/substitute/C0805C103K1RACTU.csv',
  'artifacts/substitute/AS1115-BSST.csv',
  'artifacts/substitute/1N4148-T.csv',
  'artifacts/substitute/1kΩ 0603 Resistor.csv',
];

// Function to download CSV data
function downloadCsv(csvData: string, filename: string) {
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Reusable Trace Step Component
interface TraceStepProps {
  nodeName: string;
  output: string;
  data?: string;
  isLoading?: boolean;
  loadingMessage?: string;
  children?: React.ReactNode;
}

function TraceStep({ nodeName, output, data, isLoading, loadingMessage, children }: TraceStepProps) {
  const [csvOpen, setCsvOpen] = useState(false);
  const handleDownload = () => {
    if (data && data.includes(',') && data.includes('\n')) {
      const filename = `${nodeName.toLowerCase().replace(/\s+/g, '_')}_data.csv`;
      downloadCsv(data, filename);
    }
  };

  const getIcon = () => {
    switch (nodeName) {
      case 'BOM Upload':
        return <FileUp className="w-5 h-5" />;
      case 'BOM Reformatting':
        return <Wand2 className="w-5 h-5" />;
      case 'AI Web Scrape':
        return <Globe className="w-5 h-5" />;
      case 'BOM Optimization':
        return <Wand2 className="w-5 h-5" />;
      case 'CSV Export':
        return <FileSpreadsheet className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 mb-4">
      <div className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
        {getIcon()}
        <span>{nodeName}</span>
      </div>
      {children ? (
        children
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {loadingMessage}
        </div>
      ) : (
        <>
          <JsonFields json={output} />
          {data && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  {data.includes(',') && data.includes('\n') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCsvOpen((v) => !v)}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      title={csvOpen ? 'Hide CSV' : 'Show CSV'}
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${csvOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  )}
                  <FileSpreadsheet className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  {data.includes(',') && data.includes('\n') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      title="Download CSV"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              {data.includes(',') && data.includes('\n') ? (
                csvOpen && <CsvTableWithLinks csv={data} supplierFiles={supplierFiles} substituteFiles={substituteFiles} />
              ) : (
                <pre className="bg-white rounded p-2 text-xs overflow-x-auto border text-gray-800">{data}</pre>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getDemoTrace(bomFinalCsv: string) {
  return [
    {
      node: 'BOM Upload',
      output: 'Uploaded file: BOM-messy.csv',
    },
    {
      node: 'BOM Reformatting',
      output: '{\n  "Transformed": true}',
      data: bomNiceCsv,
    },
    {
      node: 'AI Web Scrape',
      output: '{\n  "Status": "success"}',
      data: bomNiceCsv,
    },
    {
      node: 'BOM Optimization',
      output: '{\n  "Status": "success"}',
      data: bomFinalCsv,
    }
  ];
}

// Robust CSV parser that handles quoted fields and commas inside quotes
function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;
  while (i < csv.length) {
    const char = csv[i];
    if (char === '"') {
      if (inQuotes && csv[i + 1] === '"') {
        // Escaped quote
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentCell !== '' || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      }
      // Handle \r\n (Windows)
      if (char === '\r' && csv[i + 1] === '\n') i++;
    } else {
      currentCell += char;
    }
    i++;
  }
  // Add last cell/row
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }
  // Remove empty trailing rows
  return rows.filter(row => row.length > 1 || (row.length === 1 && row[0].trim() !== ''));
}

function CsvModal({ open, onClose, filePath }: { open: boolean; onClose: () => void; filePath: string | null }) {
  const [csv, setCsv] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    setError(null);
    setCsv(null);
    fetch(`/${filePath.replace(/^\/*/, '')}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch CSV');
        return res.text();
      })
      .then(setCsv)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [filePath]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col">
        <DialogTitle>CSV Preview: {filePath?.split('/').pop()}</DialogTitle>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : csv ? (
            <CsvTable csv={csv} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
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

function CsvTableWithLinks({ csv, supplierFiles, substituteFiles }: { csv: string, supplierFiles: string[], substituteFiles: string[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFile, setModalFile] = useState<string | null>(null);
  const rows = parseCsv(csv);
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto">
      <CsvModal open={modalOpen} onClose={() => setModalOpen(false)} filePath={modalFile} />
      <table className="min-w-full border text-xs">
        <thead>
          <tr>
            {rows[0].map((cell, i) => (
              <th key={i} className="border px-2 py-1 bg-gray-100 text-left font-semibold">{cell}</th>
            ))}
            <th className="border px-2 py-1 bg-gray-100 text-left font-semibold">Supplier Data</th>
            <th className="border px-2 py-1 bg-gray-100 text-left font-semibold">Substitute Data</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border px-2 py-1">{cell}</td>
              ))}
              <td className="border px-2 py-1">
                {supplierFiles[i] ? (
                  <Button variant="link" className="p-0 h-auto text-blue-600 underline" onClick={() => { setModalFile(supplierFiles[i]); setModalOpen(true); }}>
                    {supplierFiles[i].split('/').pop()}
                  </Button>
                ) : null}
              </td>
              <td className="border px-2 py-1">
                {substituteFiles[i] ? (
                  <Button variant="link" className="p-0 h-auto text-blue-600 underline" onClick={() => { setModalFile(substituteFiles[i]); setModalOpen(true); }}>
                    {substituteFiles[i].split('/').pop()}
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Render JSON as fields for non-technical users
function JsonFields({ json }: { json: string }) {
  let obj: any = null;
  try {
    obj = JSON.parse(json);
  } catch {
    return <pre className="bg-white rounded p-2 text-xs overflow-x-auto border text-gray-800 mb-2">{json}</pre>;
  }
  if (!obj || typeof obj !== 'object') return null;
  return (
    <div className="mb-2">
      {Object.entries(obj).map(([key, value]) => (
        <div key={key} className="text-xs mb-1 text-gray-800">
          <span className="font-semibold text-gray-700">{key}:</span> {String(value)}
        </div>
      ))}
    </div>
  );
}

export function TraceDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [stepsRevealed, setStepsRevealed] = useState(0);
  const [loadingStep1, setLoadingStep1] = useState(false); // First Structured Generation
  const [loadingStep2, setLoadingStep2] = useState(false); // AI Web Scrape
  const [loadingStep3, setLoadingStep3] = useState(false); // Second Structured Generation
  const [currentSearchMessage, setCurrentSearchMessage] = useState('');
  const [width, setWidth] = useState(400);
  const revealTimer = useRef<NodeJS.Timeout | null>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(400);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [showSearchComplete, setShowSearchComplete] = useState(false);
  const [aiWebScrapeCsvOpen, setAiWebScrapeCsvOpen] = useState(false);
  const [bomFinalCsv, setBomFinalCsv] = useState<string>('');
  const [bomFinalCsvLoading, setBomFinalCsvLoading] = useState(false);
  const [bomFinalCsvError, setBomFinalCsvError] = useState<string | null>(null);

  useEffect(() => {
    setBomFinalCsvLoading(true);
    setBomFinalCsvError(null);
    fetch('/artifacts/BOM-final.csv')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch BOM-final.csv');
        return res.text();
      })
      .then(setBomFinalCsv)
      .catch(e => setBomFinalCsvError(e.message))
      .finally(() => setBomFinalCsvLoading(false));
  }, []);

  // Mouse event handlers for resizing
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'ew-resize';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    let newWidth = startWidth.current + (startX.current - e.clientX);
    newWidth = Math.max(320, Math.min(700, newWidth));
    setWidth(newWidth);
  };
  const onMouseUp = () => {
    dragging.current = false;
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  // When file is uploaded, start revealing steps one by one
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUploaded(true);
      setStepsRevealed(1);
      setLoadingStep1(true);
      setSelectedFileName(e.target.files[0].name);
    }
  };

  // Effect to handle loading for Structured Generation
  useEffect(() => {
    if (loadingStep1) {
      const timer = setTimeout(() => {
        setLoadingStep1(false);
        // Reveal AI Web Scrape step (index 2) immediately and start loading
        setStepsRevealed(3); // Show Manual Upload, Structured Generation, and AI Web Scrape
        setLoadingStep2(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loadingStep1]);

  // Effect to handle loading for AI Web Scrape
  useEffect(() => {
    if (loadingStep2) {
      setShowSearchComplete(false);
      const searchMessages = [
        'Searching digikey.com...',
        'Searching mouser.com...',
        'Searching lcsc.com...'
      ];
      let messageIndex = 0;
      setCurrentSearchMessage(searchMessages[0]);
      const messageTimer = setInterval(() => {
        messageIndex++;
        if (messageIndex < searchMessages.length) {
          setCurrentSearchMessage(searchMessages[messageIndex]);
        } else {
          clearInterval(messageTimer);
          setLoadingStep2(false);
          setShowSearchComplete(true);
          setTimeout(() => {
            setShowSearchComplete(false);
            setCurrentSearchMessage('');
            // Reveal the second Structured Generation step and start loading
            setTimeout(() => {
              setStepsRevealed(4); // Show up to the second Structured Generation step
              setLoadingStep3(true);
            }, 1000);
          }, 1000); // Show 'Search complete' for 1s
        }
      }, 5000);
      return () => {
        clearInterval(messageTimer);
      };
    }
  }, [loadingStep2]);

  // Effect to handle loading for the second Structured Generation
  useEffect(() => {
    if (loadingStep3) {
      const timer = setTimeout(() => {
        setLoadingStep3(false);
        // Reveal the final CSV Export step
        setTimeout(() => {
          setStepsRevealed(5); // Reveal all steps including CSV Export
        }, 1000);
      }, 3000); // Shorter loading time for the second Structured Generation
      return () => clearTimeout(timer);
    }
  }, [loadingStep3]);

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ boxShadow: 'rgba(0,0,0,0.08) -8px 0px 24px', width }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 h-full w-2 cursor-ew-resize z-50 bg-transparent hover:bg-gray-200 transition"
        style={{ marginLeft: '-8px' }}
        title="Drag to resize"
      />
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
            <div className="flex items-center gap-3">
              <input
                id="trace-file-upload"
                type="file"
                accept=".csv,.xlsx,.json,.xml,.pdf,.doc,.docx,.mp4,video/mp4,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => document.getElementById('trace-file-upload')?.click()}
                className="px-4 py-2"
              >
                Choose File
              </Button>
              <span className="text-sm text-gray-600">{selectedFileName || 'No file chosen'}</span>
            </div>
          </div>
        ) : (
          getDemoTrace(bomFinalCsv).slice(0, Math.max(stepsRevealed, loadingStep2 ? 3 : loadingStep3 ? 4 : 2)).map((step, idx) => {
            const isAIWebScrape = step.node === 'AI Web Scrape';
            const shouldShowTable = isAIWebScrape && !loadingStep2 && !showSearchComplete;
            // For BOM Optimization, show loading or error if BOM-final.csv is not loaded
            if (step.node === 'BOM Optimization') {
              if (bomFinalCsvLoading) {
                return (
                  <TraceStep key={idx} nodeName={step.node} output={step.output} isLoading loadingMessage="Loading BOM-final.csv..." />
                );
              }
              if (bomFinalCsvError) {
                return (
                  <TraceStep key={idx} nodeName={step.node} output={step.output}>
                    <div className="text-red-600">{bomFinalCsvError}</div>
                  </TraceStep>
                );
              }
              // Show only the CSV table for BOM Optimization
              return (
                <TraceStep
                  key={idx}
                  nodeName={step.node}
                  output={step.output}
                  data={step.data}
                >
                  <CsvTable csv={step.data || ''} />
                </TraceStep>
              );
            }
            // For BOM Reformatting, show only the CSV table without extra columns
            if (step.node === 'BOM Reformatting' && step.data) {
              return (
                <TraceStep
                  key={idx}
                  nodeName={step.node}
                  output={step.output}
                  data={step.data}
                  isLoading={step.node === 'BOM Reformatting' && idx === 1 ? loadingStep1 : false}
                  loadingMessage={step.node === 'BOM Reformatting' && idx === 1 ? 'Reformatting BOM...' : undefined}
                >
                  <CsvTable csv={step.data} />
                </TraceStep>
              );
            }
            return (
              <TraceStep
                key={idx}
                nodeName={step.node}
                output={step.output}
                data={step.data}
                isLoading={step.node === 'BOM Reformatting' && idx === 1 ? loadingStep1 : step.node === 'AI Web Scrape' ? loadingStep2 : step.node === 'BOM Optimization' && idx === 3 ? loadingStep3 : false}
                loadingMessage={step.node === 'BOM Reformatting' && idx === 1 ? 'Reformatting BOM...' : step.node === 'AI Web Scrape' ? (!showSearchComplete ? currentSearchMessage || 'Running AI Web Scrape…' : undefined) : step.node === 'BOM Optimization' && idx === 3 ? 'Processing enhanced data...' : undefined}
              >
                {isAIWebScrape && showSearchComplete ? (
                  <div className="text-sm text-gray-600">Search complete</div>
                ) : shouldShowTable ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAiWebScrapeCsvOpen((v) => !v)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          title={aiWebScrapeCsvOpen ? 'Hide CSV' : 'Show CSV'}
                        >
                          <ChevronDown className={`w-3 h-3 transition-transform ${aiWebScrapeCsvOpen ? 'rotate-180' : ''}`} />
                        </Button>
                        <FileSpreadsheet className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadCsv(step.data!, 'ai_web_scrape_data.csv')}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          title="Download CSV"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {aiWebScrapeCsvOpen ? (
                      <CsvTableWithLinks csv={step.data!} supplierFiles={supplierFiles} substituteFiles={substituteFiles} />
                    ) : null}
                  </div>
                ) : null}
              </TraceStep>
            );
          })
        )}
      </div>
    </div>
  );
} 