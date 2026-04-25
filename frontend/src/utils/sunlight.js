// Keyframes describing the sun's color temperature, light intensity, and the
// ambient/fill character at canonical hours. getSunState() lerps between
// adjacent keyframes; hours outside the 6–20 envelope share the night state.
const KEYFRAMES = [
  { hour: 0,  color: '#4a6080', intensity: 0.02, ambientColor: '#1a2030', ambientIntensity: 0.10 },
  { hour: 5,  color: '#4a6080', intensity: 0.02, ambientColor: '#1a2030', ambientIntensity: 0.10 },
  { hour: 6,  color: '#ffb07a', intensity: 0.30, ambientColor: '#8090b0', ambientIntensity: 0.30 },
  { hour: 8,  color: '#ffe0b0', intensity: 0.70, ambientColor: '#fff0e0', ambientIntensity: 0.40 },
  { hour: 12, color: '#ffe9c9', intensity: 1.00, ambientColor: '#fff5e6', ambientIntensity: 0.45 },
  { hour: 16, color: '#ffe0b0', intensity: 0.80, ambientColor: '#fff0e0', ambientIntensity: 0.40 },
  { hour: 18, color: '#ff8c42', intensity: 0.40, ambientColor: '#806050', ambientIntensity: 0.30 },
  { hour: 20, color: '#4a6080', intensity: 0.05, ambientColor: '#2a3040', ambientIntensity: 0.15 },
  { hour: 24, color: '#4a6080', intensity: 0.02, ambientColor: '#1a2030', ambientIntensity: 0.10 },
]

const SUN_RADIUS = 400

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
 * given clock hour (float, 0–24). The sun travels a 400-radius circular arc
 * centered on the scene origin: rises at hour 6 (+X), peaks overhead at
 * hour 12, sets at hour 18 (-X). Outside the 6–18 envelope the sun sits
 * below the horizon (y < 0) and the ambient/fill values pin to night.
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

  // Sun arc: rise at 6, peak at 12 (directly overhead), set at 18.
  // Angle 0 → +X (sunrise), PI/2 → +Y (noon), PI → -X (sunset).
  const angle = ((h - 6) / 12) * Math.PI
  const x = Math.cos(angle) * SUN_RADIUS
  // Sin returns negative outside the 6–18 window, putting the sun below the
  // horizon for night hours — directional light falls behind the scene and
  // contributes effectively nothing, which matches the night intensity drop.
  const y = Math.sin(angle) * SUN_RADIUS
  const z = Math.sin(angle) * SUN_RADIUS * 0.5  // slight forward bias for shadow direction

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
