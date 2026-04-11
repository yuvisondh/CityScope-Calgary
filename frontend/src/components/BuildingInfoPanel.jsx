import { memo } from 'react'

// ─── Style objects — all colors via CSS custom properties (DESIGN_SPEC.md) ────
// Panel visual treatment: Section 4. Type scale: Section 3. Colors: Section 2.

const PANEL_STYLE = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 320,
  maxHeight: 'calc(100vh - 32px)',
  background: 'var(--bg-panel)',
  color: 'var(--text-primary)',
  padding: 'var(--panel-padding)',
  fontFamily: 'var(--sans)',
  overflowY: 'auto',
  boxSizing: 'border-box',
  border: 'var(--border-panel)',
  borderRadius: 'var(--radius-panel)',
  boxShadow: 'var(--shadow-panel)',
  // Opacity fade entrance — Section 8 wins over Section 6: no positional slide,
  // the tool snaps. Simple opacity transition for a soft appear.
  transition: 'opacity 300ms ease-out',
}

const HEADER_STYLE = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 12,
}

// --text-display: 14px / 600 / 1.3
const TITLE_STYLE = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.3,
  color: 'var(--text-primary)',
  fontFamily: 'var(--sans)',
}

const CLOSE_BTN_STYLE = {
  flexShrink: 0,
  background: 'var(--bg-panel-hover)',
  border: 'none',
  color: 'var(--text-primary)',
  width: 28,
  height: 28,
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: '28px',
  textAlign: 'center',
  padding: 0,
}

const DIVIDER_STYLE = {
  border: 'none',
  borderTop: 'var(--border-panel)',
  margin: '12px 0',
}

const DL_STYLE = {
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  columnGap: 16,
  rowGap: 12,
}

// --text-label: 11px / 500 / 1.4, uppercase, letter-spacing 0.04em
const DT_STYLE = {
  color: 'var(--text-secondary)',
  fontSize: 11,
  fontWeight: 500,
  lineHeight: 1.4,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  margin: 0,
  fontFamily: 'var(--sans)',
}

// --text-data: 13px / 500 / 1.4, Plex Mono for numerical values
const DD_STYLE = {
  color: 'var(--text-mono)',
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.4,
  margin: 0,
  textAlign: 'right',
  fontFamily: 'var(--mono)',
}

// --text-caption: 10px / 400 / 1.4
const FOOTNOTE_STYLE = {
  marginTop: 20,
  fontSize: 10,
  fontWeight: 400,
  lineHeight: 1.4,
  color: 'var(--text-muted)',
  fontFamily: 'var(--sans)',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a display-ready address string.
 * Addresses with fewer than 3 whitespace-separated tokens lack a civic number
 * (e.g. "16 AV SW" is a land parcel, not a unit on a street) and are
 * presented as "Parcel on {address}" to avoid misleading the reader.
 * @param {string} address
 * @returns {string}
 */
function formatAddress(address) {
  return address.trim().split(/\s+/).length < 3
    ? `Parcel on ${address}`
    : address
}

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
        <h2 style={TITLE_STYLE}>{formatAddress(address)}</h2>
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

      <p style={FOOTNOTE_STYLE}>
        Data sourced from City of Calgary Open Data (2026 assessment roll + building footprints).
      </p>
    </div>
  )
}

// Memo: only re-renders when the selected building reference changes
export default memo(BuildingInfoPanel)
