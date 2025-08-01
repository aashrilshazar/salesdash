'use client'

import { useState, useEffect } from 'react'
import React from 'react'

// Types remain the same
interface Deal {
  id: string
  firmName: string
  stage: string
  createdAt: string
  lastActivity: string
  value: string
  contactCount: number
  emailCount: number
  meetingCount: number
  noteCount: number
}

interface Stage {
  id: string
  title: string
  color: string
  count: number
  type: 'main' | 'auxiliary'
}

// Updated stages data with main pipeline and auxiliary stages
const stages: Stage[] = [
  // Main Pipeline Stages (left to right)
  { id: 'meeting-booked', title: 'Meeting Booked', color: '#3b82f6', count: 0, type: 'main' },
  { id: 'active-conversation', title: 'Active Conversation', color: '#22c55e', count: 0, type: 'main' },
  { id: 'nda-considering', title: 'NDA (Considering)', color: '#f97316', count: 0, type: 'main' },
  { id: 'nda-signed', title: 'NDA (Signed)', color: '#14b8a6', count: 0, type: 'main' },
  { id: 'documents-uploaded', title: 'Documents Uploaded', color: '#06b6d4', count: 0, type: 'main' },
  { id: 'contract-negotiations', title: 'Contract Negotiations', color: '#ec4899', count: 0, type: 'main' },
  { id: 'won', title: 'Won', color: '#a855f7', count: 0, type: 'main' },
  // Auxiliary Stages
  { id: 'not-now', title: 'Not Now', color: '#6b7280', count: 0, type: 'auxiliary' },
  { id: 'exploring-other-options', title: 'Exploring Other Options', color: '#eab308', count: 0, type: 'auxiliary' },
  { id: 'not-interested', title: 'Not Interested', color: '#ef4444', count: 0, type: 'auxiliary' },
]

// DealCard Component with value display
function DealCard({ deal }: { deal: Deal }) {
  const stage = stages.find(s => s.id === deal.stage)
  
  // Format value as currency with dollar sign
  const formatValue = (value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return null
    return `$${numValue.toLocaleString()}`
  }
  
  return (
    <div style={styles.dealCard}>
      <div style={styles.dealHeader}>
        <div style={{...styles.dealStageIndicator, backgroundColor: stage?.color || '#9ca3af'}}></div>
        <div style={styles.dealMenu}>⋮</div>
      </div>
      
      <div style={styles.dealName}>{deal.firmName}</div>
      
      {/* Display value if it exists */}
      {deal.value && formatValue(deal.value) && (
        <div style={styles.dealValue}>{formatValue(deal.value)}</div>
      )}
      
      <div style={styles.dealMetrics}>
        {deal.contactCount > 0 && <span style={styles.dealMetric}>👤 {deal.contactCount}</span>}
        {deal.emailCount > 0 && <span style={styles.dealMetric}>✉️ {deal.emailCount}</span>}
        {deal.meetingCount > 0 && <span style={styles.dealMetric}>📅 {deal.meetingCount}</span>}
        {deal.noteCount > 0 && <span style={styles.dealMetric}>📝 {deal.noteCount}</span>}
      </div>
      
      <div style={styles.dealTimestamps}>
        {deal.createdAt && <span style={styles.timestamp}>⏱ {deal.createdAt}</span>}
        <span style={styles.timestamp}>⏰ {deal.lastActivity}</span>
      </div>
    </div>
  )
}

// StageColumn Component with auxiliary stage styling
function StageColumn({ stage, deals }: { stage: Stage; deals: Deal[] }) {
  const columnStyle = stage.type === 'auxiliary' 
    ? { ...styles.stageColumn, ...styles.auxiliaryColumn }
    : styles.stageColumn;

  return (
    <div style={columnStyle}>
      <div style={styles.stageHeader}>
        <div style={{...styles.stageDot, backgroundColor: stage.color}}></div>
        <h3 style={styles.stageTitle}>{stage.title}</h3>
        <span style={styles.stageCount}>{deals.length}</span>
      </div>
      
      <div style={styles.dealsContainer}>
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  )
}

// Main KanbanBoard Component with Google Sheets integration
export default function KanbanBoard() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch data from Google Sheets
  const fetchData = async () => {
    try {
      const response = await fetch('/api/pipeline')
      if (!response.ok) throw new Error('Failed to fetch data')
      
      const data = await response.json()
      setDeals(data.deals)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Group deals by stage
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => deal.stage === stage.id)
    return acc
  }, {} as Record<string, Deal[]>)

  // Separate main and auxiliary stages
  const mainStages = stages.filter(s => s.type === 'main')
  const auxiliaryStages = stages.filter(s => s.type === 'auxiliary')

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading pipeline data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>Error: {error}</div>
        <button style={styles.retryButton} onClick={fetchData}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={styles.kanbanContainer}>
      {/* Status bar */}
      <div style={styles.statusBar}>
        <span style={styles.statusText}>
          {deals.length} total deals
        </span>
        {lastUpdated && (
          <span style={styles.statusText}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <button style={styles.refreshButton} onClick={fetchData}>
          🔄 Refresh
        </button>
      </div>
      
      {/* Main Pipeline */}
      <div style={styles.kanbanBoard}>
        {mainStages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage[stage.id] || []}
          />
        ))}
      </div>

      {/* Divider */}
      <div style={styles.divider}>
        <span style={styles.dividerText}>Auxiliary Stages</span>
      </div>

      {/* Auxiliary Stages */}
      <div style={styles.kanbanBoard}>
        {auxiliaryStages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage[stage.id] || []}
          />
        ))}
      </div>
    </div>
  )
}

// Extended styles
const styles = {
  kanbanContainer: {
    width: '100%',
    padding: '20px',
    overflowX: 'auto' as const,
  },
  kanbanBoard: {
    display: 'flex',
    gap: '20px',
    minWidth: 'max-content',
    paddingBottom: '20px',
    overflowX: 'auto' as const,
  },
  stageColumn: {
    flex: '0 0 300px',
    minHeight: '400px',
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderRadius: '8px',
    padding: '16px',
  },
  auxiliaryColumn: {
    opacity: 0.8,
    borderStyle: 'dashed' as const,
    borderWidth: '1px',
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  stageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    padding: '0 4px',
  },
  stageDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  stageTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#d1d5db',
    whiteSpace: 'nowrap' as const,
    flex: 1,
    margin: 0,
  },
  stageCount: {
    fontSize: '13px',
    color: '#6b7280',
    backgroundColor: '#18181b',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  dealsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    minHeight: '200px',
  },
  dealCard: {
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    border: '1px solid rgba(63, 63, 70, 0.5)',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  dealHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  dealStageIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginTop: '2px',
  },
  dealMenu: {
    color: '#71717a',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: 1,
  },
  dealName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#e5e7eb',
    marginBottom: '8px',
  },
  dealValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#22c55e',
    marginBottom: '8px',
  },
  dealMetrics: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
    fontSize: '12px',
    color: '#9ca3af',
  },
  dealMetric: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  dealTimestamps: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#6b7280',
  },
  timestamp: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  addCalculation: {
    marginTop: '12px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#6b7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
    transition: 'color 0.2s',
  },
  // New styles for loading, error, and status
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: '16px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '16px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    padding: '12px',
    backgroundColor: 'rgba(39, 39, 42, 0.5)',
    borderRadius: '8px',
  },
  statusText: {
    fontSize: '13px',
    color: '#9ca3af',
  },
  refreshButton: {
    marginLeft: 'auto',
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: '#3b82f6',
    border: '1px solid #3b82f6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  divider: {
    margin: '32px 0 20px 0',
    textAlign: 'center' as const,
    position: 'relative' as const,
  },
  dividerText: {
    backgroundColor: '#0a0a0a',
    padding: '0 16px',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 500,
    position: 'relative' as const,
    display: 'inline-block',
  },
}