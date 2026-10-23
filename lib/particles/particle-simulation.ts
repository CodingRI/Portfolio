import { PARTICLE_CONFIG } from "./config"
import type { ParticleData } from "./particle-data"

/** Must match DELAY_SPREAD in the vertex shader. */
export const DELAY_SPREAD = 0.38

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Pointer in stage-local pixels (origin = portrait stage centre, y up). */
export class PointerInteraction {
  x = 0
  y = 0
  vx = 0
  vy = 0
  /** Smoothed 0..1 influence; ramps in/out so entering/leaving never pops. */
  strength = 0
  active = false
  private lastX = 0
  private lastY = 0
  private hasLast = false

  move(x: number, y: number, dt: number) {
    if (this.hasLast && dt > 0) {
      const k = Math.min(1, dt * 18)
      this.vx += ((x - this.lastX) / dt - this.vx) * k
      this.vy += ((y - this.lastY) / dt - this.vy) * k
    }
    this.lastX = this.x = x
    this.lastY = this.y = y
    this.hasLast = true
  }

  leave() {
    this.active = false
    this.hasLast = false
  }

  /** Called once per frame. */
  step(dt: number) {
    const target = this.active ? 1 : 0
    this.strength += (target - this.strength) * (1 - Math.exp(-dt * (target > this.strength ? 12 : 5)))
    this.vx *= Math.exp(-dt * 6)
    this.vy *= Math.exp(-dt * 6)
    if (this.strength < 0.001 && !this.active) this.strength = 0
  }
}

/**
 * CPU half of the simulation: per-particle spring displacement + binary-glyph amount.
 * The shader handles the morph path and ripple; this class owns state that needs memory (velocity).
 * All buffers are allocated once; `update` allocates nothing.
 */
export class ParticleSimulation {
  /** vec3 per particle: offset x, offset y, binary amount (0 dot .. 1 glyph). */
  readonly dyn: Float32Array
  private vel: Float32Array
  /** True when anything changed this frame and the GPU attribute must be re-uploaded. */
  dirty = false
  private wasMoving = false

  constructor(private data: ParticleData) {
    this.dyn = new Float32Array(data.count * 3)
    this.vel = new Float32Array(data.count * 2)
  }

  /**
   * @param sp  px per portrait-height unit
   * @param st  px per wordmark-width unit
   * @param radius interaction radius in px
   */
  update(dt: number, morph: number, sp: number, st: number, radius: number, pointer: PointerInteraction) {
    const { count, portrait, text, rand } = this.data
    const { stiffness, damping, maxDisplacement, wake } = PARTICLE_CONFIG.physics
    const dyn = this.dyn
    const vel = this.vel
    const px = pointer.x
    const py = pointer.y
    const ps = pointer.strength
    const maxD = maxDisplacement * sp
    const maxD2 = maxD * maxD
    const r2 = radius * radius
    const push = stiffness * maxD * 1.15
    const pvx = pointer.vx
    const pvy = pointer.vy
    const inK = 1 - Math.exp(-dt * 11)
    const outK = 1 - Math.exp(-dt * 3.2)
    const ddt = Math.min(dt, 1 / 30)
    let moving = false

    for (let i = 0; i < count; i++) {
      const o = i * 3
      const v = i * 2
      let ox = dyn[o]
      let oy = dyn[o + 1]
      let bin = dyn[o + 2]
      let vx = vel[v]
      let vy = vel[v + 1]

      // Base position (same eased path the shader uses, minus the decorative curve).
      const tl = Math.min(1, Math.max(0, (morph - rand[i * 4] * DELAY_SPREAD) / (1 - DELAY_SPREAD)))
      const e = easeInOutCubic(tl)
      const bx = portrait[i * 3] * sp * (1 - e) + text[i * 2] * st * e
      const by = portrait[i * 3 + 1] * sp * (1 - e) + text[i * 2 + 1] * st * e

      let f = 0
      let nx = 0
      let ny = 0
      if (ps > 0) {
        const dx = bx - px
        const dy = by - py
        const d2 = dx * dx + dy * dy
        if (d2 < r2) {
          const d = Math.sqrt(d2) + 0.001
          const q = 1 - d / radius
          f = q * q * ps
          nx = dx / d
          ny = dy / d
        }
      }

      // Binary glyph amount: quick in, slow out.
      const bt = f > 0.015 ? Math.min(1, f * 2.4) : 0
      bin += (bt - bin) * (bt > bin ? inK : outK)
      if (bin < 0.002 && bt === 0) bin = 0

      // Spring toward the target + bounded push away from pointer + small wake from pointer velocity.
      let ax = -stiffness * ox - damping * vx
      let ay = -stiffness * oy - damping * vy
      if (f > 0) {
        ax += nx * f * push + pvx * f * wake * 20
        ay += ny * f * push + pvy * f * wake * 20
      }
      vx += ax * ddt
      vy += ay * ddt
      ox += vx * ddt
      oy += vy * ddt

      // Hard bound on displacement keeps the silhouette recognisable.
      const m2 = ox * ox + oy * oy
      if (m2 > maxD2) {
        const s = maxD / Math.sqrt(m2)
        ox *= s
        oy *= s
        vx *= 0.5
        vy *= 0.5
      }
      if (m2 < 0.0004 && vx * vx + vy * vy < 0.0004 && f === 0) {
        ox = oy = vx = vy = 0
      } else {
        moving = true
      }
      if (bin > 0) moving = true

      dyn[o] = ox
      dyn[o + 1] = oy
      dyn[o + 2] = bin
      vel[v] = vx
      vel[v + 1] = vy
    }
    // Upload while moving, plus once more on the frame that settles back to rest.
    this.dirty = moving || this.wasMoving || this.dirty
    this.wasMoving = moving
  }

  /** Reset to rest immediately (used for reduced motion). */
  clear() {
    this.dyn.fill(0)
    this.vel.fill(0)
    this.dirty = true
  }
}
