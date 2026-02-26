'use client';

import { useState, useRef, useCallback } from 'react';

type Props = {
  meetingsByDay: Map<string, string[]>;
  onClose: () => void;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHLY_QUOTA = 40;

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function monthMeetingCount(meetingsByDay: Map<string, string[]>, year: number, month: number) {
  let count = 0;
  const total = daysInMonth(year, month);
  for (let d = 1; d <= total; d++) {
    count += meetingsByDay.get(dateKey(year, month, d))?.length ?? 0;
  }
  return count;
}

/* ── Shared styles ─────────────────────────── */
const overlay: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const modal: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(18, 22, 39, 0.96), rgba(7, 9, 18, 0.92))',
  border: '1px solid rgba(88, 203, 255, 0.28)',
  borderRadius: 22,
  backdropFilter: 'blur(24px)',
  boxShadow: '0 20px 60px rgba(4, 6, 11, 0.85), 0 0 40px rgba(10, 129, 255, 0.18)',
  padding: '32px 36px',
  maxWidth: 960,
  width: '92vw',
  maxHeight: '90vh',
  overflowY: 'auto' as const,
  color: '#f4f7fb',
};

const navRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  marginBottom: 24,
};

const navBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid rgba(88, 203, 255, 0.3)',
  borderRadius: 8,
  color: '#f4f7fb',
  fontSize: 18,
  padding: '4px 14px',
  cursor: 'pointer',
};

const dotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: '#37ff00',
};

const tooltipStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginBottom: 6,
  background: 'rgba(10, 14, 28, 0.95)',
  border: '1px solid rgba(82, 196, 255, 0.35)',
  borderRadius: 10,
  padding: '8px 12px',
  fontSize: 11,
  color: '#f4f7fb',
  whiteSpace: 'nowrap' as const,
  zIndex: 10,
  boxShadow: '0 12px 32px rgba(5, 8, 16, 0.7)',
};

/* ── Tooltip hook ──────────────────────────── */
function useHoverTooltip() {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = useCallback((key: string) => {
    timerRef.current = setTimeout(() => setHoveredDay(key), 500);
  }, []);

  const onLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHoveredDay(null);
  }, []);

  return { hoveredDay, onEnter, onLeave };
}

/* ── Tooltip component ─────────────────────── */
function FirmTooltip({ titles }: { titles: string[] }) {
  return (
    <div style={tooltipStyle}>
      {titles.map((t, i) => (
        <div key={i} style={{ padding: '2px 0' }}>{t}</div>
      ))}
    </div>
  );
}

/* ── Year View ─────────────────────────────── */
function YearView({
  year,
  meetingsByDay,
  onMonthClick,
}: {
  year: number;
  meetingsByDay: Map<string, string[]>;
  onMonthClick: (month: number) => void;
}) {
  const { hoveredDay, onEnter, onLeave } = useHoverTooltip();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
      {MONTH_NAMES.map((name, mi) => {
        const total = daysInMonth(year, mi);
        const offset = startDay(year, mi);
        const mCount = monthMeetingCount(meetingsByDay, year, mi);
        return (
          <div key={name} style={{ minWidth: 0 }}>
            <div
              onClick={() => onMonthClick(mi)}
              style={{
                textAlign: 'center',
                fontWeight: 600,
                fontSize: 12,
                marginBottom: 6,
                cursor: 'pointer',
                color: '#f4f7fb',
                letterSpacing: '0.06em',
              }}
            >
              {name} <span style={{ color: '#8a93ad', fontWeight: 400 }}>| {mCount} Meeting{mCount !== 1 ? 's' : ''}</span>
            </div>
            {/* Day-of-week header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
              {DAY_HEADERS.map((d, i) => (
                <span key={i} style={{ fontSize: 9, color: '#8a93ad', lineHeight: '18px' }}>{d}</span>
              ))}
            </div>
            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
              {Array.from({ length: offset }).map((_, i) => (
                <span key={`e${i}`} />
              ))}
              {Array.from({ length: total }).map((_, i) => {
                const day = i + 1;
                const key = dateKey(year, mi, day);
                const titles = meetingsByDay.get(key);
                const has = !!titles;
                return (
                  <span
                    key={day}
                    style={{ fontSize: 10, lineHeight: '16px', padding: '2px 0', position: 'relative' }}
                  >
                    {day}
                    {has && (
                      <div
                        style={{ display: 'flex', justifyContent: 'center' }}
                        onMouseEnter={() => onEnter(key)}
                        onMouseLeave={onLeave}
                      >
                        <div style={{ ...dotStyle, margin: '2px auto 0' }} />
                        {hoveredDay === key && <FirmTooltip titles={titles} />}
                      </div>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Month View ────────────────────────────── */
function MonthView({
  year,
  month,
  meetingsByDay,
  onBack,
}: {
  year: number;
  month: number;
  meetingsByDay: Map<string, string[]>;
  onBack: () => void;
}) {
  const { hoveredDay, onEnter, onLeave } = useHoverTooltip();
  const total = daysInMonth(year, month);
  const offset = startDay(year, month);
  const mCount = monthMeetingCount(meetingsByDay, year, month);
  const quotaPercent = Math.round((mCount / MONTHLY_QUOTA) * 100);
  const quotaColor = quotaPercent >= 100 ? '#37ff00' : '#f87171';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button onClick={onBack} style={navBtn}>←</button>
        <h3 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '0.04em' }}>
          {MONTH_NAMES[month]} {year}{' '}
          <span style={{ color: '#8a93ad', fontWeight: 400 }}>
            | {mCount} Meeting{mCount !== 1 ? 's' : ''} |{' '}
          </span>
          <span style={{ color: quotaColor, fontWeight: 400 }}>
            {quotaPercent}% of Quota
          </span>
        </h3>
      </div>

      {/* Day-of-week header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 4 }}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
          <span key={d} style={{ fontSize: 11, color: '#8a93ad', letterSpacing: '0.12em', padding: '6px 0' }}>{d}</span>
        ))}
      </div>

      {/* Day cells */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2,
      }}>
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`e${i}`} style={{ aspectRatio: '1', minHeight: 48 }} />
        ))}
        {Array.from({ length: total }).map((_, i) => {
          const day = i + 1;
          const key = dateKey(year, month, day);
          const titles = meetingsByDay.get(key);
          return (
            <div
              key={day}
              style={{
                aspectRatio: '1',
                minHeight: 48,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                fontSize: 14,
                position: 'relative',
              }}
            >
              {day}
              {titles && (
                <div
                  style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}
                  onMouseEnter={() => onEnter(key)}
                  onMouseLeave={onLeave}
                >
                  {titles.map((_, di) => (
                    <div key={di} style={{ ...dotStyle, width: 8, height: 8 }} />
                  ))}
                  {hoveredDay === key && <FirmTooltip titles={titles} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────── */
export default function MeetingsCalendar({ meetingsByDay, onClose }: Props) {
  const [year, setYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {selectedMonth === null ? (
          <>
            <div style={navRow}>
              <button
                style={{ ...navBtn, opacity: year <= 2025 ? 0.3 : 1 }}
                disabled={year <= 2025}
                onClick={() => setYear(2025)}
              >
                ←
              </button>
              <h2 style={{ fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: '0.04em' }}>
                {year}
              </h2>
              <button
                style={{ ...navBtn, opacity: year >= 2026 ? 0.3 : 1 }}
                disabled={year >= 2026}
                onClick={() => setYear(2026)}
              >
                →
              </button>
            </div>
            <YearView year={year} meetingsByDay={meetingsByDay} onMonthClick={(m) => setSelectedMonth(m)} />
          </>
        ) : (
          <MonthView
            year={year}
            month={selectedMonth}
            meetingsByDay={meetingsByDay}
            onBack={() => setSelectedMonth(null)}
          />
        )}
      </div>
    </div>
  );
}
