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
    buildMetric('Last 30 Days', 30),
    buildMetric('Last 90 Days', 90),
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
    // under = “how far below”, over = “count/quota*100”
    percent: m.quota > 0
      ? (m.count >= m.quota
        // 57 of 41 → 57/41≈1.39→139%
        ? Math.round((m.count / m.quota) * 100)
        // 8 of 10 → 1−(8/10)=0.2→20%
        : Math.round((1 - m.count / m.quota) * 100))
      : 0,
    baseline: Math.min(m.count, m.quota),
  }));

  return (
    <section className="dashboard">
      <div className="metric-grid">
        {metrics.slice(0, 3).map((m) => (
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
          <span className="value at">{metrics[3].count}</span>
          <small
            className={`delta ${
              metrics[3].count >= metrics[3].quota ? 'positive' : 'negative'
            }`}
          >
            {metrics[3].count >= metrics[3].quota ? '▲ ' : '▼ '}
            {metrics[3].percent}%
          </small>
        </div>
      </div>

      <div className="glass chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={metrics}>
            <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <Legend
              align="right"
              verticalAlign="top"
              layout="horizontal"
              iconType="plainline"
              iconSize={15}
              wrapperStyle={{ paddingBottom: 8 }}
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
            />
            <Tooltip
              contentStyle={{
                background: '#1a1a1a',
                border: 'none',
                color: '#fff',
              }}
            />
            <Area
              type="monotone"
              dataKey="baseline"
              stackId="gap"
              stroke="none"
              fill="transparent"
            />
            <Area
              type="monotone"
              dataKey="gap"
              stackId="gap"
              stroke="none"
              fill="#37ff00"
              fillOpacity={0.3}
              isAnimationActive={false}
              name="Above Quota"
            />
            <Line
              type="linear"
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
