import { useState, memo } from 'react'

// ─── Style objects — all colors via CSS custom properties (DESIGN_SPEC.md) ────

const WRAPPER_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  width: 480,
}

const FORM_STYLE = {
  display: 'flex',
  width: '100%',
  gap: 8,
}

const INPUT_STYLE = {
  flex: 1,
  padding: '10px 12px',
  background: 'var(--bg-panel)',
  border: 'var(--border-panel)',
  borderRadius: 'var(--radius-panel)',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontWeight: 400,
  lineHeight: 1.5,
  outline: 'none',
  fontFamily: 'var(--sans)',
}

// --text-caption: 10px / 400 / 1.4 — used for badge and method text
const BADGE_STYLE_BASE = {
  fontSize: 10,
  fontWeight: 500,
  fontFamily: 'var(--mono)',
  padding: '2px 8px',
  borderRadius: 99,
  letterSpacing: '0.02em',
}

const META_STYLE = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  fontSize: 10,
  fontFamily: 'var(--sans)',
}

// ─── Method badge display mapping (DESIGN_SPEC.md Section 7) ──────────────────
const METHOD_LABELS = {
  llm:         'via AI',
  fallback:    'via pattern match',
  superlative: 'via superlative',
  saved:       'via saved project',
  none:        'no match',
}

/**
 * QueryInput — bottom-center search bar for natural language building queries.
 * Manages its own input text state; fires onSubmit(text) on form submit.
 *
 * @param {{ onSubmit: Function, loading: boolean, error: string|null, methodUsed: string|null }} props
 */
function QueryInput({ onSubmit, loading, error, methodUsed }) {
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return   // js-early-exit: skip empty input
    onSubmit(text)
  }

  // Submit button — accent-flag is the one place the accent appears in UI chrome
  const btnStyle = {
    padding: '10px 16px',
    background: loading ? 'var(--accent-flag-muted)' : 'var(--accent-flag)',
    color: 'var(--text-primary)',
    border: 'none',
    borderRadius: 'var(--radius-panel)',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'var(--sans)',
    cursor: loading ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
  }

  const badgeLabel = METHOD_LABELS[methodUsed] ?? methodUsed

  return (
    <div style={WRAPPER_STYLE}>
      <form style={FORM_STYLE} onSubmit={handleSubmit}>
        <input
          style={INPUT_STYLE}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder='Try "show buildings over 100 feet" or "show me the tallest"'
          disabled={loading}
          aria-label="Building query"
        />
        <button type="submit" style={btnStyle} disabled={loading}>
          {loading ? 'Querying…' : 'Search'}
        </button>
      </form>

      {error !== null ? (
        <span style={{ ...META_STYLE, color: 'var(--accent-flag)' }}>{error}</span>
      ) : methodUsed !== null ? (
        <div style={META_STYLE}>
          <span style={{
            ...BADGE_STYLE_BASE,
            background: 'var(--accent-flag-muted)',
            color: 'var(--text-secondary)',
          }}>
            {badgeLabel}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default memo(QueryInput)
