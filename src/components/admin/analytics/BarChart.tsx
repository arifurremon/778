"use client";

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface BarDataPoint {
  name: string;
  value: number;
}

interface BarChartProps {
  data: BarDataPoint[];
  loading?: boolean;
  color?: string;
  height?: number | string;
  layout?: 'horizontal' | 'vertical';
}

export function BarChart({ 
  data, 
  loading, 
  color = "#3b82f6", 
  height = 300,
  layout = 'vertical' 
}: BarChartProps) {
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

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ 
            top: 10, 
            right: 10, 
            left: layout === 'horizontal' ? -20 : 40, 
            bottom: 10 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={layout === 'vertical'} horizontal={layout === 'horizontal'} stroke="hsl(var(--border)/0.3)" />
          {layout === 'vertical' ? (
            <>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                width={80}
              />
            </>
          ) : (
            <>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
              />
            </>
          )}
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
            contentStyle={{ 
              backgroundColor: "hsl(var(--background))", 
              border: "1px solid hsl(var(--border)/0.5)",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold"
            }}
          />
          <Bar 
            dataKey="value" 
            fill={color} 
            radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            barSize={24}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fillOpacity={0.8 - (index * 0.05)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
