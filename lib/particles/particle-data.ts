import { PARTICLE_CONFIG, hexToRgb, mulberry32 } from "./config"
import type { PortraitShape } from "./portrait-sampler"
import type { TextShape } from "./text-sampler"

/** Immutable GPU-ready attribute data for one particle system. Built once, outside the render loop. */
export interface ParticleData {
  count: number
  /** Width / height of the portrait. */
  aspect: number
  /** vec3: x, y (portrait-height units), z depth. */
  portrait: Float32Array
  /** vec2: x, y (wordmark-width units). */
  text: Float32Array
  /** vec4: morph delay, size jitter, phase, glyph seed. */
  rand: Float32Array
  /** vec3 sRGB colour in portrait state. */
  color: Float32Array
  alpha: Float32Array
}

/**
 * Stable particle identity / matching.
 * Sorts into vertical strips to prevent criss-crossing chaos during morph transitions.
 */
function stripOrder(xy: Float32Array, count: number): Uint32Array {
  const idx = Uint32Array.from({ length: count }, (_, i) => i)
  const byX = Array.from(idx).sort((a, b) => xy[a * 2] - xy[b * 2])
  const strip = Math.max(16, Math.round(Math.sqrt(count) * 0.7))
  const out = new Uint32Array(count)
  for (let s = 0; s < count; s += strip) {
    const slice = byX.slice(s, s + strip).sort((a, b) => xy[b * 2 + 1] - xy[a * 2 + 1])
    for (let k = 0; k < slice.length; k++) out[s + k] = slice[k]
  }
  return out
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export function buildParticleData(portrait: PortraitShape, text: TextShape): ParticleData {
  const count = portrait.count
  const pOrder = stripOrder(portrait.xy, count)
  const tOrder = stripOrder(text.xy, count)
  const rand = mulberry32(90210)

  const purple = hexToRgb(PARTICLE_CONFIG.palette.purple)
  const magenta = hexToRgb(PARTICLE_CONFIG.palette.magenta)
  const lav = hexToRgb(PARTICLE_CONFIG.palette.lavender)

  const out: ParticleData = {
    count,
    aspect: portrait.aspect,
    portrait: new Float32Array(count * 3),
    text: new Float32Array(count * 2),
    rand: new Float32Array(count * 4),
    color: new Float32Array(count * 3),
    alpha: new Float32Array(count),
  }

  for (let i = 0; i < count; i++) {
    const p = pOrder[i]
    const t = tOrder[i]
    const px = portrait.xy[p * 2]
    const py = portrait.xy[p * 2 + 1]
    const r = portrait.rgb[p * 3]
    const g = portrait.rgb[p * 3 + 1]
    const b = portrait.rgb[p * 3 + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const edge = portrait.edge[p]

    // Depth relief: dark regions (hair, shadows) recede, face highlights advance smoothly
    out.portrait[i * 3] = px
    out.portrait[i * 3 + 1] = py
    out.portrait[i * 3 + 2] = (lum - 0.4) * 0.85

    out.text[i * 2] = text.xy[t * 2]
    out.text[i * 2 + 1] = text.xy[t * 2 + 1]

    // Morph delay sweeps left -> right
    const sweep = clamp01(0.5 + px * 0.9)
    out.rand[i * 4] = clamp01(sweep * 0.65 + rand() * 0.35)
    out.rand[i * 4 + 1] = rand()
    out.rand[i * 4 + 2] = rand()
    out.rand[i * 4 + 3] = rand()

    // Warm skin detector: r > b by at least 0.08
    const warmSkin = clamp01((r - b - 0.05) / 0.2)
    const isDark = lum < 0.26
    const isHighlight = lum > 0.65

    // High fidelity color selection
    let cR = 0
    let cG = 0
    let cB = 0

    if (isDark) {
      // Dark curls & eye contours: deep velvet purple with edge shimmer
      cR = purple[0] * (0.35 + 0.5 * edge)
      cG = purple[1] * (0.3 + 0.4 * edge)
      cB = purple[2] * (0.55 + 0.4 * edge)
    } else if (warmSkin > 0.4) {
      // Face: soft luminous magenta and rose-lavender
      const tSkin = smooth(0.3, 0.8, lum)
      cR = magenta[0] * (1 - tSkin) + lav[0] * tSkin * 1.05
      cG = magenta[1] * (1 - tSkin) + lav[1] * tSkin
      cB = magenta[2] * (1 - tSkin) + lav[2] * tSkin * 0.95
    } else {
      // Lavender ski jacket: cool lavender / soft violet
      const tJacket = smooth(0.2, 0.7, lum)
      cR = purple[0] * (1 - tJacket) + lav[0] * tJacket
      cG = purple[1] * (1 - tJacket) + lav[1] * tJacket
      cB = purple[2] * (1 - tJacket) + lav[2] * tJacket * 1.1
    }

    const jitter = 0.94 + rand() * 0.12
    out.color[i * 3] = clamp01(cR * jitter)
    out.color[i * 3 + 1] = clamp01(cG * jitter)
    out.color[i * 3 + 2] = clamp01(cB * jitter)

    // Alpha modulation: preserves eye definition and subtle rim falloff
    let baseAlpha = 0.65 + 0.35 * lum + 0.25 * edge
    if (isDark && !isHighlight) {
      baseAlpha = 0.35 + 0.4 * edge // keeps eyes from forming heavy clouds
    }

    out.alpha[i] = clamp01(baseAlpha) * (0.2 + 0.8 * portrait.fade[p])
  }
  return out
}
