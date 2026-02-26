// src/app/firms/FirmsTable.tsx
'use client'

import { useState, useMemo, Fragment } from 'react'
import type { Firm } from '../lib/googleSheets'

type SortKey = 'name' | 'dateBooked' | 'aumMillions'
type SortDirection = 'asc' | 'desc'

interface Props {
  initialFirms: Firm[]
}

/* ── shared colour tokens (matching globals.css) ──────────── */
const C = {
  bg: '#05060b',
  panelBg: 'linear-gradient(145deg, rgba(18, 22, 39, 0.92), rgba(7, 9, 18, 0.78))',
  border: 'rgba(88, 203, 255, 0.28)',
  glow: '0 20px 60px rgba(4,6,11,0.85), 0 0 40px rgba(10,129,255,0.18)',
  fg: '#f4f7fb',
  muted: '#8a93ad',
  accent: '#37ff00',
  danger: '#f87171',
  gold: '#facc15',
  blue: '#60a5fa',
  font: 'Arial, sans-serif',
} as const

const glass: React.CSSProperties = {
  background: C.panelBg,
  border: `1px solid ${C.border}`,
  borderRadius: 22,
  backdropFilter: 'blur(24px)',
  boxShadow: C.glow,
  overflow: 'hidden',
  position: 'relative',
}

export default function FirmsTable({ initialFirms }: Props) {
  // ─── STATE ───────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showDate, setShowDate] = useState(true)
  const [showAumCol, setShowAumCol] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('dateBooked')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showMedian, setShowMedian] = useState(true)

  // ─── GROUP BOOKINGS ──────────────────────────────────────
  const groupedFirms = useMemo(() => {
    const map: Record<string, { name: string; dates: string[]; aumMillions: number }> = {}
    initialFirms.forEach(f => {
      if (!map[f.name]) {
        map[f.name] = { name: f.name, dates: [f.dateBooked], aumMillions: f.aumMillions }
      } else {
        map[f.name].dates.push(f.dateBooked)
        map[f.name].aumMillions = Math.max(map[f.name].aumMillions, f.aumMillions)
      }
    })

    return Object.values(map).map(g => {
      const dateObjs = g.dates.map(d => new Date(d))
      dateObjs.sort((a, b) => a.getTime() - b.getTime())

      const earliest = dateObjs[0]
      const latest = dateObjs[dateObjs.length - 1]

      return {
        name: g.name,
        dateBooked: dateObjs
          .map(d => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`)
          .join(', '),
        aumMillions: g.aumMillions,
        earliest,
        latest,
      }
    })
  }, [initialFirms])

  // ─── GPT ─────────────────────────────────────────────────
  const fetchSummary = async (name: string) => {
    if (summaries[name]) return
    const res = await fetch(`/api/meetings?name=${encodeURIComponent(name)}`)
    if (!res.ok) {
      console.error('summary fetch failed', res.status)
      return
    }
    const { summary } = await res.json()
    setSummaries(s => ({ ...s, [name]: summary }))
  }

  const handleNameClick = async (name: string) => {
    if (!summaries[name]) {
      await fetchSummary(name)
      setExpanded(e => ({ ...e, [name]: true }))
    } else {
      setExpanded(e => ({ ...e, [name]: !e[name] }))
    }
  }

  // ─── KPI METRICS ─────────────────────────────────────────
  const totalAum = useMemo(
    () => groupedFirms.reduce((sum, f) => sum + f.aumMillions, 0),
    [groupedFirms]
  )

  const countFirms = groupedFirms.length

  const medianAum = useMemo(() => {
    const validAums = groupedFirms
      .map(f => f.aumMillions)
      .filter(aum => aum > 0)
      .sort((a, b) => a - b)

    const len = validAums.length
    if (len === 0) return 0
    const mid = Math.floor(len / 2)

    return len % 2 !== 0
      ? validAums[mid]
      : (validAums[mid - 1] + validAums[mid]) / 2
  }, [groupedFirms])

  const avgAum = useMemo(() => {
    const validAums = groupedFirms
      .map(f => f.aumMillions)
      .filter(aum => aum > 0)

    if (validAums.length === 0) return 0
    return validAums.reduce((sum, val) => sum + val, 0) / validAums.length
  }, [groupedFirms])

  const [minDate, maxDate] = useMemo(() => {
    if (!initialFirms.length) return [new Date(), new Date()]
    const times = initialFirms.map(f => new Date(f.dateBooked).getTime())
    return [new Date(Math.min(...times)), new Date(Math.max(...times))]
  }, [initialFirms])

  const dateSpan = `${minDate.toLocaleString('default', { month: 'short' })} – ${maxDate.toLocaleString('default', { month: 'short' })} ${maxDate.getFullYear()}`

  // ─── FILTER & SORT ───────────────────────────────────────
  const terms = search.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)

  const filtered = useMemo(() =>
    groupedFirms.filter(f => {
      if (terms.length && !terms.some(t => f.name.toLowerCase().includes(t))) return false
      const d = new Date(f.dateBooked)
      if (startDate && d < new Date(startDate)) return false
      if (endDate && d > new Date(endDate)) return false
      return true
    }),
    [groupedFirms, terms, startDate, endDate]
  )

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'dateBooked')
        cmp = a.latest.getTime() - b.latest.getTime()
      else cmp = a.aumMillions - b.aumMillions
      return direction === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, direction])

  const filteredAum = sorted.reduce((sum, f) => sum + f.aumMillions, 0)

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setDirection(d => d === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setDirection('desc')
    }
  }

  const arrow = (k: SortKey) =>
    sortKey === k ? (direction === 'asc' ? '▴' : '▾') : ''

  // ─── EXPORT / RESET ───────────────────────────────────────
  const exportCSV = () => {
    const cols = ['Firm Name', ...(showDate ? ['Date Booked'] : []), ...(showAumCol ? ['AUM (M)'] : [])]
    const rows = sorted.map(f =>
      [f.name, ...(showDate ? [f.dateBooked] : []), ...(showAumCol ? [f.aumMillions] : [])]
    )
    const csv = [cols, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'firms.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetAll = () => {
    setSearch('')
    setStartDate('')
    setEndDate('')
    setShowDate(true)
    setShowAumCol(true)
    setSortKey('dateBooked')
    setDirection('desc')
  }

  // ─── STYLES ───────────────────────────────────────────────
  const headerCell: React.CSSProperties = {
    padding: '14px 18px',
    borderBottom: `1px solid ${C.border}`,
    textAlign: 'left',
    color: C.muted,
    userSelect: 'none',
    position: 'sticky',
    top: 0,
    background: 'rgba(18, 22, 39, 0.95)',
    zIndex: 1,
    fontFamily: C.font,
    fontSize: 12,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
  }

  const bodyCell: React.CSSProperties = {
    padding: '14px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    color: C.fg,
    fontFamily: C.font,
    fontSize: 14,
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: 'rgba(5,6,11,0.7)',
    color: C.fg,
    fontFamily: C.font,
    fontSize: 14,
    outline: 'none',
  }

  // ─── KPI tiles ────────────────────────────────────────────
  const kpis = [
    [
      'Total AUM',
      `${(totalAum / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Trillion`,
    ],
    ['Number of Firms', countFirms],
    [
      showMedian ? 'Median AUM' : 'Average AUM',
      `${((showMedian ? medianAum : avgAum) / 1_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B`,
    ],
    ['Date Span', dateSpan],
  ] as const

  // ─── render ────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: C.font, color: C.fg }}>
      {/* — KPI STRIP — */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        {kpis.map(([label, val]) => {
          const isAumToggle = label === 'Median AUM' || label === 'Average AUM'
          return (
            <div
              key={label}
              onClick={isAumToggle ? () => setShowMedian(v => !v) : undefined}
              style={{
                ...glass,
                padding: '28px 20px',
                cursor: isAumToggle ? 'pointer' : 'default',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                animation: isAumToggle ? 'glowPulse 2s ease-in-out infinite' : undefined,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{
                width: 48, height: 4, borderRadius: 999,
                background: `linear-gradient(90deg, ${C.accent}, rgba(88,203,255,0.6))`,
                boxShadow: '0 0 18px rgba(88,203,255,0.45)',
              }} />
              <div style={{ fontSize: 12, color: C.muted, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{label}</div>
              <div style={{
                fontSize: 28, fontWeight: 600,
                color: C.fg,
                textShadow: '0 8px 30px rgba(0,0,0,0.45)',
              }}>{val}</div>
            </div>
          )
        })}
      </div>

      {/* — CONTROLS BAR — */}
      <div style={{
        ...glass,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
        padding: '16px 20px',
        marginBottom: 24,
        borderRadius: 16,
      }}>
        <input
          type="text"
          placeholder="Search firms... (comma-separated)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: '2 1 200px' }}
        />
        <label style={{ fontSize: 12, color: C.muted, fontFamily: C.font }}>
          From:
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ ...inputStyle, marginLeft: 4, padding: '4px 8px' }}
          />
        </label>
        <label style={{ fontSize: 12, color: C.muted, fontFamily: C.font }}>
          To:
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{ ...inputStyle, marginLeft: 4, padding: '4px 8px' }}
          />
        </label>
        <label style={{ fontSize: 13, color: C.fg, fontFamily: C.font }}>
          <input
            type="checkbox"
            checked={showDate}
            onChange={e => setShowDate(e.target.checked)}
            style={{ marginRight: 4 }}
          />
          Date
        </label>
        <label style={{ fontSize: 13, color: C.fg, fontFamily: C.font }}>
          <input
            type="checkbox"
            checked={showAumCol}
            onChange={e => setShowAumCol(e.target.checked)}
            style={{ marginRight: 4 }}
          />
          AUM
        </label>
        <button onClick={exportCSV} style={{
          padding: '8px 16px',
          background: `linear-gradient(135deg, ${C.accent}, rgba(88,203,255,0.8))`,
          border: 'none',
          borderRadius: 10,
          color: C.bg,
          fontWeight: 600,
          fontSize: 13,
          fontFamily: C.font,
          cursor: 'pointer',
          letterSpacing: '0.04em',
        }}>Export CSV</button>
        <button onClick={resetAll} style={{
          marginLeft: 'auto',
          background: 'transparent',
          border: 'none',
          color: C.blue,
          fontSize: 13,
          fontFamily: C.font,
          textDecoration: 'underline',
          cursor: 'pointer',
        }}>Reset</button>
      </div>

      {/* — FILTERED AUM — */}
      <div style={{
        fontSize: 16,
        fontWeight: 600,
        textAlign: 'center',
        marginBottom: 20,
        color: C.muted,
        letterSpacing: '0.08em',
        fontFamily: C.font,
      }}>
        Filtered AUM:{' '}
        <span style={{ color: C.fg }}>
          {`${(filteredAum / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Trillion`}
        </span>
      </div>

      {/* — DATA TABLE — */}
      <div style={{
        ...glass,
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight: '80vh',
        borderRadius: 22,
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: C.font,
          fontSize: 14,
        }}>
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')} style={headerCell}>
                Firm Name {arrow('name')}
              </th>
              {showDate && <th onClick={() => toggleSort('dateBooked')} style={headerCell}>
                Date Booked {arrow('dateBooked')}
              </th>}
              {showAumCol && <th onClick={() => toggleSort('aumMillions')} style={headerCell}>
                AUM (M) {arrow('aumMillions')}
              </th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, i) => (
              <Fragment key={f.name + f.dateBooked}>
                <tr
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(88,203,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                >
                  <td
                    style={{ ...bodyCell, cursor: 'pointer', color: C.blue }}
                    onClick={() => handleNameClick(f.name)}
                  >
                    {f.name}
                  </td>
                  {showDate && <td style={bodyCell}>{f.dateBooked}</td>}
                  {showAumCol && <td style={{ ...bodyCell, color: C.accent }}>{f.aumMillions.toLocaleString()}</td>}
                </tr>
                {expanded[f.name] && summaries[f.name] && (
                  <tr>
                    <td
                      colSpan={1 + (showDate ? 1 : 0) + (showAumCol ? 1 : 0)}
                      style={{
                        ...bodyCell,
                        fontStyle: 'italic',
                        background: 'rgba(88,203,255,0.04)',
                        color: C.muted,
                      }}
                    >
                      {summaries[f.name]}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
