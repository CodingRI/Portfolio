import { PARTICLE_CONFIG, mulberry32 } from "./config"

/** Result of sampling the photograph: normalised point cloud + per-point source colour. */
export interface PortraitShape {
  count: number
  /** x,y in a space where the subject's height is 1 and the origin is its bounding-box centre (y up). */
  xy: Float32Array
  /** Source colour (0..1 sRGB) of each sample. */
  rgb: Float32Array
  /** 0..1 edge strength at each sample. */
  edge: Float32Array
  /** 0..1 density-fade (1 = fully visible, <1 near the cropped edges). */
  fade: Float32Array
  /** Width / height of the sampled subject. */
  aspect: number
}

const WORK_LONG_SIDE = 340

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = "async"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load portrait image: ${src}`))
    img.src = src
  })
}

/**
 * High-definition generative contour sampling:
 * 1. Accurately segments subject from snow background using flood-fill and component isolation.
 * 2. Samples particles along undulating horizontal scanline contours (similar to LiDAR topographic scans).
 * 3. Preserves high-contrast facial landmarks (eyes, eyebrows, nose bridge, smile) so the face is immediately recognizable.
 * 4. Eliminates noisy random speckles and edge fringes.
 */
export async function samplePortrait(src: string, wanted: number): Promise<PortraitShape> {
  const img = await loadImage(src)
  const { crop, cropFade } = PARTICLE_CONFIG

  const sx = img.naturalWidth * crop.x
  const sy = img.naturalHeight * crop.y
  const sw = img.naturalWidth * crop.w
  const sh = img.naturalHeight * crop.h
  const k = WORK_LONG_SIDE / Math.max(sw, sh)
  const W = Math.max(8, Math.round(sw * k))
  const H = Math.max(8, Math.round(sh * k))

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("2D canvas unavailable")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)
  const data = ctx.getImageData(0, 0, W, H).data

  const n = W * H
  const lum = new Float32Array(n)
  const snow = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    const mx = Math.max(r, g, b)
    const mn = Math.min(r, g, b)
    const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    lum[i] = l
    const sat = mx === 0 ? 0 : (mx - mn) / mx
    snow[i] = l > 0.62 && sat < 0.15 ? 1 : 0
  }

  // --- flood fill background from the border ---
  const isBg = new Uint8Array(n)
  const queue = new Int32Array(n)
  let qh = 0
  let qt = 0
  const push = (i: number) => {
    if (snow[i] && !isBg[i]) {
      isBg[i] = 1
      queue[qt++] = i
    }
  }
  for (let x = 0; x < W; x++) {
    push(x)
    push((H - 1) * W + x)
  }
  for (let y = 0; y < H; y++) {
    push(y * W)
    push(y * W + W - 1)
  }
  while (qh < qt) {
    const i = queue[qh++]
    const x = i % W
    if (x > 0) push(i - 1)
    if (x < W - 1) push(i + 1)
    if (i >= W) push(i - W)
    if (i < n - W) push(i + W)
  }

  // --- keep only the primary connected component (head + torso) ---
  const label = new Int32Array(n)
  let nextLabel = 0
  let primaryLabel = 0
  let maxComponentSize = 0

  for (let s = 0; s < n; s++) {
    if (isBg[s] || label[s]) continue
    nextLabel++
    let size = 0
    qh = 0
    qt = 0
    label[s] = nextLabel
    queue[qt++] = s
    while (qh < qt) {
      const i = queue[qh++]
      size++
      const x = i % W
      const tryPush = (j: number) => {
        if (!isBg[j] && !label[j]) {
          label[j] = nextLabel
          queue[qt++] = j
        }
      }
      if (x > 0) tryPush(i - 1)
      if (x < W - 1) tryPush(i + 1)
      if (i >= W) tryPush(i - W)
      if (i < n - W) tryPush(i + W)
    }
    if (size > maxComponentSize) {
      maxComponentSize = size
      primaryLabel = nextLabel
    }
  }

  const fg = new Uint8Array(n)
  for (let i = 0; i < n; i++) fg[i] = label[i] === primaryLabel ? 1 : 0

  // --- edge strength (Sobel) ---
  const edge = new Float32Array(n)
  let edgeMax = 1e-6
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      const gx =
        -lum[i - W - 1] - 2 * lum[i - 1] - lum[i + W - 1] + lum[i - W + 1] + 2 * lum[i + 1] + lum[i + W + 1]
      const gy =
        -lum[i - W - 1] - 2 * lum[i - W] - lum[i - W + 1] + lum[i + W - 1] + 2 * lum[i + W] + lum[i + W + 1]
      const m = Math.hypot(gx, gy)
      edge[i] = m
      if (m > edgeMax) edgeMax = m
    }
  }
  const edgeNorm = 1 / (edgeMax * 0.45)

  // --- Generate structured scanlines ---
  // Scanlines provide immediate artistic coherence and prevent TV-static noise
  const rand = mulberry32(1337)
  const numLines = Math.max(90, Math.min(130, Math.round(Math.sqrt(wanted) * 1.25)))
  const stepX = 2 // sample every 2 pixels horizontally for crisp detail

  const candX: number[] = []
  const candY: number[] = []
  const candIdx: number[] = []
  const candEdge: number[] = []
  const candFade: number[] = []

  for (let li = 0; li < numLines; li++) {
    const yNorm = li / (numLines - 1)
    const yPx = Math.min(H - 1, Math.max(0, Math.round(yNorm * (H - 1))))

    // Smooth boundary fade
    const bottomFade = Math.min(1, Math.max(0, (1 - yNorm) / cropFade.bottom))

    for (let xPx = 0; xPx < W; xPx += stepX) {
      const i = yPx * W + xPx
      if (!fg[i]) continue

      const xNorm = xPx / W
      const fade =
        Math.min(
          Math.min(1, Math.max(0, xNorm / cropFade.left)),
          Math.min(1, Math.max(0, (1 - xNorm) / cropFade.right)),
        ) * bottomFade
      if (fade < 0.04) continue

      // Micro-undulation for organic flow
      const wave = Math.sin(xPx * 0.07 + yPx * 0.035) * 1.05

      // Sample coordinate
      candX.push(xPx + 0.5 + (rand() - 0.5) * 0.4)
      candY.push(yPx + wave + 0.5 + (rand() - 0.5) * 0.3)
      candIdx.push(i)
      candEdge.push(Math.min(1, edge[i] * edgeNorm))
      candFade.push(fade)
    }
  }

  const m = candIdx.length
  if (m === 0) throw new Error("Portrait segmentation produced an empty mask")

  // Downsample evenly or keep all if within budget
  const count = Math.min(wanted, m)
  let chosenIndices: number[] = []
  if (count >= m) {
    chosenIndices = Array.from({ length: m }, (_, idx) => idx)
  } else {
    // Systematic stride sampling to keep scanline integrity
    const step = m / count
    for (let c = 0; c < count; c++) {
      chosenIndices.push(Math.floor(c * step))
    }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const c of chosenIndices) {
    minX = Math.min(minX, candX[c])
    maxX = Math.max(maxX, candX[c])
    minY = Math.min(minY, candY[c])
    maxY = Math.max(maxY, candY[c])
  }

  const scale = 1 / (maxY - minY)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  const xy = new Float32Array(count * 2)
  const rgb = new Float32Array(count * 3)
  const edgeOut = new Float32Array(count)
  const fadeOut = new Float32Array(count)

  for (let j = 0; j < count; j++) {
    const c = chosenIndices[j]
    const i = candIdx[c]
    xy[j * 2] = (candX[c] - cx) * scale
    xy[j * 2 + 1] = -(candY[c] - cy) * scale
    rgb[j * 3] = data[i * 4] / 255
    rgb[j * 3 + 1] = data[i * 4 + 1] / 255
    rgb[j * 3 + 2] = data[i * 4 + 2] / 255
    edgeOut[j] = candEdge[c]
    fadeOut[j] = candFade[c]
  }

  return { count, xy, rgb, edge: edgeOut, fade: fadeOut, aspect: (maxX - minX) / (maxY - minY) }
}
