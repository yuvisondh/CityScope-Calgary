import { memo } from 'react'

// ─── Legend entries ────────────────────────────────────────────────────────────
// Bucket colors reference DESIGN_SPEC.md Section 2 zoning tokens.
// Kept as a static array — bucket names and colors never change at runtime.
const BUCKETS = [
  { label: 'Commercial core', color: 'var(--zoning-commercial)' },
  { label: 'Mixed use',       color: 'var(--zoning-mixed)' },
  { label: 'Residential',     color: 'var(--zoning-residential)' },
  { label: 'Industrial',      color: 'var(--zoning-industrial)' },
  { label: 'Other',           color: 'var(--zoning-other)' },
  { label: 'Selected / matched', color: 'var(--accent-flag)' },
]

// ─── Dimensions ───────────────────────────────────────────────────────────────
const CHIP_SIZE   = 10  // px — small color squares, printed-map-key style
const ROW_GAP     = 8
const CHIP_GAP    = 8   // gap between chip and label

// ─── Style objects ────────────────────────────────────────────────────────────

const PANEL_STYLE = {
  position: 'absolute',
  top: 16,
  right: 16,
  background: 'var(--bg-panel)',
  border: 'var(--border-panel)',
  borderRadius: 'var(--radius-panel)',
  boxShadow: 'var(--shadow-panel)',
  padding: '12px 16px',
  fontFamily: 'var(--sans)',
  zIndex: 10,
  pointerEvents: 'none',  // legend is read-only, never captures clicks
}

const TITLE_STYLE = {
  margin: '0 0 8px',
  fontSize: 11,
  fontWeight: 500,
  lineHeight: 1.4,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const LIST_STYLE = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: ROW_GAP,
}

const ROW_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: CHIP_GAP,
}

const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 500,
  lineHeight: 1.4,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

// ─── Sub-component ────────────────────────────────────────────────────────────

/** Single row: color chip + bucket label. */
function LegendRow({ label, color }) {
  return (
    <li style={ROW_STYLE}>
      <span
        style={{
          width: CHIP_SIZE,
          height: CHIP_SIZE,
          borderRadius: 2,
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={LABEL_STYLE}>{label}</span>
    </li>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * ZoningLegend — small printed-map-key showing the five zoning bucket colors
 * plus the selection/query accent. Positioned top-right; hides when the
 * building info panel is visible to avoid stacking two panels on the right.
 *
 * @param {{ visible: boolean }} props
 */
function ZoningLegend({ visible }) {
  if (!visible) return null

  return (
    <div style={PANEL_STYLE} role="img" aria-label="Zoning color legend">
      <p style={TITLE_STYLE}>Zoning</p>
      <ul style={LIST_STYLE}>
        {BUCKETS.map(({ label, color }) => (
          <LegendRow key={label} label={label} color={color} />
        ))}
      </ul>
    </div>
  )
}

export default memo(ZoningLegend)
