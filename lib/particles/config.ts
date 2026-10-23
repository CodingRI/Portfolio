/**
 * Central configuration for the hero particle portrait.
 * Everything tunable lives here so the rest of the engine stays free of magic numbers.
 */

export type RGB = readonly [number, number, number]

/** Parse "#rrggbb" into 0..1 sRGB floats (used raw in shaders; no colour-space conversion). */
export function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", ""), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export const PARTICLE_CONFIG = {
  /** Portrait photograph. Change this path to swap the source image (file lives in /public). */
  imageSrc: "/imRae.jpeg",
  wordmark: "I'm CodingRI",

  /**
   * Crop applied to the photo before sampling (fractions of the image).
   * Keeps head + shoulders and drops the legs / snow, then fades the cut edges.
   */
  crop: { x: 0.15, y: 0.055, w: 0.66, h: 0.7 },
  /** Fractions of the crop (from each edge) over which the particle density fades out. */
  cropFade: { left: 0.06, right: 0.16, bottom: 0.2 },

  /** Particle budgets by device class. */
  counts: { desktop: 9500, tablet: 6500, mobile: 4200 },
  /** Pointer influence radius, as a fraction of the rendered portrait height. */
  radius: { desktop: 0.17, mobile: 0.22 },

  /** Palette: muted purple -> magenta -> lavender (matches the site's existing accents). */
  palette: {
    purple: "#7d5fc6",
    magenta: "#dc5aae",
    lavender: "#d4cbff",
    star: "#b9b4e8",
    starAccent: "#e58ac6",
  },

  /** Morph timing, seconds. */
  morph: {
    toText: 2.8,
    toPortrait: 2.5,
    startDelay: 2.6,
    hold: 3.4,
    /** Rest time in portrait state between automatic cycles. */
    interval: 15,
    autoRepeat: true,
  },

  /** Spring-damper used for pointer displacement. */
  physics: {
    stiffness: 34,
    damping: 7.2,
    /** Peak displacement as a fraction of portrait height. */
    maxDisplacement: 0.05,
    /** Wake impulse from pointer velocity. */
    wake: 0.028,
  },

  stars: { desktop: 260, mobile: 120 },
} as const

export type DeviceClass = "desktop" | "tablet" | "mobile"

export function getDeviceClass(width: number): DeviceClass {
  if (width < 768) return "mobile"
  if (width < 1100) return "tablet"
  return "desktop"
}

/** Slightly reduce the budget on low-powered hardware. */
export function getParticleBudget(width: number): number {
  const base = PARTICLE_CONFIG.counts[getDeviceClass(width)]
  if (typeof navigator === "undefined") return base
  const nav = navigator as Navigator & { deviceMemory?: number }
  const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4
  return weak ? Math.round(base * 0.7) : base
}

/** Deterministic PRNG so the portrait is stable between loads. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
