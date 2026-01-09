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
  Legend,
  CartesianGrid,
} from 'recharts';

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: { count: number; quota: number } }>;
  label?: string;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null;

  const { count, quota } = payload[0].payload;
  const diff = count - quota;
  const arrow = diff >= 0 ? '▲' : '▼';
  const text  = diff >= 0
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

  const metrics = [
    buildMetric('Last 7 Days', 7),
    {
      label: 'All Time',
      count: data.length,
      startDate: new Date(earliest),
      endDate: new Date(now),
      rangeLabel: `${fmt(new Date(earliest))} – ${fmt(new Date(now))}`,
      quota: Math.round(((now - earliest) / MS_DAY) * quotaPerDay),
    },
  ].map((m) => ({
    ...m,
    gap: Math.abs(m.count - m.quota),
    // under = "how far below", over = "count/quota*100"
    percent: m.quota > 0
      ? (m.count >= m.quota
        // 57 of 41 → 57/41≈1.39→139%
        ? Math.round((m.count / m.quota) * 100)
        // 8 of 10 → 1−(8/10)=0.2→20%
        : Math.round((1 - m.count / m.quota) * 100))
      : 0,
    baseline: Math.min(m.count, m.quota),
  }));

  const maxValue = Math.max(
    ...metrics.map((metric) => Math.max(metric.count, metric.quota))
  );
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.1) : 1;

  const renderYAxisTick = ({
    x,
    y,
    payload,
    textAnchor,
  }: {
    x: number;
    y: number;
    payload: { value: number | string };
    textAnchor?: 'inherit' | 'start' | 'middle' | 'end';
  }) => {
    const numericValue = typeof payload.value === 'number'
      ? payload.value
      : Number(payload.value);
    const isMaxTick = !Number.isNaN(numericValue) && numericValue >= yAxisMax;

    return (
      <text
        x={x}
        y={y}
        dy={4}
        fontSize={12}
        textAnchor={textAnchor ?? 'end'}
        fill={isMaxTick ? 'var(--background)' : '#cfcfcf'}
      >
        {payload.value}
      </text>
    );
  };

  const renderChartLegend = () => {
    const items = [
      { label: 'Bonus', color: '#37ff00', glow: '0 0 16px rgba(55, 255, 0, 0.45)' },
      { label: 'Quota', color: '#f87171', glow: '0 0 16px rgba(248, 113, 113, 0.45)' },
    ];

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
          gap: 24,
          paddingRight: 12,
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#8a93ad',
              fontSize: 13,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 26,
                height: 4,
                backgroundColor: item.color,
                borderRadius: 999,
                boxShadow: item.glow,
              }}
            />
            <span style={{ color: '#f4f7fb' }}>{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="dashboard">
      {/* Last 7 Days and All Time side-by-side */}
      <div className="summary-row">
        <div className="glass metric-tile">
          <small>LAST 7 DAYS</small>
          <small className="range">{metrics[0].rangeLabel}</small>
          <span className="value">{metrics[0].count}</span>
          <small
            className={`delta ${
              metrics[0].count >= metrics[0].quota ? 'positive' : 'negative'
            }`}
          >
            {metrics[0].count >= metrics[0].quota ? '▲ ' : '▼ '}
            {metrics[0].percent}%
          </small>
        </div>

        <div className="glass metric-tile all-time">
          <small>ALL TIME</small>
          <small className="range">{metrics[1].rangeLabel}</small>
          <span className="value at">{metrics[1].count}</span>
          <small
            className={`delta ${
              metrics[1].count >= metrics[1].quota ? 'positive' : 'negative'
            }`}
          >
            {metrics[1].count >= metrics[1].quota ? '▲ ' : '▼ '}
            {metrics[1].percent}%
          </small>
        </div>
      </div>

      <div className="glass chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={metrics}>
            <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <Legend
              wrapperStyle={{ paddingBottom: 8 }}
              content={renderChartLegend}
            />
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
              tick={renderYAxisTick}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* 1) fill under the Meetings Booked line */}
            <Area
              type="monotone"
              dataKey="count"
              stroke="none"
              fill="#37ff00"
              fillOpacity={0.3}
              isAnimationActive={false}
            />

            {/* 2) mask under the Quota line (your chart-background color) */}
            <Area
              type="monotone"
              dataKey="quota"
              stroke="none"
              fill="var(--background)" /* or hard-code your glass-background color */
              fillOpacity={1}
              isAnimationActive={false}
            />
            {/* 3) draw the lines on top so they stay visible */}
            <Line
              type="monotone"
              dataKey="quota"
              stroke="#f87171"
              strokeWidth={2}
              strokeDasharray="10 0"
              dot={false}
              name="Quota"
            />
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
