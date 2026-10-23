import { PARTICLE_CONFIG, mulberry32 } from "./config"

export interface TextShape {
  count: number
  /** x,y with the wordmark's width normalised to 1, origin at its bounding-box centre (y up). */
  xy: Float32Array
}

function resolveFontFamily(): string {
  if (typeof document === "undefined") return "sans-serif"
  const v = getComputedStyle(document.body).getPropertyValue("--font-sora").trim()
  return v ? `${v}, system-ui, sans-serif` : "system-ui, sans-serif"
}

/**
 * Renders the wordmark into an offscreen canvas and samples its mask on a jittered grid, giving an
 * even distribution of exactly `count` points (no stretching: width is normalised, aspect preserved).
 */
export async function sampleWordmark(count: number): Promise<TextShape> {
  const family = resolveFontFamily()
  try {
    // Force the web font to be available before measuring.
    await document.fonts.load(`800 200px ${family}`)
  } catch {
    /* fall back to whatever is available */
  }

  const W = 1600
  const H = 420
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("2D canvas unavailable")

  const text = PARTICLE_CONFIG.wordmark
  let size = 300
  ctx.font = `800 ${size}px ${family}`
  const measured = ctx.measureText(text).width
  size = Math.floor((size * W * 0.94) / measured)
  ctx.font = `800 ${size}px ${family}`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillStyle = "#fff"
  ctx.fillText(text, W / 2, H / 2)

  const px = ctx.getImageData(0, 0, W, H).data
  const mask = new Uint8Array(W * H)
  let area = 0
  let minX = W
  let maxX = 0
  let minY = H
  let maxY = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (px[(y * W + x) * 4 + 3] > 128) {
        mask[y * W + x] = 1
        area++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (area === 0) throw new Error("Wordmark mask is empty")

  const rand = mulberry32(4242)
  let step = Math.sqrt(area / count) * 0.95
  let cx: number[] = []
  let cy: number[] = []
  for (let attempt = 0; attempt < 12; attempt++) {
    cx = []
    cy = []
    for (let gy = minY; gy <= maxY; gy += step) {
      for (let gx = minX; gx <= maxX; gx += step) {
        const x = Math.min(W - 1, Math.floor(gx + rand() * step))
        const y = Math.min(H - 1, Math.floor(gy + rand() * step))
        if (mask[y * W + x]) {
          cx.push(x + rand())
          cy.push(y + rand())
        }
      }
    }
    if (cx.length >= count) break
    step *= 0.9
  }

  // Random subset of exactly `count` (partial Fisher–Yates).
  const idx = Array.from({ length: cx.length }, (_, i) => i)
  const n = Math.min(count, idx.length)
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rand() * (idx.length - i))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }

  const scale = 1 / (maxX - minX)
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2
  const xy = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) {
    // If the mask could not supply enough candidates, reuse points with a tiny offset (never leaves holes).
    const c = idx[i % n]
    const jitter = i < n ? 0 : (rand() - 0.5) * 2
    xy[i * 2] = (cx[c] + jitter - midX) * scale
    xy[i * 2 + 1] = -(cy[c] + jitter - midY) * scale
  }
  return { count, xy }
}
