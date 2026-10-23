"use client"

import { Component, useEffect, useMemo, useRef, useState } from "react"
import type { MutableRefObject, ReactNode, RefObject } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useReducedMotion } from "framer-motion"
import * as THREE from "three"
import { isWebGLSupported } from "@/lib/webgl-utils"
import { PARTICLE_CONFIG, getDeviceClass, getParticleBudget, hexToRgb, mulberry32 } from "@/lib/particles/config"
import { samplePortrait } from "@/lib/particles/portrait-sampler"
import { sampleWordmark } from "@/lib/particles/text-sampler"
import { buildParticleData, type ParticleData } from "@/lib/particles/particle-data"
import { ParticleSimulation, PointerInteraction } from "@/lib/particles/particle-simulation"
import { MorphController, type MorphState } from "@/lib/particles/morph-controller"
import {
  conduitFragment,
  conduitVertex,
  createGlyphAtlas,
  portraitFragment,
  portraitVertex,
  starsFragment,
  starsVertex,
} from "@/lib/particles/shaders"
import type { NavTarget } from "./hero-navigation"

export interface ParticlePortraitProps {
  /** Element whose box defines where the portrait / wordmark is drawn. */
  stageRef: RefObject<HTMLElement | null>
  /** Filled with a function that toggles portrait <-> wordmark. */
  toggleRef: MutableRefObject<(() => void) | null>
  onStateChange?: (state: MorphState) => void
  /** Called if WebGL or the image pipeline is unavailable so the host can show a static fallback. */
  onFallback?: () => void
  /** Screen targets for living particle conduits */
  navTargets?: NavTarget[]
  /** Currently hovered navigation index (0..5) */
  activeHoverIndex?: number | null
  revealed?: boolean
}

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/* -------------------------------------------------------------------------------------------------
 * Stars: a restrained ambient field spanning the whole hero.
 * ----------------------------------------------------------------------------------------------- */
function Stars({ parallax, intro, time }: { parallax: THREE.Vector2; intro: { v: number }; time: { v: number } }) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const compact = size.width < 768

  const { geometry, material } = useMemo(() => {
    const n = compact ? PARTICLE_CONFIG.stars.mobile : PARTICLE_CONFIG.stars.desktop
    const rand = mulberry32(7)
    const star = new Float32Array(n * 4)
    const color = new Float32Array(n * 3)
    const base = hexToRgb(PARTICLE_CONFIG.palette.star)
    const accent = hexToRgb(PARTICLE_CONFIG.palette.starAccent)
    for (let i = 0; i < n; i++) {
      star[i * 4] = rand()
      star[i * 4 + 1] = rand()
      star[i * 4 + 2] = rand()
      star[i * 4 + 3] = rand()
      const c = rand() < 0.1 ? accent : base
      color.set(c, i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    g.setAttribute("aStar", new THREE.BufferAttribute(star, 4))
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3))
    const m = new THREE.ShaderMaterial({
      vertexShader: starsVertex,
      fragmentShader: starsFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uView: { value: new THREE.Vector2(1, 1) },
        uParallax: { value: new THREE.Vector2() },
        uPR: { value: 1 },
        uIntro: { value: 0 },
      },
    })
    return { geometry: g, material: m }
  }, [compact])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(() => {
    const u = material.uniforms
    u.uTime.value = time.v
    u.uView.value.set(size.width, size.height)
    u.uParallax.value.copy(parallax)
    u.uPR.value = dpr
    u.uIntro.value = intro.v
  })

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={0} />
}

/* -------------------------------------------------------------------------------------------------
 * Living Particle Conduits: Real Three.js particles flowing to the navigation items
 * ----------------------------------------------------------------------------------------------- */
function ParticleConduits({
  intro,
  time,
  navTargets = [],
  activeHoverIndex = null,
  morphRef,
  centerRef,
  spRef,
  stRef,
  revealed = false,
  canvasRectRef,
}: {
  intro: { v: number }
  time: { v: number }
  navTargets?: NavTarget[]
  activeHoverIndex?: number | null
  morphRef: { v: number }
  centerRef: { x: number; y: number }
  spRef: { v: number }
  stRef: { v: number }
  revealed?: boolean
  canvasRectRef: { current: DOMRect | null }
}) {
  const dpr = useThree((s) => s.viewport.dpr)
  const STREAMS = 6
  const PER_STREAM = 180
  const TOTAL = STREAMS * PER_STREAM

  const { geometry, material, activeVals } = useMemo(() => {
    const rand = mulberry32(888)
    const conduit = new Float32Array(TOTAL * 4)
    let idx = 0
    for (let s = 0; s < STREAMS; s++) {
      for (let p = 0; p < PER_STREAM; p++) {
        conduit[idx * 4 + 0] = s
        conduit[idx * 4 + 1] = p / PER_STREAM
        conduit[idx * 4 + 2] = rand()
        conduit[idx * 4 + 3] = rand()
        idx++
      }
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TOTAL * 3), 3))
    g.setAttribute("aConduit", new THREE.BufferAttribute(conduit, 4))

    const origins = Array.from({ length: 6 }, () => new THREE.Vector2())
    const targets = Array.from({ length: 6 }, () => new THREE.Vector2())
    const active = [0, 0, 0, 0, 0, 0]

    const m = new THREE.ShaderMaterial({
      vertexShader: conduitVertex,
      fragmentShader: conduitFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uPR: { value: 1 },
        uIntro: { value: 0 },
        uVisible: { value: 0 },
        uOrigins: { value: origins },
        uTargets: { value: targets },
        uActive: { value: active },
      },
    })
    return { geometry: g, material: m, activeVals: [0, 0, 0, 0, 0, 0] }
  }, [TOTAL])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((_, delta) => {
    const u = material.uniforms
    const dt = Math.min(delta, 1 / 30)
    u.uTime.value = time.v
    u.uPR.value = dpr
    u.uIntro.value = intro.v

    const targetVis = revealed ? 1 : 0
    u.uVisible.value += (targetVis - u.uVisible.value) * Math.min(1, dt * 6)

    const cRect = canvasRectRef.current
    const cx = centerRef.x
    const cy = centerRef.y
    const sp = spRef.v
    const st = stRef.v
    const m = morphRef.v

    for (let s = 0; s < 6; s++) {
      // Flow directly from silhouette edge / wordmark end
      const portraitOx = cx + 0.28 * sp
      const portraitOy = cy + (0.30 - s * 0.11) * sp

      const textOx = cx + 0.46 * st
      const textOy = cy + (0.10 - s * 0.04) * st

      const ox = portraitOx * (1 - m) + textOx * m
      const oy = portraitOy * (1 - m) + textOy * m
      u.uOrigins.value[s].set(ox, oy)

      // Target from DOM client rect
      if (navTargets[s] && cRect) {
        const nx = navTargets[s].x - cRect.left - cRect.width / 2
        const ny = -(navTargets[s].y - cRect.top - cRect.height / 2)
        u.uTargets.value[s].set(nx, ny)
      } else {
        u.uTargets.value[s].set(ox + 200, oy)
      }

      // Hover surge animation
      const goalActive = activeHoverIndex === s ? 1 : 0
      activeVals[s] += (goalActive - activeVals[s]) * Math.min(1, dt * 14)
      u.uActive.value[s] = activeVals[s]
    }
  })

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />
}

/* -------------------------------------------------------------------------------------------------
 * Portrait particles
 * ----------------------------------------------------------------------------------------------- */
interface SceneProps extends ParticlePortraitProps {
  data: ParticleData | null
  reduced: boolean
}

function Scene({
  data,
  reduced,
  stageRef,
  toggleRef,
  onStateChange,
  onFallback,
  navTargets = [],
  activeHoverIndex = null,
  revealed = false,
}: SceneProps) {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  const controller = useMemo(
    () => new MorphController({ reducedMotion: reduced, autoCycle: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const pointer = useMemo(() => new PointerInteraction(), [])
  const simulation = useMemo(() => (data ? new ParticleSimulation(data) : null), [data])
  const atlas = useMemo(() => createGlyphAtlas(), [])

  // Mutable, per-frame state
  const frame = useRef({
    time: 0,
    intro: 0,
    layoutAge: 99,
    cx: 0,
    cy: 0,
    w: 1,
    h: 1,
    sp: 1,
    st: 1,
    radius: 80,
    lastState: "portrait" as MorphState,
    rectDirty: true,
    canvasRect: null as DOMRect | null,
  })

  const timeRef = useRef({ v: 0 })
  const introRef = useRef({ v: 0 })
  const morphRef = useRef({ v: 0 })
  const spRef = useRef({ v: 1 })
  const stRef = useRef({ v: 1 })
  const centerRef = useRef({ x: 0, y: 0 })
  const canvasRectRef = useRef<DOMRect | null>(null)

  const parallax = useMemo(() => new THREE.Vector2(), [])
  const parallaxTarget = useMemo(() => new THREE.Vector2(), [])

  const { geometry, material, dynAttr } = useMemo(() => {
    if (!data || !simulation) return { geometry: null, material: null, dynAttr: null }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(data.portrait, 3))
    g.setAttribute("aText", new THREE.BufferAttribute(data.text, 2))
    g.setAttribute("aRand", new THREE.BufferAttribute(data.rand, 4))
    g.setAttribute("aColor", new THREE.BufferAttribute(data.color, 3))
    g.setAttribute("aAlpha", new THREE.BufferAttribute(data.alpha, 1))
    const dyn = new THREE.BufferAttribute(simulation.dyn, 3)
    dyn.setUsage(THREE.DynamicDrawUsage)
    g.setAttribute("aDyn", dyn)
    const [ar, ag, ab] = hexToRgb(PARTICLE_CONFIG.palette.magenta)
    const [br, bg, bb] = hexToRgb(PARTICLE_CONFIG.palette.lavender)
    const m = new THREE.ShaderMaterial({
      vertexShader: portraitVertex,
      fragmentShader: portraitFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uSp: { value: 1 },
        uSt: { value: 1 },
        uCenter: { value: new THREE.Vector2() },
        uPointer: { value: new THREE.Vector2(1e5, 1e5) },
        uPointerAct: { value: 0 },
        uRadius: { value: 100 },
        uPR: { value: 1 },
        uIntro: { value: 0 },
        uAtlas: { value: atlas },
        uTextA: { value: new THREE.Vector3(ar, ag, ab) },
        uTextB: { value: new THREE.Vector3(br, bg, bb) },
      },
    })
    return { geometry: g, material: m, dynAttr: dyn }
  }, [data, simulation, atlas])

  useEffect(
    () => () => {
      geometry?.dispose()
      material?.dispose()
    },
    [geometry, material],
  )
  useEffect(() => () => atlas.dispose(), [atlas])

  useEffect(() => {
    controller.setOptions({ reducedMotion: reduced })
    if (reduced) {
      simulation?.clear()
      introRef.current.v = 1
    }
    invalidate()
  }, [reduced, controller, simulation, invalidate])

  useEffect(() => {
    toggleRef.current = () => {
      controller.toggle()
      invalidate()
    }
    return () => {
      toggleRef.current = null
    }
  }, [controller, invalidate, toggleRef])

  useEffect(() => {
    const el = gl.domElement
    const lost = (e: Event) => {
      e.preventDefault()
      onFallback?.()
    }
    el.addEventListener("webglcontextlost", lost)
    return () => el.removeEventListener("webglcontextlost", lost)
  }, [gl, onFallback])

  // Pointer tracking
  useEffect(() => {
    if (reduced) {
      pointer.leave()
      return
    }
    const f = frame.current
    const canvas = gl.domElement
    const markDirty = () => {
      f.rectDirty = true
    }
    let lastT = performance.now()

    const onMove = (e: PointerEvent) => {
      if (f.rectDirty || !f.canvasRect) {
        f.canvasRect = canvas.getBoundingClientRect()
        canvasRectRef.current = f.canvasRect
        f.rectDirty = false
      }
      const r = f.canvasRect
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      if (!inside) {
        pointer.leave()
        controller.setInteracting(false)
        return
      }
      const now = performance.now()
      const dt = Math.max(0.001, (now - lastT) / 1000)
      lastT = now
      const lx = e.clientX - r.left - r.width / 2 - f.cx
      const ly = -(e.clientY - r.top - r.height / 2) - f.cy
      pointer.active = true
      pointer.move(lx, ly, dt)
      parallaxTarget.set(-(e.clientX - r.left - r.width / 2) * 0.012, (e.clientY - r.top - r.height / 2) * 0.012)
      const over = Math.abs(lx) < f.w / 2 && Math.abs(ly) < f.h / 2
      controller.setInteracting(over)
    }
    const onLeave = () => {
      pointer.leave()
      controller.setInteracting(false)
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") onLeave()
    }
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) onLeave()
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onMove, { passive: true })
    window.addEventListener("pointerup", onUp, { passive: true })
    window.addEventListener("pointercancel", onLeave, { passive: true })
    window.addEventListener("pointerout", onOut, { passive: true })
    window.addEventListener("blur", onLeave)
    window.addEventListener("scroll", markDirty, { passive: true })
    window.addEventListener("resize", markDirty)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onLeave)
      window.removeEventListener("pointerout", onOut)
      window.removeEventListener("blur", onLeave)
      window.removeEventListener("scroll", markDirty)
      window.removeEventListener("resize", markDirty)
    }
  }, [gl, pointer, controller, reduced, parallaxTarget])

  const measure = () => {
    const stage = stageRef.current
    const f = frame.current
    if (!stage || !data) return
    const canvas = gl.domElement.getBoundingClientRect()
    const s = stage.getBoundingClientRect()
    if (s.width < 4 || s.height < 4) return
    f.canvasRect = canvas
    canvasRectRef.current = canvas
    f.rectDirty = false
    f.cx = s.left + s.width / 2 - (canvas.left + canvas.width / 2)
    f.cy = -(s.top + s.height / 2 - (canvas.top + canvas.height / 2)) + s.height * 0.02
    f.w = s.width
    f.h = s.height
    f.sp = Math.min(s.height * 0.9, (s.width * 0.96) / data.aspect)
    f.st = s.width * 0.9
    const dc = getDeviceClass(canvas.width)
    f.radius = (dc === "mobile" ? PARTICLE_CONFIG.radius.mobile : PARTICLE_CONFIG.radius.desktop) * f.sp

    centerRef.current.x = f.cx
    centerRef.current.y = f.cy
    spRef.current.v = f.sp
    stRef.current.v = f.st
  }

  useEffect(() => {
    measure()
    invalidate()
    const stage = stageRef.current
    if (!stage) return
    const ro = new ResizeObserver(() => {
      measure()
      invalidate()
    })
    ro.observe(stage)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, size.width, size.height])

  useFrame((_, delta) => {
    const f = frame.current
    const dt = Math.min(delta, 1 / 20)

    f.layoutAge += dt
    if (f.layoutAge > 0.5) {
      f.layoutAge = 0
      measure()
    }

    if (reduced) {
      f.time = 0
      f.intro = 1
    } else {
      f.time += dt
      f.intro = Math.min(1, f.intro + dt / 1.8)
    }
    timeRef.current.v = f.time
    introRef.current.v = f.intro * f.intro * (3 - 2 * f.intro)
    parallax.lerp(parallaxTarget, 1 - Math.exp(-dt * 3))

    if (!material || !simulation || !dynAttr) return

    const morph = controller.update(dt)
    morphRef.current.v = morph

    if (controller.state !== f.lastState) {
      f.lastState = controller.state
      onStateChange?.(controller.state)
    }

    pointer.step(dt)
    if (!reduced) {
      simulation.update(dt, morph, f.sp, f.st, f.radius, pointer)
      if (simulation.dirty) {
        dynAttr.needsUpdate = true
        simulation.dirty = false
      }
    }

    const u = material.uniforms
    u.uTime.value = f.time
    u.uMorph.value = morph
    u.uSp.value = f.sp
    u.uSt.value = f.st
    u.uCenter.value.set(f.cx, f.cy)
    u.uPointer.value.set(pointer.x, pointer.y)
    u.uPointerAct.value = reduced ? 0 : pointer.strength
    u.uRadius.value = f.radius
    u.uPR.value = dpr
    u.uIntro.value = introRef.current.v
  })

  return (
    <>
      <Stars parallax={parallax} intro={introRef.current} time={timeRef.current} />
      <ParticleConduits
        intro={introRef.current}
        time={timeRef.current}
        navTargets={navTargets}
        activeHoverIndex={activeHoverIndex}
        morphRef={morphRef.current}
        centerRef={centerRef.current}
        spRef={spRef.current}
        stRef={stRef.current}
        revealed={revealed}
        canvasRectRef={canvasRectRef}
      />
      {geometry && material && <points geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />}
    </>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Public component
 * ----------------------------------------------------------------------------------------------- */
export default function ParticlePortrait(props: ParticlePortraitProps) {
  const { onFallback } = props
  const prefersReduced = useReducedMotion() ?? false
  const [data, setData] = useState<ParticleData | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [active, setActive] = useState(true)
  const wrapRef = useRef<HTMLDivElement>(null)
  const fallbackRef = useRef(onFallback)
  fallbackRef.current = onFallback

  useEffect(() => {
    if (!isWebGLSupported()) {
      setSupported(false)
      fallbackRef.current?.()
      return
    }
    setSupported(true)
    let cancelled = false
    const budget = getParticleBudget(window.innerWidth)
    ;(async () => {
      try {
        const portrait = await samplePortrait(PARTICLE_CONFIG.imageSrc, budget)
        const text = await sampleWordmark(portrait.count)
        if (!cancelled) setData(buildParticleData(portrait, text))
      } catch (err) {
        console.warn("[ParticlePortrait] falling back to static hero:", err)
        if (!cancelled) fallbackRef.current?.()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    let inView = true
    let docVisible = !document.hidden
    const sync = () => setActive(inView && docVisible)
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      sync()
    })
    if (el) io.observe(el)
    const onVis = () => {
      docVisible = !document.hidden
      sync()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  if (supported === false) return null

  return (
    <div ref={wrapRef} className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <SceneBoundary onError={() => fallbackRef.current?.()}>
        <Canvas
          orthographic
          camera={{ position: [0, 0, 10], zoom: 1, near: 0.1, far: 100 }}
          dpr={[1, 2]}
          frameloop={active && !prefersReduced ? "always" : "demand"}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
          style={{ background: "transparent" }}
        >
          <Scene {...props} data={data} reduced={prefersReduced} />
        </Canvas>
      </SceneBoundary>
    </div>
  )
}
