// src/app/firms/FirmsTable.tsx
'use client'

import { useState, useMemo, Fragment } from 'react'
import type { Firm } from '../lib/googleSheets'

type SortKey = 'name' | 'dateBooked' | 'aumMillions'
type SortDirection = 'asc' | 'desc'

interface Props {
  initialFirms: Firm[]
}

export default function FirmsTable({ initialFirms }: Props) {
  // ─── STATE ───────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showDate, setShowDate] = useState(true)
  const [showAumCol, setShowAumCol] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('aumMillions')
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
    return Object.values(map).map(g => ({
      name: g.name,
      dateBooked: g.dates
        .map(d => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime())
        .map(d => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`)
        .join(', '),
      aumMillions: g.aumMillions,
    }))
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

    const total = validAums.reduce((sum, val) => sum + val, 0)
    return total / validAums.length
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
        cmp = new Date(a.dateBooked).getTime() - new Date(b.dateBooked).getTime()
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
    setSortKey('aumMillions')
    setDirection('desc')
  }

  // ─── STYLES ───────────────────────────────────────────────
  const headerCell: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #444',
    textAlign: 'left',
    color: '#eee',
    userSelect: 'none',
    position: 'sticky',
    top: 0,
    background: '#2a2a2a',
    zIndex: 1,
  }

  const bodyCell: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #333',
    color: '#ddd',
  }

  // ─── render ────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', color: 'white' }}>
      {/* — KPI STRIP — */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {[
  [ 
    'Total AUM', 
    `${(totalAum / 1_000_000)
        .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
     Trillion` 
  ],
  ['Number of Firms', countFirms],
  [
    showMedian ? 'Median AUM' : 'Average AUM',
    `${((showMedian ? medianAum : avgAum) / 1_000)
        .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
     B`
  ],
  ['Date span', dateSpan],
].map(([label, val], _idx) => {
  const isAumToggle = label === 'Median AUM' || label === 'Average AUM'
  return (
    <div
      key={label}
      onClick={isAumToggle ? () => setShowMedian(v => !v) : undefined}
    style={{
        background: '#1e1e1e',
        padding: 16,
        borderRadius: 8,
        /* use “grab” for clickable tile */
        cursor: isAumToggle ? 'grab' : 'default',
        textAlign: 'center',       // ensures label + value stay centered
        display: 'flex',            // allow centering both axes
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        /* base shadow + subtle glow for AUM toggle */
        boxShadow: isAumToggle
            ? '0 2px 6px rgba(0,0,0,0.5), 0 0 16px rgba(78,161,255,0.7), 0 0 24px rgba(78,161,255,0.5)'
            : '0 2px 6px rgba(0,0,0,0.5)',
        transition: 'opacity 0.3s ease',
        animation: isAumToggle ? 'glowPulse 2s ease-in-out infinite' : undefined,
        }}
        onMouseEnter={isAumToggle ? (e) =>
            (e.currentTarget.style.boxShadow =
                '0 2px 6px rgba(0,0,0,0.5), 0 0 12px rgba(78,161,255,0.6)')
            : undefined}
            onMouseLeave={isAumToggle ? (e) =>
                (e.currentTarget.style.boxShadow =
                    '0 2px 6px rgba(0,0,0,0.5), 0 0 8px rgba(78,161,255,0.4)')
            : undefined}
    >
      <div style={{ fontSize: 13, color: '#bbb' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, marginTop: 6 }}>{val}</div>
    </div>
  )
})}
      </div>

      {/* — CONTROLS BAR — */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
        background: '#1a1a1a',
        padding: 12,
        borderRadius: 6,
        marginBottom: 24,
      }}>
        <input
          type="text"
          placeholder="Search firms... (comma-separated)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: '2 1 200px',
            padding: '8px 12px',
            borderRadius: 4,
            border: '1px solid #444',
            background: '#111',
            color: 'white',
            fontSize: 14,
          }}
        />
        <label style={{ fontSize: 12 }}>
          From:
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{
              marginLeft: 4,
              padding: 4,
              borderRadius: 4,
              border: '1px solid #444',
              background: '#111',
              color: 'white',
            }}
          />
        </label>
        <label style={{ fontSize: 12 }}>
          To:
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{
              marginLeft: 4,
              padding: 4,
              borderRadius: 4,
              border: '1px solid #444',
              background: '#111',
              color: 'white',
            }}
          />
        </label>
        <label style={{ fontSize: 14 }}>
          <input
            type="checkbox"
            checked={showDate}
            onChange={e => setShowDate(e.target.checked)}
            style={{ marginRight: 4 }}
          />
          Date
        </label>
        <label style={{ fontSize: 14 }}>
          <input
            type="checkbox"
            checked={showAumCol}
            onChange={e => setShowAumCol(e.target.checked)}
            style={{ marginRight: 4 }}
          />
          AUM
        </label>
        <button onClick={exportCSV} style={{
          padding: '6px 12px',
          background: '#4ea1ff',
          border: 'none',
          borderRadius: 4,
          color: '#111',
          fontWeight: 600,
          cursor: 'pointer',
        }}>Export CSV</button>
        <button onClick={resetAll} style={{
          marginLeft: 'auto',
          background: 'transparent',
          border: 'none',
          color: '#4ea1ff',
          fontSize: 14,
          textDecoration: 'underline',
          cursor: 'pointer',
        }}>Reset</button>
      </div>

      {/* — FILTERED AUM — */}
    <div style={{
        fontSize: 18,
        fontWeight: 600,
        textAlign: 'center',
        marginBottom: 16,
    }}>
    Filtered AUM: {`${(filteredAum / 1000000)
      .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Trillion`}
    </div>

      {/* — DATA TABLE — */}
      <div style={{
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight: '80vh',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: '#1a1a1a',
          fontSize: 15,
        }}>
          <thead>
            <tr style={{ background: '#2a2a2a' }}>
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
                <tr style={{
                  background: i % 2 === 0 ? '#1a1a1a' : '#111',
                  transition: 'background 0.3s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#333'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#1a1a1a' : '#111'}
                >
                  <td
                    style={{ ...bodyCell, cursor: 'pointer' }}
                    onClick={() => handleNameClick(f.name)}
                  >
                    {f.name}
                  </td>
                  {showDate && <td style={bodyCell}>{f.dateBooked}</td>}
                  {showAumCol && <td style={bodyCell}>{f.aumMillions.toLocaleString()}</td>}
                </tr>
                {expanded[f.name] && summaries[f.name] && (
                  <tr>
                    <td
                      colSpan={1 + (showDate ? 1 : 0) + (showAumCol ? 1 : 0)}
                      style={{ ...bodyCell, fontStyle: 'italic', background: '#222' }}
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