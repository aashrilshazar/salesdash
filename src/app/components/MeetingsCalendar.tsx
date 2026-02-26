'use client';

import { useState } from 'react';

type Props = {
  meetingDays: Set<string>;
  onClose: () => void;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

const dot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: '#37ff00',
  margin: '2px auto 0',
};

/* ── Year View ─────────────────────────────── */
function YearView({
  year,
  meetingDays,
  onMonthClick,
}: {
  year: number;
  meetingDays: Set<string>;
  onMonthClick: (month: number) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
      {MONTH_NAMES.map((name, mi) => {
        const total = daysInMonth(year, mi);
        const offset = startDay(year, mi);
        return (
          <div key={name} style={{ minWidth: 0 }}>
            <div
              onClick={() => onMonthClick(mi)}
              style={{
                textAlign: 'center',
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 6,
                cursor: 'pointer',
                color: '#f4f7fb',
                letterSpacing: '0.06em',
              }}
            >
              {name}
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
                const has = meetingDays.has(dateKey(year, mi, day));
                return (
                  <span key={day} style={{ fontSize: 10, lineHeight: '16px', padding: '2px 0' }}>
                    {day}
                    {has && <div style={dot} />}
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
  meetingDays,
  onBack,
}: {
  year: number;
  month: number;
  meetingDays: Set<string>;
  onBack: () => void;
}) {
  const total = daysInMonth(year, month);
  const offset = startDay(year, month);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button onClick={onBack} style={navBtn}>←</button>
        <h3 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '0.04em' }}>
          {MONTH_NAMES[month]} {year}
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
          const has = meetingDays.has(dateKey(year, month, day));
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
              }}
            >
              {day}
              {has && <div style={{ ...dot, width: 8, height: 8, marginTop: 4 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────── */
export default function MeetingsCalendar({ meetingDays, onClose }: Props) {
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
            <YearView year={year} meetingDays={meetingDays} onMonthClick={(m) => setSelectedMonth(m)} />
          </>
        ) : (
          <MonthView
            year={year}
            month={selectedMonth}
            meetingDays={meetingDays}
            onBack={() => setSelectedMonth(null)}
          />
        )}
      </div>
    </div>
  );
}
