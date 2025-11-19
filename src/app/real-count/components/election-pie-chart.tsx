'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type ChartData = {
  name: string;
  value: number;
  fill: string;
};

interface ElectionPieChartProps {
  data: ChartData[];
}

export function ElectionPieChart({ data }: ElectionPieChartProps) {
  const hasVotes = data.some(d => d.value > 0);

  if (!hasVotes) {
    return (
        <div className="flex items-center justify-center h-full w-full bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Belum ada suara masuk</p>
        </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
        />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
      </PieChart>
    </ResponsiveContainer>
  );
}
