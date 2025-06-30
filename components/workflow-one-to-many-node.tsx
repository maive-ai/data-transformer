import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';

// Custom OneToMany icon: single line from left, splitting into three lines to the right
function OneToManyIcon() {
  return (
    <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main input line */}
      <line x1="4" y1="16" x2="16" y2="16" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      {/* Fork lines */}
      <line x1="16" y1="16" x2="36" y2="6" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="16" x2="36" y2="16" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="16" x2="36" y2="26" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      {/* Dots at outputs */}
      <circle cx="36" cy="6" r="2" fill="#2563eb" />
      <circle cx="36" cy="16" r="2" fill="#2563eb" />
      <circle cx="36" cy="26" r="2" fill="#2563eb" />
    </svg>
  );
}

export const WorkflowOneToManyNode = memo((props: NodeProps) => {
  return (
    <Card className="w-40 h-28 flex flex-col items-center justify-center relative border-2 border-dashed border-blue-400 bg-blue-50">
      <OneToManyIcon />
      <div className="font-semibold text-blue-700">One to Many</div>
      <Handle type="target" position={Position.Left} className="!bg-blue-400" />
      <Handle type="source" position={Position.Right} className="!bg-blue-400" />
    </Card>
  );
});

export default WorkflowOneToManyNode; 