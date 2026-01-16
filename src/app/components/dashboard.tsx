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
const quotaPerDay = 40 / 29.45;
const fmt = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: { label: string; count: number; quota: number } }>;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { label, count, quota } = payload[0].payload;
  const diff = count - quota;
  const arrow = diff >= 0 ? '▲' : '▼';
  const text = diff >= 0
    ? `Above Quota: ${diff}`
    : `Below Quota: ${-diff}`;
  const color = diff >= 0 ? '#37ff00' : '#f87171';

  return (
    <div style={{
      background: 'rgba(10, 14, 28, 0.92)',
      padding: '16px 18px',
      borderRadius: 14,
      border: '1px solid rgba(82, 196, 255, 0.35)',
      boxShadow: '0 18px 48px rgba(5, 8, 16, 0.65)',
      fontSize: 14,
      color: '#f4f7fb',
      minWidth: 180
    }}>
      <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a93ad' }}>
        {label}
      </div>
      <div style={{ color, margin: '8px 0 6px', fontWeight: 600 }}>
        {arrow} {text}
      </div>
      <div style={{ marginBottom: 2 }}>Meetings Booked: <strong>{count}</strong></div>
      <div style={{ color: '#f87171' }}>Quota: <strong>{quota}</strong></div>
    </div>
  );
};

export default function Dashboard() {
  const { data, error } = useSWR('/api/meetings', fetcher);

  if (error) return <p className="glass pad">Failed: {error.message}</p>;
  if (!data) return <p className="glass pad">Loading…</p>;

  const now = Date.now();
  const earliest = Math.min(...data.map((m) => +new Date(m.date)));

  const buildMetric = (label: string, d: number) => {
    const endDate = new Date();
    const startDate = new Date(now - d * MS_DAY);
    const count = data.filter(
      (m) => +new Date(m.date) >= startDate.getTime()
    ).length;
    const quota = Math.round(d * quotaPerDay);
    return {
      label,
      rangeLabel: `${fmt(startDate)} – ${fmt(endDate)}`,
      count,
      quota,
    };
  };

  const chartData = [
    buildMetric('Last 7 Days', 7),
    buildMetric('Last 90 Days', 90),
    buildMetric('Last 180 Days', 180),
    {
      label: 'All Time',
      count: data.length,
      startDate: new Date(earliest),
      endDate: new Date(now),
      rangeLabel: `${fmt(new Date(earliest))} – ${fmt(new Date(now))}`,
      quota: Math.round(((now - earliest) / MS_DAY) * quotaPerDay),
    },
  ];

  const maxValue = Math.max(
    ...chartData.map((d) => Math.max(d.count, d.quota))
  );
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.1) : 1;

  const metrics = [
    buildMetric('Last 7 Days', 7),
    buildMetric('Last 90 Days', 90),
    buildMetric('Last 180 Days', 180),
  ].map((m) => ({
    ...m,
    gap: Math.abs(m.count - m.quota),
    percent: m.quota > 0
      ? (m.count >= m.quota
        ? Math.round((m.count / m.quota) * 100)
        : Math.round((1 - m.count / m.quota) * 100))
      : 0,
  }));

  const allTimeMetric = {
    label: 'All Time',
    count: data.length,
    quota: Math.round(((now - earliest) / MS_DAY) * quotaPerDay),
    rangeLabel: `${fmt(new Date(earliest))} – ${fmt(new Date(now))}`,
  };

  return (
    <section className="dashboard">
      <div className="metric-grid">
        {metrics.map((m) => (
          <div key={m.label} className="glass metric-tile">
            <span className="icon"></span>
            <small className="range">{m.rangeLabel}</small>
            <span className="value">{m.count}</span>
            <small
              className={`delta ${m.count >= m.quota ? 'positive' : 'negative'}`}
            >
              {m.count >= m.quota ? '▲ ' : '▼ '}
              {m.percent}%
            </small>
          </div>
        ))}
        <div className="glass metric-tile all-time">
          <small>ALL TIME</small>
          <span className="value at">{allTimeMetric.count}</span>
          <small
            className={`delta ${
              allTimeMetric.count >= allTimeMetric.quota ? 'positive' : 'negative'
            }`}
          >
            {allTimeMetric.count >= allTimeMetric.quota ? '▲ ' : '▼ '}
            {allTimeMetric.quota > 0
              ? (allTimeMetric.count >= allTimeMetric.quota
                ? Math.round((allTimeMetric.count / allTimeMetric.quota) * 100)
                : Math.round((1 - allTimeMetric.count / allTimeMetric.quota) * 100))
              : 0}%
          </small>
        </div>
      </div>

      <div className="glass chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#37ff00" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#37ff00" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#37ff00" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#cfcfcf" />
            <YAxis
              label={{
                value: 'Meetings',
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
            {/* Green fill showing surplus between actual and quota */}
            <Area
              type="monotone"
              dataKey="count"
              stroke="none"
              fill="url(#greenGradient)"
              fillOpacity={1}
              isAnimationActive={false}
            />
            {/* Mask under the quota line to create the "between" effect */}
            <Area
              type="monotone"
              dataKey="quota"
              stroke="none"
              fill="var(--background)"
              fillOpacity={1}
              isAnimationActive={false}
            />
            {/* Red quota line */}
            <Line
              type="monotone"
              dataKey="quota"
              stroke="#f87171"
              strokeWidth={2}
              strokeDasharray="10 0"
              dot={false}
              name="Quota"
            />
            {/* White actual line */}
            <Line
              type="monotone"
              dataKey="count"
              stroke="#ffffff"
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Meetings Booked"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
