"use client";

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieDataPoint[];
  loading?: boolean;
  height?: number | string;
}

export function PieChart({ data, loading, height = 300 }: PieChartProps) {
  if (loading) {
    return <Skeleton className="w-full" style={{ height }} />;
  }

  if (!data || data.length === 0) {
    return (
      <div 
        className="w-full flex items-center justify-center bg-muted/10 rounded-xl border border-dashed border-border/50 text-muted-foreground text-xs font-bold uppercase tracking-widest"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--background))", 
              border: "1px solid hsl(var(--border)/0.5)",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold"
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground font-black text-xl"
          >
            {total.toLocaleString()}
          </text>
          <text
            x="50%"
            y="60%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground font-bold text-[8px] uppercase tracking-widest"
          >
            Total
          </text>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
