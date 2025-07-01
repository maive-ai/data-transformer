import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Globe } from 'lucide-react';

export const WorkflowAiWebSearchNode = memo((props: NodeProps) => {
  return (
    <Card className="w-40 h-28 flex flex-col items-center justify-center relative border border-gray-200 bg-white">
      <Globe className="w-8 h-8 text-gray-800 mb-2" />
      <div className="font-semibold text-gray-800">AI Web Scrape</div>
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
    </Card>
  );
});

export default WorkflowAiWebSearchNode; 