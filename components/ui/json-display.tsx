"use client";

import * as React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Maximize2, X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonDisplayProps {
  data: any;
  className?: string;
  maxDepth?: number;
}

// Pastel color palette for key backgrounds
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
    .replace(/^\w/, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function getPastelClass(key: string) {
  // Deterministically pick a color for a key
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return pastelColors[Math.abs(hash) % pastelColors.length];
}

export function JsonDisplay({ data, className, maxDepth = 10 }: JsonDisplayProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({ root: true });
  const [showModal, setShowModal] = React.useState(false);

  const toggleExpanded = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderValue = (value: any, key: string, depth: number = 0, isTopLevelArray = false): React.ReactNode => {
    if (depth > maxDepth) {
      return <span className="text-gray-400 italic text-xs">(Max depth reached)</span>;
    }
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic text-xs">None</span>;
    }
    if (typeof value === 'object') {
      const isArray = Array.isArray(value);
      const isEmpty = isArray ? value.length === 0 : Object.keys(value).length === 0;
      const isExpanded = expanded[key];
      // Special handling for top-level array
      if (isArray && depth === 0) {
        return (
          <div>
            {value.map((item: any, idx: number) => (
              <div key={`component-${idx}`} className="mb-1">
                {typeof item === 'object' && item !== null
                  ? (
                    <div className="flex flex-col gap-0.5">
                      {Object.entries(item).map(([k, v]) => (
                        <React.Fragment key={k}>
                          {renderValue(v, k, 1)}
                        </React.Fragment>
                      ))}
                    </div>
                  )
                  : <span className="text-xs text-gray-800">{String(item)}</span>}
              </div>
            ))}
          </div>
        );
      }
      return (
        <div className={cn(depth > 0 && "ml-[22px]")}> {/* Indent nested */}
          <div className="flex items-center gap-2 py-0.5">
            <button
              onClick={() => toggleExpanded(key)}
              className="focus:outline-none flex items-center justify-center h-5 w-5"
              aria-expanded={isExpanded}
              aria-controls={`section-${key}`}
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
              getPastelClass(key)
            )}>
              {humanizeKey(key === 'root' ? 'Data' : key)}
            </span>
            <span className="text-xs text-gray-500">
              {isArray ? (isEmpty ? '(No items)' : `${value.length} item${value.length > 1 ? 's' : ''}`) : (isEmpty ? '(No data)' : 'Object')}
            </span>
          </div>
          {isExpanded && (
            <div id={`section-${key}`} className="ml-[22px] pl-[11px] border-l border-gray-100">
              {isArray ? (
                <div className="flex flex-col gap-0.5">
                  {value.map((item: any, idx: number) => (
                    <div key={`${key}-item-${idx}`} className="">
                      {typeof item === 'object' && item !== null
                        ? renderValue(item, `${key}[${idx}]`, depth + 1)
                        : (
                          <div className="flex items-center gap-2 py-0.5">
                            <span className={cn(
                              "font-semibold rounded px-2 py-0.5 text-xs whitespace-nowrap",
                              getPastelClass(String(idx))
                            )}>{`Item ${idx + 1}`}</span>
                            <span className="text-xs text-gray-800">{String(item)}</span>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {Object.entries(value).map(([k, v]) => (
                    <React.Fragment key={k}>
                      {renderValue(v, k, depth + 1)}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
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
        {data ? (
          <div>
            {renderValue(data, 'root', 0, Array.isArray(data))}
          </div>
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
              {renderValue(data, 'root', 0, Array.isArray(data))}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 