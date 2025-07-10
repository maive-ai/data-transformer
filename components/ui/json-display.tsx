"use client";

import * as React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Maximize2, X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonDisplayProps {
  data?: any;
  filePath?: string;
  className?: string;
  maxDepth?: number;
}

const pastelColors = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-pink-100 text-pink-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-teal-100 text-teal-800",
];

function humanizeKey(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^[a-z]/, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function getPastelClass(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return pastelColors[Math.abs(hash) % pastelColors.length];
}

export function JsonDisplay({ data, filePath, className, maxDepth = 10 }: JsonDisplayProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = React.useState(false);
  const [fileData, setFileData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (filePath) {
      setLoading(true);
      setError(null);
      fetch(filePath)
        .then(response => {
          if (!response.ok) throw new Error(`Failed to load file: ${response.statusText}`);
          return response.json();
        })
        .then(json => {
          setFileData(json);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [filePath]);

  const displayData = filePath ? fileData : data;

  const toggleExpanded = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper for top-level array rendering
  const renderTopLevelArray = (arr: any[]) => (
    <div className="flex flex-col gap-1">
      {arr.map((item, idx) => {
        const label = `Item ${idx + 1}`;
        const nodeKey = `top-item-${idx}`;
        const isExpanded = expanded[nodeKey] ?? true;
        return (
          <div key={nodeKey} className="">
            <div className="flex items-center gap-2 py-0.5">
              <button
                onClick={() => toggleExpanded(nodeKey)}
                className="focus:outline-none flex items-center justify-center h-5 w-5"
                aria-expanded={isExpanded}
                aria-controls={`section-${nodeKey}`}
                tabIndex={0}
                style={{ minWidth: 20 }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </button>
              <span className={cn(
                "font-semibold rounded px-2 py-0.5 text-xs whitespace-nowrap",
                getPastelClass(label)
              )}>{label}</span>
            </div>
            {isExpanded && (
              <div id={`section-${nodeKey}`} className="ml-3 border-l border-gray-100 pl-2">
                {renderValue(item, label, 1)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderValue = (value: any, key: string, depth: number = 0, parentIsArray = false): React.ReactNode => {
    if (depth > maxDepth) {
      return <span className="text-gray-400 italic text-xs">(Max depth reached)</span>;
    }
    if (value === null) {
      return <span className="text-gray-400 italic text-xs">None</span>;
    }
    if (typeof value === 'object') {
      const isArray = Array.isArray(value);
      const isEmpty = isArray ? value.length === 0 : Object.keys(value).length === 0;
      const nodeKey = `${key}-${depth}`;
      const isExpanded = expanded[nodeKey] ?? depth < 1; // expand root by default
      if (isArray) {
        if (isEmpty) {
          return <span className="text-gray-400 italic text-xs">(Empty array)</span>;
        }
        // Only use special top-level rendering for top-level array
        if (depth === 0) {
          return renderTopLevelArray(value);
        }
        // Array of primitives
        if (value.every((v: any) => typeof v !== 'object' || v === null)) {
          return (
            <div className="flex flex-col gap-0.5 ml-3">
              {value.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 py-0.5">
                  <span className={cn(
                    "font-semibold rounded px-2 py-0.5 text-xs whitespace-nowrap",
                    getPastelClass(String(idx))
                  )}>{`Component ${idx + 1}`}</span>
                  {renderValue(item, String(idx), depth + 1, true)}
                </div>
              ))}
            </div>
          );
        }
        // Array of objects
        return (
          <div className="flex flex-col gap-1 ml-3">
            {value.map((item: any, idx: number) => (
              <div key={idx} className="">
                {renderValue(item, String(idx), depth + 1, true)}
              </div>
            ))}
          </div>
        );
      }
      // Object
      if (isEmpty) {
        return <span className="text-gray-400 italic text-xs">(Empty object)</span>;
      }
      return (
        <div className={cn(depth > 0 && "ml-3")}> {/* Indent nested */}
          <div className="flex flex-col gap-0.5">
            {Object.entries(value).map(([k, v]) => {
              const childIsExpandable = typeof v === 'object' && v !== null && (Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0);
              const childKey = `${k}-${depth + 1}`;
              return (
                <div key={childKey} className="flex items-start gap-2 py-0.5">
                  {childIsExpandable ? (
                    <button
                      onClick={() => toggleExpanded(childKey)}
                      className="focus:outline-none flex items-center justify-center h-5 w-5 mt-0.5"
                      aria-expanded={expanded[childKey]}
                      aria-controls={`section-${childKey}`}
                      tabIndex={0}
                      style={{ minWidth: 20 }}
                    >
                      {expanded[childKey] ? (
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  ) : (
                    <span className="w-5" />
                  )}
                  <span className={cn(
                    "font-semibold rounded px-2 py-0.5 text-xs whitespace-nowrap",
                    getPastelClass(k)
                  )}>{humanizeKey(k)}</span>
                  <div className="flex-1">
                    {childIsExpandable && expanded[childKey] ? (
                      <div id={`section-${childKey}`} className="ml-3 border-l border-gray-100 pl-2">
                        {renderValue(v, k, depth + 1)}
                      </div>
                    ) : !childIsExpandable ? (
                      <span className="text-xs text-gray-800">{renderValue(v, k, depth + 1)}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    // Primitives
    if (typeof value === 'string') {
      return <span className="text-gray-800 text-xs">{value}</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-blue-700 text-xs">{value}</span>;
    }
    if (typeof value === 'boolean') {
      return <span className="text-purple-700 text-xs">{value ? 'Yes' : 'No'}</span>;
    }
    return <span className="text-gray-700 text-xs">{String(value)}</span>;
  };

  if (filePath && loading) {
    return (
      <div className={cn("bg-white p-4 text-center", className)}>
        <div className="text-gray-500">Loading JSON data...</div>
      </div>
    );
  }

  if (filePath && error) {
    return (
      <div className={cn("bg-white p-4 text-center", className)}>
        <div className="text-red-500">Error loading file: {error}</div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("bg-white p-2 text-xs overflow-x-auto relative", className)}>
        {/* Expand button */}
        <button
          className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 focus:outline-none"
          aria-label="Expand to fullscreen"
          onClick={() => setShowModal(true)}
        >
          <Maximize2 className="w-4 h-4 text-gray-500" />
        </button>
        {Array.isArray(displayData) ? (
          renderTopLevelArray(displayData)
        ) : displayData ? (
          <div>{renderValue(displayData, 'root', 0)}</div>
        ) : (
          <div className="text-gray-400 italic">No data available</div>
        )}
      </div>
      {/* Fullscreen Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
         <div
           className="bg-white w-[80vw] h-[80vh] rounded-2xl shadow-2xl overflow-auto relative p-6 flex flex-col"
           onClick={e => e.stopPropagation()}
         >
            <button
              className="absolute top-4 right-4 p-2 rounded hover:bg-gray-100 focus:outline-none z-10"
              aria-label="Close fullscreen"
              onClick={() => setShowModal(false)}
            >
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
            <div className="max-w-5xl mx-auto">
              {Array.isArray(displayData)
                ? renderTopLevelArray(displayData)
                : displayData
                ? renderValue(displayData, 'root', 0)
                : <div className="text-gray-400 italic">No data available</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 