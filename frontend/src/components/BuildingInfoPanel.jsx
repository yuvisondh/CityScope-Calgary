import { memo } from 'react'

// ─── Color constants ───────────────────────────────────────────────────────────
const PANEL_BG     = 'rgba(13,17,23,0.92)'
const PANEL_TEXT   = '#e6edf3'
const PANEL_MUTED  = '#8b949e'
const DIVIDER      = 'rgba(255,255,255,0.08)'
const CLOSE_BG     = 'rgba(255,255,255,0.10)'

// ─── Style objects ─────────────────────────────────────────────────────────────
const PANEL_STYLE = {
  position: 'absolute',
  top: 0,
  right: 0,
  width: 300,
  height: '100%',
  background: PANEL_BG,
  color: PANEL_TEXT,
  padding: '20px 18px',
  fontFamily: 'sans-serif',
  overflowY: 'auto',
  boxSizing: 'border-box',
  borderLeft: `1px solid ${DIVIDER}`,
}

const HEADER_STYLE = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 12,
}

const TITLE_STYLE = {
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.4,
  color: PANEL_TEXT,
}

const CLOSE_BTN_STYLE = {
  flexShrink: 0,
  background: CLOSE_BG,
  border: 'none',
  color: PANEL_TEXT,
  width: 28,
  height: 28,
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: '28px',
  textAlign: 'center',
  padding: 0,
}

const DIVIDER_STYLE = {
  border: 'none',
  borderTop: `1px solid ${DIVIDER}`,
  margin: '12px 0',
}

const DL_STYLE = {
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  columnGap: 16,
  rowGap: 10,
}

const DT_STYLE = { color: PANEL_MUTED, fontSize: 12, fontWeight: 500, margin: 0 }
const DD_STYLE = { color: PANEL_TEXT,  fontSize: 13, margin: 0, textAlign: 'right' }

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats a numeric value as Canadian dollars with no decimal places.
 * @param {number} value
 * @returns {string}
 */
function formatCAD(value) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Converts metres to feet, rounded to one decimal place.
 * @param {number} m
 * @returns {string}
 */
function metresToFeet(m) {
  return (m * 3.28084).toFixed(1)
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Single label/value row inside the info panel. */
function Row({ label, value }) {
  return (
    <>
      <dt style={DT_STYLE}>{label}</dt>
      <dd style={DD_STYLE}>{value}</dd>
    </>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * BuildingInfoPanel — fixed right-side panel showing details for the
 * currently selected building. Renders nothing when no building is selected.
 *
 * @param {{ building: Object|null, onClose: Function }} props
 */
function BuildingInfoPanel({ building, onClose }) {
  // Early return — renders nothing when nothing is selected
  if (!building) return null

  const { address, height_m, num_floors, zoning, land_use, assessed_value } = building

  return (
    <div style={PANEL_STYLE}>
      <div style={HEADER_STYLE}>
        <h2 style={TITLE_STYLE}>{address}</h2>
        <button style={CLOSE_BTN_STYLE} onClick={onClose} aria-label="Close panel">
          ✕
        </button>
      </div>

      <hr style={DIVIDER_STYLE} />

      <dl style={DL_STYLE}>
        <Row label="Height"     value={`${height_m}m / ${metresToFeet(height_m)}ft`} />
        <Row label="Floors"     value={num_floors ?? '—'} />
        <Row label="Zoning"     value={zoning ?? '—'} />
        <Row label="Land Use"   value={land_use ?? '—'} />
        <Row label="Assessment" value={assessed_value ? formatCAD(assessed_value) : '—'} />
      </dl>
    </div>
  )
}

// Memo: only re-renders when the selected building reference changes
export default memo(BuildingInfoPanel)
