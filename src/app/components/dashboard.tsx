'use client';

import useSWR from 'swr';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type Meeting = {
  date: string;
  title: string;
  stage: string;
  owner: string;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json() as Promise<Meeting[]>);

const MS_DAY = 86_400_000;

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: { label: string; count: number } }>;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { label, count } = payload[0].payload;

  return (
    <div style={{
      background: 'rgba(10, 14, 28, 0.92)',
      padding: '16px 18px',
      borderRadius: 14,
      border: '1px solid rgba(82, 196, 255, 0.35)',
      boxShadow: '0 18px 48px rgba(5, 8, 16, 0.65)',
      fontSize: 14,
      color: '#f4f7fb',
      minWidth: 160
    }}>
      <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a93ad', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: '#37ff00' }}>
        {count} meetings
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { data, error } = useSWR('/api/meetings', fetcher);

  if (error) return <p className="glass pad">Failed: {error.message}</p>;
  if (!data) return <p className="glass pad">Loading…</p>;

  const now = Date.now();

  // Count meetings up to each checkpoint
  const countMeetingsBefore = (daysAgo: number) => {
    const cutoff = now - daysAgo * MS_DAY;
    return data.filter((m) => +new Date(m.date) <= cutoff).length;
  };

  const chartData = [
    { label: '270 Days Ago', count: countMeetingsBefore(270) },
    { label: '180 Days Ago', count: countMeetingsBefore(180) },
    { label: '90 Days Ago', count: countMeetingsBefore(90) },
    { label: 'Today', count: data.length },
  ];

  const maxValue = Math.max(...chartData.map((d) => d.count));
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.1) : 1;

  return (
    <section className="dashboard">
      <div className="summary-row">
        <div className="glass metric-tile this-week">
          <small>THIS WEEK</small>
          <span className="value">{
            data.filter((m) => {
              const today = new Date();
              const dayOfWeek = today.getDay();
              const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              const monday = new Date(today);
              monday.setHours(0, 0, 0, 0);
              monday.setDate(today.getDate() - mondayOffset);
              return +new Date(m.date) >= monday.getTime();
            }).length
          }</span>
        </div>

        <div className="glass metric-tile all-time">
          <small>ALL TIME</small>
          <span className="value at">{data.length}</span>
        </div>
      </div>

      <div className="glass chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#cfcfcf" />
            <YAxis
              label={{
                value: 'Total Meetings',
                angle: -90,
                position: 'insideLeft',
                fill: '#aaa',
                fontSize: 14,
              }}
              allowDecimals={false}
              stroke="#cfcfcf"
              domain={[0, yAxisMax]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="none"
              fill="#37ff00"
              fillOpacity={0.3}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#37ff00"
              strokeWidth={3}
              dot={{ r: 5, fill: '#37ff00' }}
              name="Meetings"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
