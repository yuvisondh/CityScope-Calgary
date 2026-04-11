import { memo, useState, useCallback } from 'react'

// ─── Dimensions ───────────────────────────────────────────────────────────────
const PANEL_WIDTH = 280

// ─── Style objects — all colors via CSS custom properties (DESIGN_SPEC.md) ────

const WRAPPER_STYLE = {
  position: 'absolute',
  bottom: 16,
  left: 16,
  width: PANEL_WIDTH,
  zIndex: 10,
  fontFamily: 'var(--sans)',
}

const BODY_STYLE = {
  background: 'var(--bg-panel)',
  color: 'var(--text-primary)',
  border: 'var(--border-panel)',
  borderRadius: 'calc(var(--radius-panel)) calc(var(--radius-panel)) 0 0',
  boxShadow: 'var(--shadow-panel)',
  padding: '12px 16px 8px',
}

const TOGGLE_BTN_STYLE = {
  width: '100%',
  background: 'var(--bg-panel)',
  color: 'var(--text-primary)',
  border: 'var(--border-panel)',
  borderRadius: 'var(--radius-panel)',
  boxShadow: 'var(--shadow-panel)',
  padding: '8px 12px',
  cursor: 'pointer',
  // --text-body: 13px / 400 / 1.5, but weight bumped for toggle affordance
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'var(--sans)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxSizing: 'border-box',
}

const TOGGLE_BTN_OPEN_STYLE = {
  ...TOGGLE_BTN_STYLE,
  borderRadius: '0 0 calc(var(--radius-panel)) calc(var(--radius-panel))',
  borderTop: 'none',
}

// --text-label: 11px / 500 / 1.4, uppercase, letter-spacing 0.04em
const LABEL_STYLE = {
  display: 'block',
  fontSize: 11,
  color: 'var(--text-secondary)',
  marginBottom: 4,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  fontFamily: 'var(--sans)',
}

const INPUT_STYLE = {
  width: '100%',
  background: 'var(--bg-panel-hover)',
  border: 'var(--border-panel)',
  borderRadius: 'var(--radius-panel)',
  color: 'var(--text-primary)',
  padding: '6px 8px',
  // --text-body: 13px / 400 / 1.5
  fontSize: 13,
  fontWeight: 400,
  fontFamily: 'var(--sans)',
  boxSizing: 'border-box',
  outline: 'none',
}

const DIVIDER_STYLE = {
  border: 'none',
  borderTop: 'var(--border-panel)',
  margin: '10px 0',
}

const SECTION_TITLE_STYLE = {
  fontSize: 11,
  color: 'var(--text-secondary)',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  margin: '0 0 8px',
  fontFamily: 'var(--sans)',
}

// --text-body: 13px / 400 / 1.5
const PROJECT_NAME_STYLE = {
  fontSize: 13,
  fontWeight: 400,
  lineHeight: 1.5,
  color: 'var(--text-primary)',
  fontFamily: 'var(--sans)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  minWidth: 0,
}

const DELETE_BTN_STYLE = {
  background: 'var(--accent-flag-muted)',
  border: 'none',
  color: 'var(--accent-flag)',
  width: 22,
  height: 22,
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 15,
  lineHeight: '22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginLeft: 8,
  padding: 0,
}

// --text-caption: 10px / 400 / 1.4
const EMPTY_STYLE = {
  color: 'var(--text-muted)',
  fontSize: 10,
  fontWeight: 400,
  lineHeight: 1.4,
  textAlign: 'center',
  padding: '8px 0 4px',
  margin: 0,
  fontFamily: 'var(--sans)',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns inline style for a project row, highlighting the active project.
 * @param {boolean} isActive
 * @returns {Object}
 */
function projectRowStyle(isActive) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    background: isActive ? 'var(--accent-flag-muted)' : 'transparent',
    marginBottom: 2,
  }
}

/**
 * Returns inline style for the "Save current query" button.
 * @param {boolean} disabled
 * @returns {Object}
 */
function saveBtnStyle(disabled) {
  return {
    width: '100%',
    marginTop: 10,
    background: disabled ? 'var(--bg-panel-hover)' : 'var(--accent-flag)',
    color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
    border: 'var(--border-panel)',
    borderRadius: 'var(--radius-panel)',
    padding: '7px 10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'var(--sans)',
    boxSizing: 'border-box',
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Single row in the saved-projects list.
 * @param {{ project: Object, isActive: boolean, onLoad: Function, onDelete: Function }} props
 */
function ProjectRow({ project, isActive, onLoad, onDelete }) {
  const handleDelete = useCallback((e) => {
    e.stopPropagation()
    onDelete(project.id)
  }, [project.id, onDelete])

  return (
    <div
      style={projectRowStyle(isActive)}
      onClick={() => onLoad(project)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onLoad(project)}
    >
      <span style={PROJECT_NAME_STYLE} title={project.name}>{project.name}</span>
      <button
        style={DELETE_BTN_STYLE}
        onClick={handleDelete}
        aria-label={`Delete project ${project.name}`}
      >
        ×
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * ProjectPanel — collapsible bottom-left panel for saving and loading LLM query
 * snapshots per user.
 *
 * Username is controlled externally (persisted to localStorage by useProjects)
 * and mirrored in local state so the input remains responsive before blur.
 * The panel only saves when there is an active query (hasActiveQuery) and a
 * non-blank username.
 *
 * @param {{
 *   projects: Array,
 *   loading: boolean,
 *   currentUsername: string,
 *   setCurrentUsername: (name: string) => void,
 *   activeProjectId: number|null,
 *   hasActiveQuery: boolean,
 *   onSave: (name: string) => void,
 *   onLoad: (project: Object) => void,
 *   onDelete: (id: number) => void,
 * }} props
 */
function ProjectPanel({
  projects,
  loading,
  currentUsername,
  setCurrentUsername,
  activeProjectId,
  hasActiveQuery,
  onSave,
  onLoad,
  onDelete,
}) {
  const [isOpen, setIsOpen]             = useState(false)
  const [usernameInput, setUsernameInput] = useState(currentUsername)

  const handleToggle = useCallback(() => setIsOpen(prev => !prev), [])

  const handleUsernameBlur = useCallback(() => {
    setCurrentUsername(usernameInput.trim())
  }, [usernameInput, setCurrentUsername])

  const handleSave = useCallback(() => {
    const name = window.prompt('Project name:')?.trim()
    if (!name) return
    onSave(name)
  }, [onSave])

  const saveDisabled = !hasActiveQuery || !currentUsername.trim()

  return (
    <div style={WRAPPER_STYLE}>
      {isOpen && (
        <div style={BODY_STYLE}>
          {/* Username */}
          <label style={LABEL_STYLE} htmlFor="pp-username">Username</label>
          <input
            id="pp-username"
            style={INPUT_STYLE}
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            onBlur={handleUsernameBlur}
            placeholder="your name"
          />

          <button
            style={saveBtnStyle(saveDisabled)}
            disabled={saveDisabled}
            onClick={handleSave}
          >
            Save current query
          </button>

          <hr style={DIVIDER_STYLE} />

          <p style={SECTION_TITLE_STYLE}>Saved projects</p>

          {loading && <p style={EMPTY_STYLE}>Loading…</p>}

          {!loading && projects.length === 0 && (
            <p style={EMPTY_STYLE}>No saved projects yet</p>
          )}

          {!loading && projects.map(project => (
            <ProjectRow
              key={project.id}
              project={project}
              isActive={project.id === activeProjectId}
              onLoad={onLoad}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <button
        style={isOpen ? TOGGLE_BTN_OPEN_STYLE : TOGGLE_BTN_STYLE}
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        <span>Projects</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>
    </div>
  )
}

// Memo: only re-renders when projects list, username, or activeProjectId change
export default memo(ProjectPanel)
