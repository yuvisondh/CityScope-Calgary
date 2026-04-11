/**
 * zoning.js — single source of truth for Calgary zoning bucket definitions.
 *
 * The Beltline dataset contains six unique zoning codes, all commercial
 * variants plus DC. The bucket scheme is data-driven: each bucket maps
 * to the exact codes present in the dataset, not a generic template.
 *
 * Consumers:
 *   - BuildingMesh.jsx  → zoningToBucket(code).color for material color
 *   - ZoningLegend.jsx  → BUCKETS array for legend rows
 *   - index.css          → mirrored as CSS custom properties for panel use
 */

/**
 * @typedef {Object} ZoningBucket
 * @property {string}   id          - Stable identifier for keying
 * @property {string}   label       - Display name shown in the legend
 * @property {string}   color       - Hex color for Three.js materials and legend chips
 * @property {string}   description - Tooltip text explaining which codes map here
 * @property {string[]} codes       - Exact zoning codes that map to this bucket
 */

/**
 * Ordered bucket definitions. The order here is the render order in
 * ZoningLegend — largest groups first for visual hierarchy.
 *
 * Colors mirror CSS tokens in index.css (--zoning-mixed-use-commercial, etc.)
 * and are duplicated here because Three.js materials need raw hex strings.
 *
 * @type {ZoningBucket[]}
 */
export const BUCKETS = [
  {
    id: 'mixed-use-commercial',
    label: 'Mixed-use commercial',
    color: '#c4a478',   // var(--zoning-mixed-use-commercial) — warm sand
    description: 'CC-X, CC-MHX — mixed-use commercial districts',
    codes: ['CC-X', 'CC-MHX'],
  },
  {
    id: 'commercial-corridor',
    label: 'Commercial corridor',
    color: '#7895a3',   // var(--zoning-commercial-corridor) — dusty blue
    description: 'CC-COR, C-COR1 — commercial corridor zones',
    codes: ['CC-COR', 'C-COR1'],
  },
  {
    id: 'high-density-commercial',
    label: 'High-density commercial',
    color: '#8b9e8b',   // var(--zoning-high-density-commercial) — sage green
    description: 'CC-MH — high-density commercial (Midtown)',
    codes: ['CC-MH'],
  },
  {
    id: 'direct-control',
    label: 'Direct control',
    color: '#a08070',   // var(--zoning-direct-control) — clay rose
    description: 'DC — direct control districts (site-specific bylaws)',
    codes: ['DC'],
  },
  {
    id: 'other',
    label: 'Other',
    color: '#8a8580',   // var(--zoning-other) — warm concrete
    description: 'Fallback for any zoning codes not in the Beltline dataset',
    codes: [],          // empty — catches everything not matched above
  },
]

// Pre-build a code → bucket lookup map for O(1) resolution
const _codeToBucket = new Map()
for (const bucket of BUCKETS) {
  for (const code of bucket.codes) {
    _codeToBucket.set(code.toUpperCase(), bucket)
  }
}

const _fallbackBucket = BUCKETS.find(b => b.id === 'other')

/**
 * Maps a Calgary zoning code to its bucket object.
 *
 * Matches exactly against the codes listed in each bucket definition.
 * Unknown or null codes fall through to the "Other" bucket.
 *
 * @param {string|null} code - Calgary zoning code (e.g. "CC-X", "DC")
 * @returns {ZoningBucket} the matching bucket object (never null)
 */
export function zoningToBucket(code) {
  if (!code) return _fallbackBucket
  return _codeToBucket.get(code.toUpperCase().trim()) ?? _fallbackBucket
}
