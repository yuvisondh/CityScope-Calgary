// Keyframes describing the sun's color, light intensity, and the
// ambient/fill character at canonical hours. getSunState() lerps between
// adjacent keyframes; hours outside the 6–20 envelope share the night state.
//
// Ambient is intentionally cool sky-blue during the day and warm-purple at
// dusk — the chromatic contrast against the warm directional sun is what
// makes outdoor scenes read as natural sunlight. Crank-high cream ambient
// flattens shadows and looks like an overcast soundstage.
const KEYFRAMES = [
  { hour: 0,  color: '#5070a0', intensity: 0.04, ambientColor: '#1a2238', ambientIntensity: 0.08 },
  { hour: 5,  color: '#5070a0', intensity: 0.04, ambientColor: '#252a45', ambientIntensity: 0.10 },
  { hour: 6,  color: '#ff9050', intensity: 0.50, ambientColor: '#7080a8', ambientIntensity: 0.25 },
  { hour: 8,  color: '#ffd494', intensity: 1.20, ambientColor: '#9bb5d4', ambientIntensity: 0.32 },
  { hour: 12, color: '#fff2d8', intensity: 1.80, ambientColor: '#a3c2e0', ambientIntensity: 0.28 },
  { hour: 16, color: '#ffd494', intensity: 1.40, ambientColor: '#9bb5d4', ambientIntensity: 0.30 },
  { hour: 18, color: '#ff7b34', intensity: 0.60, ambientColor: '#705580', ambientIntensity: 0.22 },
  { hour: 20, color: '#5070a0', intensity: 0.08, ambientColor: '#3a3855', ambientIntensity: 0.13 },
  { hour: 24, color: '#5070a0', intensity: 0.04, ambientColor: '#1a2238', ambientIntensity: 0.08 },
]

const SUN_RADIUS = 400

// Calgary sits at ~51° N, so the sun never reaches true zenith — peak solar
// altitude is roughly 60°. Modelling the noon position at 60° altitude in
// the southern sky gives natural raking shadows instead of flat top-down ones.
const PEAK_ALTITUDE_RAD = Math.PI / 3        // 60°
const ALT_FACTOR        = Math.sin(PEAK_ALTITUDE_RAD)  // ~0.866 — vertical
const SOUTH_FACTOR      = Math.cos(PEAK_ALTITUDE_RAD)  // ~0.5   — southern bias

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

function rgbToHex([r, g, b]) {
  const c = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function lerpColor(a, b, t) {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex([lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)])
}

function interpolateKeyframes(hour) {
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i]
    const b = KEYFRAMES[i + 1]
    if (hour >= a.hour && hour <= b.hour) {
      const t = (hour - a.hour) / (b.hour - a.hour)
      return {
        color: lerpColor(a.color, b.color, t),
        intensity: lerp(a.intensity, b.intensity, t),
        ambientColor: lerpColor(a.ambientColor, b.ambientColor, t),
        ambientIntensity: lerp(a.ambientIntensity, b.ambientIntensity, t),
      }
    }
  }
  const last = KEYFRAMES[KEYFRAMES.length - 1]
  return {
    color: last.color,
    intensity: last.intensity,
    ambientColor: last.ambientColor,
    ambientIntensity: last.ambientIntensity,
  }
}

/**
 * Compute directional sun position, sun color, and ambient/fill values for a
 * given clock hour (float, 0–24). The sun travels a 400-radius arc that
 * approximates Calgary's actual solar path: rises near +X (east) at hour 6,
 * peaks at ~60° altitude in the southern sky (+Z) at noon, sets near -X
 * (west) at hour 18. Outside the 6–18 envelope the sun sits below the
 * horizon (y < 0) and intensity drops to a cold moonlit floor.
 *
 * Color and intensity are linearly interpolated between canonical keyframes
 * (dawn / morning / noon / afternoon / sunset / dusk / night). Fill light
 * intensity is ambientIntensity * 0.6.
 *
 * @param {number} hour Clock hour in [0, 24].
 * @returns {{ position: [number, number, number], color: string, intensity: number, ambientColor: string, ambientIntensity: number, fillIntensity: number }}
 */
export function getSunState(hour) {
  const h = Math.max(0, Math.min(24, hour))

  // angle 0 → east horizon (sunrise), π/2 → noon, π → west horizon (sunset).
  const angle = ((h - 6) / 12) * Math.PI
  const x = Math.cos(angle) * SUN_RADIUS
  const y = Math.sin(angle) * SUN_RADIUS * ALT_FACTOR
  const z = Math.sin(angle) * SUN_RADIUS * SOUTH_FACTOR

  const k = interpolateKeyframes(h)
  return {
    position: [x, y, z],
    color: k.color,
    intensity: k.intensity,
    ambientColor: k.ambientColor,
    ambientIntensity: k.ambientIntensity,
    fillIntensity: k.ambientIntensity * 0.6,
  }
}
