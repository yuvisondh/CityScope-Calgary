# Design Specification — Calgary 3D Dashboard
**Author:** Yuvraj Sondh
**Project:** MASIV take-home submission
**Date:** April 12, 2026

This document defines the visual system for the Calgary 3D dashboard. It is the source of truth for all styling, color, typography, and material decisions. Implementation must follow this spec; any deviation requires updating this document first.

---

## 1. Design Philosophy

The tool is built for an architectural fabrication audience. It should feel like a piece of professional infrastructure — quiet, precise, and grounded in place — not like a generic SaaS dashboard. Every visual decision is made in service of three principles:

1. **Architectural over digital.** Warmth, restraint, and intentional negative space over neon accents and decorative motion.
2. **Local over generic.** This is a tool for looking at Calgary specifically, and the visual language should reflect that.
3. **Honest hierarchy.** Selection, query state, and inspection should be visually distinct and never compete with each other.

---

## 2. Color System

### Background
| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#1a1815` | 3D scene background, page body, primary canvas |
| `--bg-panel` | `rgba(26, 24, 21, 0.94)` | All overlay panels (info, query input, project panel) — semi-transparent so the 3D scene shows through faintly |
| `--bg-panel-hover` | `rgba(255, 255, 255, 0.04)` | Subtle hover state on interactive panel rows |

Warm dark charcoal, not cold black. The slight red-brown tint comes from real architectural drafting materials — kraft paper, redline films, basement studio walls. It reads as warm and lived-in rather than digital.

### Text
| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#f0ebe2` | Headers, building addresses, primary labels |
| `--text-secondary` | `#a8a097` | Field labels, metadata, footnotes |
| `--text-muted` | `#6b665f` | Disabled states, placeholder text, low-priority info |
| `--text-mono` | `#e8e0d3` | All Plex Mono numerical values (heights, prices, coordinates) |

Off-white instead of pure white. Pure white on dark mode is harsh on the eye and reads as careless.

### Accent — Calgary Flames Red
| Token | Hex | Usage |
|---|---|---|
| `--accent-flag` | `#c8102e` | The single accent color of the entire UI |
| `--accent-flag-glow` | `rgba(200, 16, 46, 0.35)` | Soft halo around selected/highlighted buildings for visibility |
| `--accent-flag-muted` | `rgba(200, 16, 46, 0.12)` | Background tint for active button states |

The exact red used by the Calgary Flames hockey team. Used sparingly and only for things the user has actively selected or queried — never decoratively. When this color appears in the scene, it means "you flagged this." That metaphor — flagging like a site supervisor — is the entire interaction language.

### Building Materials by Zoning
Real-world Calgary land use codes are grouped into 5 buckets. Each bucket gets a single muted base color, picked from a coherent palette of warm desaturated tones that read clearly against the dark background.

| Bucket | Base color | Calgary zoning codes that map here |
|---|---|---|
| **Commercial Core** | `#c4a478` (warm sand) | C-COR, CC-X, CC-MH, CC-ET, CC-EMU, all CC-* variants, C-C2 |
| **Mixed Use** | `#9c8b6e` (taupe) | CR20, CR-20, M-CG, all M-X variants, MU-* |
| **Residential** | `#7a8a78` (sage grey) | RC-G, R-1, R-2, R-CG, all R-* variants |
| **Industrial / Special** | `#8a7560` (warm brown) | I-G, I-B, S-CRI, S-CI, DC, S-* variants |
| **Other / Unclassified** | `#6e6a62` (neutral grey-brown) | UNKNOWN, anything not matching above |

**Rule:** All five colors are deliberately desaturated (~25-35% saturation) so they read as a coherent palette rather than competing primary colors. The visual hierarchy stays: scene reads as "muted Calgary city," and the Flames red selection state pops sharply against any of these.

### Selection / Highlight States
Color is applied via a strict priority order on each building:

1. If selected by click → **Flames red** (`--accent-flag`)
2. Else if matched by query → **Flames red, slightly desaturated** (`#a00d24`) — visually similar but distinguishable on close inspection. Subtle border or edge brightness if technically possible.
3. Else → its zoning bucket color from the table above

Only one color per state. No gradients. No animations. Color changes are instant.

---

## 3. Typography

### Font Families
- **UI text:** IBM Plex Sans — weights 400, 500, 600
- **Numerical / technical text:** IBM Plex Mono — weights 400, 500
- **Loaded via:** Google Fonts CDN in `index.html`

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type Scale
| Token | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| `--text-display` | 14px | 600 | 1.3 | Panel headers, building addresses |
| `--text-body` | 13px | 400 | 1.5 | Body copy, descriptive text |
| `--text-label` | 11px | 500 | 1.4 | Field labels (uppercase, letter-spacing 0.04em) |
| `--text-data` | 13px | 500 | 1.4 | Plex Mono numerical values |
| `--text-caption` | 10px | 400 | 1.4 | Footnotes, attributions, status badges |

Field labels use uppercase + letter-spacing because that's the convention in technical drawings (ARCH SPEC SHEETS, CIVIL DRAWINGS) — labels are short, declarative, and visually distinct from values.

### Spacing
All spacing is in 4px increments. Reference: `4 / 8 / 12 / 16 / 24 / 32 / 48`. No magic values like 13px or 17px. **Reason:** consistent rhythm, easier eye tracking, professional polish.

---

## 4. Layout Rules

### Panel Positioning
| Panel | Position | Reason |
|---|---|---|
| Building info (click) | Top-right, 16px from edges | Right side stays clear of the search bar; click flow is "see the building, look right for details" |
| Query input | Bottom-center, 24px from bottom | Bottom-center is the natural gaze rest position after orbiting; doesn't compete with the info panel on the right |
| Project panel | Bottom-left, 16px from edges, collapsed by default | Bottom-left is the lowest-priority corner; users only need it occasionally |
| Status badge ("125 buildings loaded") | Top-left, 16px from edges | Reference info, never competes for attention |
| Zoning legend | Top-right, *only when* no building is selected; hides when info panel appears | Avoids stacking two panels on the right side |

### Panel Visual Treatment
- Background: `--bg-panel` (semi-transparent warm dark)
- Border: `1px solid rgba(255, 255, 255, 0.06)` — barely visible, just enough to define edges
- Border radius: `6px` — slightly less than typical SaaS (8-12px). Tighter corners read as more architectural.
- Padding: `16px` for panel contents, `12px 16px` for header sections
- Shadow: `0 4px 24px rgba(0, 0, 0, 0.4)` — soft and deep, lifts panels off the dark background

### Panel Widths
- Building info: 320px fixed
- Query input: 480px fixed
- Project panel: 280px when expanded
- Zoning legend: auto, ~180px

---

## 5. 3D Scene Specification

### Camera
- Initial position: `[0, 500, 750]`
- FOV: 55
- OrbitControls: same constraints as currently (`maxPolarAngle: PI/2.1`, `minDistance: 20`, `maxDistance: 2000`)
- No animation on load — static framing

### Lighting
- **Ambient light:** intensity `0.45`, color `#fff5e6` (warm white) — bumped up slightly from current 0.35 to better illuminate the muted building palette
- **Primary directional light:** position `[200, 400, 200]`, intensity `0.85`, color `#ffe9c9` (warm sunlight)
- **Fill directional light:** position `[-200, 200, -200]`, intensity `0.25`, color `#aab8c4` (cool fill, balances the warm primary)
- **Shadows:** enabled, soft shadow map size 2048
- **No fog.** Tried it conceptually; would obscure the back row of buildings and lose data. Skip.

### Ground Plane
- Color: `#0e0c09` (slightly darker than `--bg-base` so the ground is visually below the buildings, not the same plane)
- Size: 2000 × 2000
- Subtle grid texture: thin warm grey lines at 50m intervals, opacity ~15%, creating a survey-grid feel without dominating

### Building Materials
- Use `meshStandardMaterial` with the bucket color as `color`
- `roughness: 0.85` (matte, no plasticky shine)
- `metalness: 0.0`
- `flatShading: false` (smooth shading reads better at this scale than flat)
- Selected/highlighted buildings get the same material with the accent color swapped in — no glow shaders or emissive effects (those would be tech-bro, not architectural)

---

## 6. Interaction Behavior

- Click on building → top-right info panel slides in (300ms ease-out), building turns Flames red
- Click on empty space → info panel closes, selection clears
- Submit query → buildings instantly turn highlight red (no animation; instant change reads as more responsive)
- Hover on building → 0.95→1.0 opacity bump on the building, **and** cursor changes to pointer. No tooltip on hover (would clutter the scene). 
- Save project → optimistic UI: appears in list immediately, rolls back if backend rejects
- Load project → instant re-highlight, no spinner

---

## 7. Voice and Microcopy

All UI text follows these rules:
- Sentence case, never Title Case ("Save current query" not "Save Current Query")
- Short, declarative, no exclamation marks
- Numerical values always in Plex Mono
- "matches" not "results" when describing query output
- Empty states are short and neutral: "No saved projects yet." not "You haven't saved any projects! Create your first one above."

Specific strings:
- Query input placeholder: `Try "show buildings over 100 feet" or "show me the tallest"`
- Save button: `Save current query`
- Empty project list: `No saved projects yet`
- Method badge: `via AI`, `via pattern match`, `via superlative`, `no match`
- Address fallback: `Parcel on {street}` (already implemented)
- Footnote on info panel: `Calgary Open Data, 2026 assessment roll` (already implemented)

---

## 8. Out of Scope (Deliberate Decisions)

These were considered and rejected:
- **Animations:** No transition effects on building color changes, no panel slide-ins beyond simple opacity fades. Architectural tools don't animate; they snap.
- **Glow / emissive shaders:** Would push the visual into video-game territory.
- **Road network:** Three hours of risk for a small visual gain. The grid texture on the ground gives sufficient spatial reference.
- **Multi-color selection states:** Decided that one accent color (Flames red) for both click and query keeps the visual language clean. Differentiation by saturation only.
- **Particle effects, post-processing, bloom, depth-of-field:** All rejected as decorative.