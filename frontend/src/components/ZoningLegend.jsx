import { memo } from 'react'
import { BUCKETS } from '../utils/zoning'

// ─── Legend entries ────────────────────────────────────────────────────────────
// Rendered directly from the shared BUCKETS array (utils/zoning.js).
// The "Other" bucket is hidden from the legend when no buildings use it —
// keeps the visual clean for the Beltline dataset where all codes are known.
// The selection accent row is appended separately since it's not a zoning bucket.

// ─── Dimensions ───────────────────────────────────────────────────────────────
const CHIP_SIZE = 10   // px — small color squares, printed-map-key style
const ROW_GAP   = 8
const CHIP_GAP  = 8    // gap between chip and label

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
function LegendRow({ label, color, description }) {
  return (
    <li style={ROW_STYLE} title={description}>
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
 * ZoningLegend — small printed-map-key showing the data-driven zoning bucket
 * colors plus the selection/query accent. Positioned top-right; hides when the
 * building info panel is visible to avoid stacking two panels on the right.
 *
 * Reads bucket definitions from the shared BUCKETS array (utils/zoning.js) so
 * legend and building materials always stay in sync.
 *
 * @param {{ visible: boolean }} props
 */
function ZoningLegend({ visible }) {
  if (!visible) return null

  return (
    <div style={PANEL_STYLE} role="img" aria-label="Zoning color legend">
      <p style={TITLE_STYLE}>Zoning</p>
      <ul style={LIST_STYLE}>
        {BUCKETS
          .filter(b => b.id !== 'other')
          .map(({ id, label, color, description }) => (
            <LegendRow key={id} label={label} color={color} description={description} />
          ))}
        <LegendRow
          label="Selected / matched"
          color="var(--accent-flag)"
          description="Buildings selected by click or matched by query"
        />
      </ul>
    </div>
  )
}

export default memo(ZoningLegend)
