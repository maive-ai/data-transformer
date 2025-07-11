"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Database } from "lucide-react";
import { RunState } from "@/types/enums";
import { getNodeBorderClass } from "@/lib/utils";

interface WorkflowErpLookupNodeData {
  label: string;
  type: "action";
  iconType?: string;
}

// Mock ERP lookup function that simulates looking up parts in an ERP system
function mockErpLookup(mpn: string): { status: string; substitution?: string } {
  // Generate a random number between 0 and 1
  const rand = Math.random();
  
  // 80% chance of direct match
  if (rand < 0.8) {
    return { status: "Direct Match" };
  }
  // 10% chance of substitution
  else if (rand < 0.9) {
    return { 
      status: "Substitution Found",
      substitution: `${mpn}-ALT`
    };
  }
  // 10% chance of not found
  else {
    return { status: "Not Found in ERP" };
  }
}

// Process a single BOM line item
function processBomLine(line: string): { 
  mpn: string;
  description: string;
  manufacturer: string;
  quantity: string;
  refDes: string;
  package: string;
  status: string;
  substitution?: string;
} {
  // Split the line by whitespace, but preserve quoted strings
  const parts = line.match(/\S+/g) || [];
  
  // Extract fields
  const refDes = parts[0] || "";
  const mpn = parts[1] || "";
  const manufacturer = parts[2] || "";
  const quantity = parts[3] || "";
  const description = parts[4] || "";
  const package_ = parts[5] || "";

  // Perform ERP lookup
  const lookupResult = mockErpLookup(mpn);

  return {
    mpn,
    description,
    manufacturer,
    quantity,
    refDes,
    package: package_,
    status: lookupResult.status,
    substitution: lookupResult.substitution
  };
}

export const WorkflowErpLookupNode = memo(({ data }: NodeProps<WorkflowErpLookupNodeData & { runState?: string, highlighted?: boolean }>) => {
  const borderClass = getNodeBorderClass(data.runState as RunState);

  return (
    <Card className={`p-4 w-full h-full shadow-lg bg-white ${borderClass}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl"><Database className="w-6 h-6" /></div>
        <div className="text-sm font-medium text-center">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
}); 