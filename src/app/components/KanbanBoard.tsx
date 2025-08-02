'use client'

import { useState, useEffect, useRef } from 'react'
import React from 'react'

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

const stages: Stage[] = [
  { id: 'meeting-booked', title: 'Meeting Booked', color: '#3b82f6', count: 0, type: 'main' },
  { id: 'active-conversation', title: 'Active Conversation', color: '#22c55e', count: 0, type: 'main' },
  { id: 'nda-considering', title: 'NDA (Considering)', color: '#f97316', count: 0, type: 'main' },
  { id: 'nda-signed', title: 'NDA (Signed)', color: '#14b8a6', count: 0, type: 'main' },
  { id: 'documents-uploaded', title: 'Documents Uploaded', color: '#06b6d4', count: 0, type: 'main' },
  { id: 'contract-negotiations', title: 'Contract Negotiations', color: '#ec4899', count: 0, type: 'main' },
  { id: 'won', title: 'Won', color: '#a855f7', count: 0, type: 'main' },
  { id: 'not-now', title: 'Not Now', color: '#6b7280', count: 0, type: 'auxiliary' },
  { id: 'exploring-other-options', title: 'Exploring Other Options', color: '#eab308', count: 0, type: 'auxiliary' },
  { id: 'not-interested', title: 'Not Interested', color: '#ef4444', count: 0, type: 'auxiliary' },
]

// Deal Form Modal
function DealFormModal({ isOpen, onClose, onSubmit, initialData = null }: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Deal>) => void
  initialData?: Deal | null
}) {
  const [formData, setFormData] = useState({
    firmName: '',
    stage: 'meeting-booked',
    createdAt: new Date().toLocaleDateString(),
    lastActivity: new Date().toLocaleDateString(),
    value: '',
    contactCount: 0,
    emailCount: 0,
    meetingCount: 0,
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        firmName: initialData.firmName,
        stage: initialData.stage,
        createdAt: initialData.createdAt,
        lastActivity: initialData.lastActivity,
        value: initialData.value,
        contactCount: initialData.contactCount,
        emailCount: initialData.emailCount,
        meetingCount: initialData.meetingCount,
      })
    }
  }, [initialData])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!formData.firmName || !formData.stage) {
      alert('Please fill in required fields')
      return
    }
    onSubmit(formData)
    onClose()
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>{initialData ? 'Edit Deal' : 'New Deal'}</h2>
        <div>
          <div style={styles.formGroup}>
            <div style={styles.label}>Firm Name *</div>
            <input
              type="text"
              value={formData.firmName}
              onChange={e => setFormData(prev => ({ ...prev, firmName: e.target.value }))}
              style={styles.input}
              placeholder="Enter firm name"
            />
          </div>

          <div style={styles.formGroup}>
            <div style={styles.label}>Stage *</div>
            <select
              value={formData.stage}
              onChange={e => setFormData(prev => ({ ...prev, stage: e.target.value }))}
              style={styles.select}
            >
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.title}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <div style={styles.label}>Contract Value ($)</div>
            <input
              type="number"
              value={formData.value}
              onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
              style={styles.input}
              placeholder="0"
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <div style={styles.label}>Contact Count</div>
              <input
                type="number"
                value={formData.contactCount}
                onChange={e => setFormData(prev => ({ ...prev, contactCount: parseInt(e.target.value) || 0 }))}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <div style={styles.label}>Email Count</div>
              <input
                type="number"
                value={formData.emailCount}
                onChange={e => setFormData(prev => ({ ...prev, emailCount: parseInt(e.target.value) || 0 }))}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <div style={styles.label}>Meeting Count</div>
              <input
                type="number"
                value={formData.meetingCount}
                onChange={e => setFormData(prev => ({ ...prev, meetingCount: parseInt(e.target.value) || 0 }))}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} style={styles.submitButton}>
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// DealCard Component
function DealCard({ deal, onEdit, onDelete, onDragStart, onDragEnd }: {
  deal: Deal
  onEdit: (deal: Deal) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, deal: Deal) => void
  onDragEnd: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const stage = stages.find(s => s.id === deal.stage)
  
  const formatValue = (value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return null
    return `$${numValue.toLocaleString()}`
  }
  
  return (
    <div 
      style={styles.dealCard}
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onDragEnd={onDragEnd}
    >
      <div style={styles.dealHeader}>
        <div style={{...styles.dealStageIndicator, backgroundColor: stage?.color || '#9ca3af'}}></div>
        <div 
          style={styles.dealMenu} 
          onClick={() => setShowMenu(!showMenu)}
        >
          ⋮
          {showMenu && (
            <div style={styles.menuDropdown} onClick={e => e.stopPropagation()}>
              <button onClick={() => { onEdit(deal); setShowMenu(false); }} style={styles.menuItem}>
                Edit
              </button>
              <button onClick={() => { onDelete(deal.id); setShowMenu(false); }} style={styles.menuItemDanger}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div style={styles.dealName}>{deal.firmName}</div>
      
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

// StageColumn Component
function StageColumn({ stage, deals, onDrop, onEdit, onDelete, onDragStart, onDragEnd }: {
  stage: Stage
  deals: Deal[]
  onDrop: (e: React.DragEvent, stageId: string) => void
  onEdit: (deal: Deal) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, deal: Deal) => void
  onDragEnd: () => void
}) {
  const [dragOver, setDragOver] = useState(false)
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }
  
  const handleDragLeave = () => {
    setDragOver(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    onDrop(e, stage.id)
  }

  const columnStyle = stage.type === 'auxiliary' 
    ? { ...styles.stageColumn, ...styles.auxiliaryColumn }
    : styles.stageColumn;

  return (
    <div 
      style={{
        ...columnStyle,
        ...(dragOver ? styles.dragOver : {})
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={styles.stageHeader}>
        <div style={{...styles.stageDot, backgroundColor: stage.color}}></div>
        <h3 style={styles.stageTitle}>{stage.title}</h3>
        <span style={styles.stageCount}>{deals.length}</span>
      </div>
      
      <div style={styles.dealsContainer}>
        {deals.map((deal) => (
          <DealCard 
            key={deal.id} 
            deal={deal} 
            onEdit={onEdit}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  )
}

// Main KanbanBoard Component
export default function KanbanBoard() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showDealForm, setShowDealForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)

  // Fetch data
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

  // Create/Update deal
  const saveDeal = async (dealData: Partial<Deal>) => {
    try {
      const isUpdate = !!editingDeal
      const response = await fetch('/api/pipeline', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUpdate ? { ...editingDeal, ...dealData } : dealData),
      })
      
      if (!response.ok) throw new Error('Failed to save deal')
      
      await fetchData() // Refresh data
      setEditingDeal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  // Delete deal
  const deleteDeal = async (id: string) => {
    if (!confirm('Delete this deal?')) return
    
    try {
      const response = await fetch(`/api/pipeline?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete deal')
      
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedDeal(null)
  }

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault()
    if (!draggedDeal || draggedDeal.stage === newStage) return

    const updatedDeal = { ...draggedDeal, stage: newStage }
    
    // Optimistic update
    setDeals(prev => prev.map(d => d.id === draggedDeal.id ? updatedDeal : d))
    
    // Update server
    try {
      const response = await fetch('/api/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDeal),
      })
      
      if (!response.ok) throw new Error('Failed to update stage')
    } catch (err) {
      // Revert on error
      await fetchData()
      setError('Failed to update stage')
    }
  }

  // Effects
  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Group deals by stage
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => deal.stage === stage.id)
    return acc
  }, {} as Record<string, Deal[]>)

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
        <button style={styles.createButton} onClick={() => setShowDealForm(true)}>
          + New Deal
        </button>
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
            onDrop={handleDrop}
            onEdit={(deal) => { setEditingDeal(deal); setShowDealForm(true); }}
            onDelete={deleteDeal}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
            onDrop={handleDrop}
            onEdit={(deal) => { setEditingDeal(deal); setShowDealForm(true); }}
            onDelete={deleteDeal}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Deal Form Modal */}
      <DealFormModal
        isOpen={showDealForm}
        onClose={() => { setShowDealForm(false); setEditingDeal(null); }}
        onSubmit={saveDeal}
        initialData={editingDeal}
      />
    </div>
  )
}

// Styles
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
    transition: 'all 0.2s',
  },
  auxiliaryColumn: {
    opacity: 0.8,
    borderStyle: 'dashed' as const,
    borderWidth: '1px',
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  dragOver: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
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
    cursor: 'grab',
    transition: 'all 0.2s',
    position: 'relative' as const,
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
    position: 'relative' as const,
  },
  menuDropdown: {
    position: 'absolute' as const,
    top: '20px',
    right: '0',
    backgroundColor: '#27272a',
    border: '1px solid #3f3f46',
    borderRadius: '6px',
    overflow: 'hidden',
    zIndex: 1000,
    minWidth: '120px',
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    color: '#e5e7eb',
    fontSize: '13px',
    textAlign: 'left' as const,
    cursor: 'pointer',
  },
  menuItemDanger: {
    display: 'block',
    width: '100%',
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '13px',
    textAlign: 'left' as const,
    cursor: 'pointer',
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
  createButton: {
    marginLeft: 'auto',
    padding: '6px 16px',
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  refreshButton: {
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
  // Modal styles
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modalContent: {
    backgroundColor: '#27272a',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#e5e7eb',
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '6px',
    color: '#e5e7eb',
    fontSize: '14px',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '6px',
    color: '#e5e7eb',
    fontSize: '14px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #3f3f46',
    borderRadius: '6px',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
}