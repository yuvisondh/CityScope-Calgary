import { memo, useState, useCallback } from 'react'

// ─── Color constants (matching BuildingInfoPanel) ──────────────────────────────
const PANEL_BG       = 'rgba(13,17,23,0.92)'
const PANEL_TEXT     = '#e6edf3'
const PANEL_MUTED    = '#8b949e'
const DIVIDER_COLOR  = 'rgba(255,255,255,0.08)'
const BTN_BG         = 'rgba(255,255,255,0.08)'
const BTN_DISABLED_BG = 'rgba(255,255,255,0.03)'
const INPUT_BG       = 'rgba(255,255,255,0.06)'
const ACTIVE_ROW_BG  = 'rgba(255,155,50,0.12)'
const DELETE_COLOR   = '#ff6b6b'
const DELETE_BG      = 'rgba(255,80,80,0.10)'

// ─── Dimensions (no magic numbers) ────────────────────────────────────────────
const PANEL_WIDTH = 260

// ─── Style objects ─────────────────────────────────────────────────────────────

const WRAPPER_STYLE = {
  position: 'absolute',
  bottom: 16,
  left: 16,
  width: PANEL_WIDTH,
  zIndex: 10,
  fontFamily: 'sans-serif',
}

const BODY_STYLE = {
  background: PANEL_BG,
  color: PANEL_TEXT,
  border: `1px solid ${DIVIDER_COLOR}`,
  borderRadius: '8px 8px 0 0',
  padding: '14px 14px 10px',
}

const TOGGLE_BTN_STYLE = {
  width: '100%',
  background: PANEL_BG,
  color: PANEL_TEXT,
  border: `1px solid ${DIVIDER_COLOR}`,
  borderRadius: 8,
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxSizing: 'border-box',
}

const TOGGLE_BTN_OPEN_STYLE = {
  ...TOGGLE_BTN_STYLE,
  borderRadius: '0 0 8px 8px',
  borderTop: 'none',
}

const LABEL_STYLE = {
  display: 'block',
  fontSize: 11,
  color: PANEL_MUTED,
  marginBottom: 4,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const INPUT_STYLE = {
  width: '100%',
  background: INPUT_BG,
  border: `1px solid ${DIVIDER_COLOR}`,
  borderRadius: 6,
  color: PANEL_TEXT,
  padding: '6px 8px',
  fontSize: 13,
  boxSizing: 'border-box',
  outline: 'none',
}

const DIVIDER_STYLE = {
  border: 'none',
  borderTop: `1px solid ${DIVIDER_COLOR}`,
  margin: '10px 0',
}

const SECTION_TITLE_STYLE = {
  fontSize: 11,
  color: PANEL_MUTED,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  margin: '0 0 6px',
}

const PROJECT_NAME_STYLE = {
  fontSize: 13,
  color: PANEL_TEXT,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  minWidth: 0,
}

const DELETE_BTN_STYLE = {
  background: DELETE_BG,
  border: 'none',
  color: DELETE_COLOR,
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
  marginLeft: 6,
  padding: 0,
}

const EMPTY_STYLE = {
  color: PANEL_MUTED,
  fontSize: 12,
  textAlign: 'center',
  padding: '8px 0 2px',
  margin: 0,
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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
    padding: '7px 8px',
    borderRadius: 6,
    cursor: 'pointer',
    background: isActive ? ACTIVE_ROW_BG : 'transparent',
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
    background: disabled ? BTN_DISABLED_BG : BTN_BG,
    color: disabled ? PANEL_MUTED : PANEL_TEXT,
    border: `1px solid ${DIVIDER_COLOR}`,
    borderRadius: 6,
    padding: '7px 10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13,
    fontWeight: 500,
    boxSizing: 'border-box',
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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

// ─── Main component ────────────────────────────────────────────────────────────

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

          <p style={SECTION_TITLE_STYLE}>Saved Projects</p>

          {loading && <p style={EMPTY_STYLE}>Loading…</p>}

          {!loading && projects.length === 0 && (
            <p style={EMPTY_STYLE}>No saved projects yet.</p>
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
