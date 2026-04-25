import { memo } from 'react'

const WRAPPER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 14px',
  background: 'var(--bg-panel)',
  border: 'var(--border-panel)',
  borderRadius: 'var(--radius-panel)',
  boxShadow: 'var(--shadow-panel)',
  fontFamily: 'var(--sans)',
  color: 'var(--text-secondary)',
}

const END_LABEL_STYLE = {
  fontSize: 10,
  fontFamily: 'var(--mono)',
  color: 'var(--text-tertiary, var(--text-secondary))',
  letterSpacing: '0.02em',
  whiteSpace: 'nowrap',
}

const SLIDER_STYLE = {
  width: 300,
  accentColor: 'var(--accent-flag)',
  cursor: 'pointer',
}

const TIME_LABEL_STYLE = {
  fontSize: 12,
  fontFamily: 'var(--mono)',
  fontWeight: 500,
  color: 'var(--text-primary)',
  letterSpacing: '0.02em',
  minWidth: 64,
  textAlign: 'right',
}

/** Format a 0–24 float as "h:mm AM/PM" — e.g. 14.5 → "2:30 PM". */
function formatHour(hour) {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  const period = h < 12 || h === 24 ? 'AM' : 'PM'
  let display = h % 12
  if (display === 0) display = 12
  return `${display}:${m.toString().padStart(2, '0')} ${period}`
}

/**
 * TimeSlider — horizontal 0–24h slider for the shadow study mode. Emits the
 * current hour as a float (step 0.5) via onChange and renders a formatted
 * 12-hour label. Memoized; only re-renders on value/onChange change.
 *
 * @param {{ value: number, onChange: (h: number) => void }} props
 */
function TimeSlider({ value, onChange }) {
  return (
    <div style={WRAPPER_STYLE}>
      <span style={END_LABEL_STYLE}>12 AM</span>
      <input
        type="range"
        min={0}
        max={24}
        step={0.5}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={SLIDER_STYLE}
        aria-label="Time of day"
      />
      <span style={END_LABEL_STYLE}>12 AM</span>
      <span style={TIME_LABEL_STYLE}>{formatHour(value)}</span>
    </div>
  )
}

export default memo(TimeSlider)
