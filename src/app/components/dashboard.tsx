'use client';

import useSWR from 'swr';

type Meeting = {
  date: string;
  title: string;
  stage: string;
  owner: string;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json() as Promise<Meeting[]>);

const fmt = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function Dashboard() {
  const { data, error } = useSWR('/api/meetings', fetcher);

  if (error) return <p className="glass pad">Failed: {error.message}</p>;
  if (!data) return <p className="glass pad">Loading…</p>;

  const now = Date.now();
  const earliest = Math.min(...data.map((m) => +new Date(m.date)));

  // Get start of current week (Monday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - mondayOffset);

  const thisWeekCount = data.filter(
    (m) => +new Date(m.date) >= monday.getTime()
  ).length;

  return (
    <section className="dashboard">
      <div className="summary-row">
        <div className="glass metric-tile this-week">
          <small>THIS WEEK</small>
          <small className="range">{fmt(monday)} – {fmt(today)}</small>
          <span className="value">{thisWeekCount}</span>
        </div>

        <div className="glass metric-tile all-time">
          <small>ALL TIME</small>
          <small className="range">{fmt(new Date(earliest))} – {fmt(new Date(now))}</small>
          <span className="value at">{data.length}</span>
        </div>
      </div>
    </section>
  );
}
