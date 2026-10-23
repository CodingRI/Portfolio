import { PARTICLE_CONFIG } from "./config"

export type MorphState =
  | "portrait"
  | "portrait-interacting"
  | "morphing-to-text"
  | "text"
  | "morphing-to-portrait"

export interface MorphOptions {
  /** When true, transitions are instant and no automatic cycle runs (prefers-reduced-motion). */
  reducedMotion: boolean
  autoCycle: boolean
}

/**
 * Single authority over the portrait <-> wordmark morph.
 *
 * `progress` is one scalar in [0,1] (0 = portrait, 1 = wordmark) that moves toward `goal` at a fixed rate.
 * The shader maps it to a per-particle eased path, so the controller never touches individual particles.
 *
 * Interruption rules (so repeated clicks and automatic cycles can't conflict):
 *  - A toggle is accepted in every state. It only flips `goal`; `progress` continues from where it is, so the
 *    motion reverses smoothly mid-flight instead of snapping.
 *  - Every manual toggle resets the idle timers, so the auto-cycle never fights the user.
 *  - The auto-cycle timer is frozen while the pointer is interacting with the portrait in a portrait state.
 *  - The wordmark is held for `hold` seconds, then returns automatically.
 */
export class MorphController {
  state: MorphState = "portrait"
  progress = 0
  private goal: 0 | 1 = 0
  private idle = 0
  private cycles = 0
  private interacting = false

  constructor(private opts: MorphOptions) {}

  setOptions(opts: Partial<MorphOptions>) {
    this.opts = { ...this.opts, ...opts }
    if (this.opts.reducedMotion) this.snap()
  }

  /** Pointer entered / left the portrait. Only changes the visible state in portrait configurations. */
  setInteracting(active: boolean) {
    this.interacting = active
    if (this.state === "portrait" && active) this.state = "portrait-interacting"
    else if (this.state === "portrait-interacting" && !active) this.state = "portrait"
  }

  /** Manual toggle (click / tap / keyboard). */
  toggle() {
    this.idle = 0
    this.goal = this.goal === 0 ? 1 : 0
    if (this.opts.reducedMotion) {
      this.snap()
      return
    }
    this.state = this.goal === 1 ? "morphing-to-text" : "morphing-to-portrait"
  }

  private snap() {
    this.progress = this.goal
    this.settle()
  }

  private settle() {
    this.state = this.goal === 1 ? "text" : this.interacting ? "portrait-interacting" : "portrait"
    this.idle = 0
    if (this.goal === 0) this.cycles++
  }

  /** Advance by dt seconds. Returns the current progress. */
  update(dt: number): number {
    const { morph } = PARTICLE_CONFIG
    if (this.progress !== this.goal) {
      const dur = this.goal === 1 ? morph.toText : morph.toPortrait
      const step = dt / dur
      this.progress =
        this.goal === 1 ? Math.min(1, this.progress + step) : Math.max(0, this.progress - step)
      if (this.progress === this.goal) this.settle()
      return this.progress
    }

    if (this.opts.reducedMotion) return this.progress

    if (this.state === "text") {
      this.idle += dt
      if (this.idle >= morph.hold) this.toggle()
    } else if (this.opts.autoCycle && !(this.interacting && this.state === "portrait-interacting")) {
      this.idle += dt
      const wait = this.cycles === 0 ? morph.startDelay : morph.interval
      if (this.idle >= wait && (this.cycles === 0 || morph.autoRepeat)) this.toggle()
    }
    return this.progress
  }

  /** True while anything is moving or about to move; lets the host pause rendering when fully static. */
  get isAnimating() {
    return this.progress !== this.goal
  }
}
