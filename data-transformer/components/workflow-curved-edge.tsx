"use client";

import React from 'react';
import { EdgeProps, BaseEdge } from 'reactflow';

export default function CurvedFeedbackEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  // Calculate a curved path that goes down, then left, then up (like a U shape)
  const offsetY = 80; // vertical offset
  const midY = Math.max(sourceY, targetY) + offsetY;
  
  // Path: down from source, across, then up into target bottom
  const path = `
    M ${sourceX} ${sourceY}
    L ${sourceX} ${midY}
    L ${targetX} ${midY}
    L ${targetX} ${targetY}
  `;

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: '#2563eb',
        strokeWidth: 3,
        strokeDasharray: '8,4',
        filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.2))',
      }}
    />
  );
} 