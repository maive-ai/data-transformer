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
  }, []);

  const displayData = filePath ? fileData : data;

  const toggleExpanded = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNode = (value: any, key: string, depth: number = 0, isTopLevel = false): React.ReactNode => {
    if (depth > maxDepth) {
      return <span className="text-gray-400 italic text-xs">(Max depth reached)</span>;
    }

    if (value === null) {
      return <span className="text-gray-400 italic text-xs">None</span>;
    }

    if (typeof value === 'object') {
      const isArray = Array.isArray(value);
      const isEmpty = isArray ? value.length === 0 : Object.keys(value).length === 0;

      if (isEmpty) {
        return <span className="text-gray-400 italic text-xs">{isArray ? '(Empty list)' : '(Empty)'} </span>;
      }

      const nodeKey = `${key}-${depth}`;
      const isExpanded = expanded[nodeKey] ?? depth < 2; // Auto-expand first levels

      const entries = isArray ? value.map((v, i) => [`Item ${i + 1}`, v]) : Object.entries(value);

      if (isTopLevel) {
        return (
          <div className="flex flex-col gap-1">
            {entries.map(([k, v]) => renderNode(v, k, depth + 1))}
          </div>
        );
      }

      return (
        <div>
          <div className="flex items-center gap-2 py-0.5">
            <button
              onClick={() => toggleExpanded(nodeKey)}
              className="focus:outline-none flex items-center justify-center h-5 w-5"
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
            </button>
            <span className={cn(
              "font-semibold rounded px-2 py-0.5 text-xs whitespace-nowrap",
              getPastelClass(key)
            )}>
              {humanizeKey(key)}
            </span>
          </div>
          {isExpanded && (
            <div className="pl-6 border-l border-gray-100">
              <div className="flex flex-col">
                {entries.map(([k, v]) => renderNode(v, k, depth + 1))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Primitive or non-expandable value
    return (
      <div className="flex items-center gap-2 py-0.5 pl-5">
        <span className={cn(
          "font-semibold rounded px-2 py-0.5 text-xs whitespace-nowrap",
          getPastelClass(key)
        )}>{humanizeKey(key)}</span>
        {typeof value === 'string' && <span className="text-gray-800 text-xs">{value}</span>}
        {typeof value === 'number' && <span className="text-blue-700 text-xs">{value}</span>}
        {typeof value === 'boolean' && <span className="text-purple-700 text-xs">{value ? 'Yes' : 'No'}</span>}
        {value === null && <span className="text-gray-400 italic text-xs">None</span>}
      </div>
    );
  };

  const renderValue = (value: any) => {
    if (value === null || value === undefined) {
      return <div className="text-gray-400 italic">No data available</div>;
    }
    return renderNode(value, 'root', 0, true);
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
        {renderValue(displayData)}
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
              {renderValue(displayData)}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 