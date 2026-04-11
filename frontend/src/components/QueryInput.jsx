import { useState, memo } from 'react'

// ─── Color constants ───────────────────────────────────────────────────────────
const INPUT_BG       = 'rgba(13,17,23,0.90)'
const INPUT_TEXT     = '#e6edf3'
const INPUT_BORDER   = 'rgba(255,255,255,0.12)'
const PLACEHOLDER    = '#8b949e'
const BTN_BG         = '#2d65c8'
const BTN_BG_LOADING = '#1a3d7a'
const BTN_TEXT       = '#ffffff'
const BADGE_LLM      = '#10b981'
const BADGE_FALLBACK = '#f59e0b'
const ERROR_TEXT     = '#f87171'

// ─── Styles ────────────────────────────────────────────────────────────────────
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
  padding: '10px 14px',
  background: INPUT_BG,
  border: `1px solid ${INPUT_BORDER}`,
  borderRadius: 8,
  color: INPUT_TEXT,
  fontSize: 14,
  outline: 'none',
  fontFamily: 'sans-serif',
}

const BADGE_STYLE_BASE = {
  fontSize: 11,
  fontWeight: 600,
  fontFamily: 'sans-serif',
  padding: '2px 8px',
  borderRadius: 99,
  letterSpacing: 0.3,
}

const META_STYLE = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  fontSize: 11,
  fontFamily: 'sans-serif',
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

  const btnStyle = {
    padding: '10px 18px',
    background: loading ? BTN_BG_LOADING : BTN_BG,
    color: BTN_TEXT,
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'sans-serif',
    cursor: loading ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={WRAPPER_STYLE}>
      <form style={FORM_STYLE} onSubmit={handleSubmit}>
        <input
          style={INPUT_STYLE}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. show buildings over 100 feet"
          disabled={loading}
          aria-label="Building query"
        />
        <button type="submit" style={btnStyle} disabled={loading}>
          {loading ? 'Querying…' : 'Search'}
        </button>
      </form>

      {error !== null ? (
        <span style={{ ...META_STYLE, color: ERROR_TEXT }}>{error}</span>
      ) : methodUsed !== null ? (
        <div style={META_STYLE}>
          <span style={{
            ...BADGE_STYLE_BASE,
            background: methodUsed === 'llm' ? BADGE_LLM : BADGE_FALLBACK,
            color: '#fff',
          }}>
            {methodUsed === 'llm' ? 'via LLM' : 'via regex fallback'}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default memo(QueryInput)
