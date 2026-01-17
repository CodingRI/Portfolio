"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, Github, X, Zap, Globe, Cpu, Code2, Star } from "lucide-react"

// ─── DATA ──────────────────────────────────────────────────────────────────────

interface Project {
  id: number
  name: string
  category: "frontend" | "backend" | "ai" | "opensource"
  description: string
  technologies: string[]
  github: string
  demo: string
  year: string
  role: string
}

const CONSTELLATIONS: Record<
  string,
  {
    label: string
    color: string
    glowColor: string
    icon: React.ReactNode
    textColor: string
    projects: Project[]
    starPositions: [number, number][]
  }
> = {
  frontend: {
    label: "Frontend",
    color: "#f97316",
    glowColor: "rgba(249,115,22,",
    icon: <Globe size={14} />,
    textColor: "text-orange-400",
    projects: [
      {
        id: 1,
        name: "Portfolio v2",
        category: "frontend",
        description:
          "A cinematic developer portfolio with immersive 3D elements, galaxy-themed project visualization, and smooth micro-animations built for maximum impact.",
        technologies: ["Next.js", "TypeScript", "Three.js", "Framer Motion", "TailwindCSS"],
        github: "https://github.com",
        demo: "https://demo.com",
        year: "2024",
        role: "Designer & Developer",
      },
      {
        id: 2,
        name: "Nutritionist Website",
        category: "frontend",
        description:
          "A health and wellness platform with dynamic diet planning, animated nutrient charts, and a clean modern UI for nutritionist professionals.",
        technologies: ["React", "Chart.js", "CSS Modules", "Firebase"],
        github: "https://github.com/CodingRI/nutritionist_portfolio",
        demo: "https://nourishwell.in/",
        year: "2026",
        role: "Full Stack Developer",
      },
    ],
    starPositions: [
      [-0.3, -0.25],
      [0.3, -0.1],
    ],
  },
  backend: {
    label: "Backend",
    color: "#06b6d4",
    glowColor: "rgba(6,182,212,",
    icon: <Cpu size={14} />,
    textColor: "text-cyan-400",
    projects: [
      {
        id: 3,
        name: "AlgoArena",
        category: "backend",
        description:
          "Real time chat extension for collaborative letcode problem solving",
        technologies: ["Node.js", "React", "Docker", "Websockets", "Zustand"],
        github: "https://github.com/CodingRI/AlgoArena",
        demo: "https://demo.com",
        year: "2025",
        role: "Personal project",
      },
      {
        id: 4,
        name: "Mobile chat app",
        category: "backend",
        description:
          "Realtime chat application with end-to-end encryption, presence detection, push notifications, and scalable chat architecture.",
        technologies: ["Flutter", "Firebase", "WebSocket", "Clerk"],
        github: "https://github.com/CodingRI/nutritionist-admin-dashboard",
        demo: "https://demo.com",
        year: "2026",
        role: "Backend Developer",
      },
      {
        id: 5,
        name: "Realtime Dashboard",
        category: "backend",
        description:
          "High-performance WebSocket server handling 10k+ concurrent connections with room management, message persistence, and delivery guarantees.",
        technologies: ["Node.js", "Socket.io", "Redis Pub/Sub", "MongoDB"],
        github: "https://github.com/CodingRI/nutritionist-admin-dashboard",
        demo: "https://dashboard.nourishwell.in/dashboard",
        year: "2026",
        role: "Backend Developer",
      },
      {
        id: 6,
        name: "Manim video generator",
        category: "backend",
        description:
          "An automated pipeline for generating high-quality math tutorial videos using Manim animation engine with version controlled scenes and intelligent rendering queue.",
        technologies: ["Node.js", "ffmpeg", "Redis Pub/Sub", "Postgres", "Manim", "Docker"],
        github: "https://github.com/CodingRI/AI-manim-video-generator",
        demo: "https://manim-studio.codingri.dev/",
        year: "2026",
        role: "Personal Project",
      },
    ],
    starPositions: [
      [-0.2, 0.3],
      [0.15, 0.45],
      [0.4, 0.2],
    ],
  },
  ai: {
    label: "AI / ML",
    color: "#a855f7",
    glowColor: "rgba(168,85,247,",
    icon: <Zap size={14} />,
    textColor: "text-purple-400",
    projects: [
      {
        id: 6,
        name: "AWS nav extension",
        category: "ai",
        description:
          "Real-time AI-powered chat extension to navigate through complex AWS tree",
        technologies: ["React", "Node.js", "OpenRouter API", "WebSocket", "LangChain", "RAG"],
        github: "https://github.com/CodingRI/AWS-nav-extenstion",
        demo: "https://demo.com",
        year: "2025",
        role: "Personal Project",
      },
      {
        id: 7,
        name: "Manim Brain",
        category: "ai",
        description:
          "Fine tuned, instruction based and LLM routing based application for video generation.",
        technologies: [ "Python", "Fine tuning", "OpenRouter", "HuggingFace", "LLM routing"],
        github: "https://github.com/CodingRI/AI-manim-video-generator",
        demo: "https://manim-studio.codingri.dev/",
        year: "2026",
        role: "Personal Project",
      },
    ],
    starPositions: [
      [0.1, -0.4],
      [-0.35, -0.1],
      [-0.05, 0.1],
    ],
  },
  opensource: {
    label: "Open Source",
    color: "#22c55e",
    glowColor: "rgba(34,197,94,",
    icon: <Code2 size={14} />,
    textColor: "text-emerald-400",
    projects: [
      {
        id: 9,
        name: "Electrade",
        category: "opensource",
        description:
          "A developer-friendly CLI toolkit that automates project scaffolding, dependency audits, and cross-environment deployment pipelines.",
        technologies: ["Node.js", "TypeScript", "Commander.js", "Ink"],
        github: "https://github.com/CodingRI/elecTrade",
        demo: "https://shreyavishesh.github.io/elecTrade/",
        year: "2024",
        role: "Project contributor",
      },
      {
        id: 10,
        name: "ToolJet",
        category: "opensource",
        description:
          "Open source low-code framework for building internal tools with drag-and-drop UI builder, pre-built connectors, and enterprise-grade security.",
        technologies: ["TypeScript", "React", "Redux", "Ant Design"],
        github: "https://github.com/ToolJet/ToolJet/pull/14033",
        demo: "https://demo.com",
        year: "2026",
        role: "Open Source Contributor",
      },
    ],
    starPositions: [
      [0.35, -0.3],
      [0.45, 0.05],
      [0.2, 0.2],
    ],
  },
}

// ─── TYPES ─────────────────────────────────────────────────────────────────────

interface StarParticle {
  x: number
  y: number
  r: number
  opacity: number
  phase: number
  twinkleSpeed: number
}

interface ShootingStar {
  x: number
  y: number
  vx: number
  vy: number
  length: number
  opacity: number
  life: number
  maxLife: number
}

interface StarNode {
  id: number
  // Logical (CSS) pixel coordinates — used for hit-testing & DOM overlays
  lx: number
  ly: number
  project: Project
  category: string
  color: string
  glowColor: string
  radius: number  // logical radius
  phase: number
  pulseSpeed: number
}

interface ConstellationGroup {
  category: string
  color: string
  glowColor: string
  stars: StarNode[]
  centerLx: number
  centerLy: number
}

// ─── CANVAS HOOK ───────────────────────────────────────────────────────────────

function useGalaxyCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  selectedFilter: string,
  hoveredStar: StarNode | null,
  selectedStar: StarNode | null,
  onStarClick: (star: StarNode | null) => void,
  onStarHover: (star: StarNode | null) => void
) {
  const particlesRef = useRef<StarParticle[]>([])
  const shootingStarsRef = useRef<ShootingStar[]>([])
  const constellationsRef = useRef<ConstellationGroup[]>([])
  const animFrameRef = useRef<number>(0)
  const timeRef = useRef(0)
  const hoveredRef = useRef<StarNode | null>(null)
  const selectedRef = useRef<StarNode | null>(null)
  // Store current logical dimensions for hit-testing
  const logicalSizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => { hoveredRef.current = hoveredStar }, [hoveredStar])
  useEffect(() => { selectedRef.current = selectedStar }, [selectedStar])

  // Build constellations — positions stored in LOGICAL pixels
  const buildConstellations = useCallback((lw: number, lh: number) => {
    const cx = lw / 2
    const cy = lh / 2

    const quadrants: Record<string, [number, number]> = {
      frontend:   [cx - lw * 0.28, cy - lh * 0.18],
      backend:    [cx + lw * 0.26, cy + lh * 0.16],
      ai:         [cx - lw * 0.22, cy + lh * 0.2],
      opensource: [cx + lw * 0.22, cy - lh * 0.22],
    }

    const spread = Math.min(lw, lh) * 0.14
    const groups: ConstellationGroup[] = []

    for (const [cat, data] of Object.entries(CONSTELLATIONS)) {
      if (selectedFilter !== "all" && selectedFilter !== cat) continue

      const [qx, qy] = quadrants[cat] ?? [cx, cy]

      const stars: StarNode[] = data.projects.map((project, i) => {
        const [rx, ry] = data.starPositions[i] ?? [0, 0]
        return {
          id: project.id,
          lx: qx + rx * spread * 2,
          ly: qy + ry * spread * 2,
          project,
          category: cat,
          color: data.color,
          glowColor: data.glowColor,
          // Fixed radius per star — no randomness so hit-zones are deterministic
          radius: 7,
          phase: (project.id * 1.37) % (Math.PI * 2),
          pulseSpeed: 0.5 + (project.id * 0.17) % 0.7,
        }
      })

      groups.push({
        category: cat,
        color: data.color,
        glowColor: data.glowColor,
        stars,
        centerLx: qx,
        centerLy: qy,
      })
    }

    constellationsRef.current = groups
  }, [selectedFilter])

  // Init background particles in LOGICAL pixels
  const initParticles = useCallback((lw: number, lh: number) => {
    // Match skill-wheel density: ~3500px² per star, slightly more small dim stars
    const count = Math.floor((lw * lh) / 2800)
    particlesRef.current = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * lw,
      y: Math.random() * lh,
      // Mostly tiny (0.3–1.2) with occasional slightly larger ones (up to 1.8) — matches Three.js Stars feel
      r: Math.random() < 0.85 ? 0.3 + Math.random() * 0.9 : 1.0 + Math.random() * 0.8,
      opacity: Math.random() < 0.7 ? 0.3 + Math.random() * 0.4 : 0.65 + Math.random() * 0.35,
      phase: (i * 0.618) % (Math.PI * 2),
      twinkleSpeed: 0.4 + Math.random() * 1.2,
    }))
  }, [])

  // Draw — all coordinates are scaled by DPR internally
  const draw = useCallback((
    ctx: CanvasRenderingContext2D,
    lw: number, lh: number,
    dpr: number,
    t: number
  ) => {
    // Work in logical pixel space by scaling the context
    ctx.save()
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, lw, lh)

    const cx = lw / 2
    const cy = lh / 2

    // ── Background — matches skill-wheel #02040a
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(lw, lh) * 0.75)
    bg.addColorStop(0,   "#050a16")
    bg.addColorStop(0.45,"#02040a")
    bg.addColorStop(1,   "#010208")
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, lw, lh)

    // ── Nebula clouds (very subtle, matching skill-wheel vibe)
    drawNebula(ctx, cx * 0.55, cy * 0.45, 200, "rgba(147,51,234,",  t * 0.07)
    drawNebula(ctx, cx * 1.45, cy * 1.55, 170, "rgba(6,182,212,",   t * 0.05 + 1)
    drawNebula(ctx, cx * 0.4,  cy * 1.45, 150, "rgba(249,115,22,",  t * 0.06 + 2)
    drawNebula(ctx, cx * 1.55, cy * 0.4,  185, "rgba(34,197,94,",   t * 0.04 + 3)
    drawNebula(ctx, cx,        cy,         100, "rgba(180,160,255,", t * 0.03)

    // ── Background stars — crisp single-pixel points like Three.js Stars
    ctx.save()
    for (const p of particlesRef.current) {
      const twinkle = 0.45 + 0.55 * Math.sin(t * p.twinkleSpeed + p.phase)
      const alpha = p.opacity * twinkle
      // Tiny stars: sharp point
      if (p.r < 0.8) {
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
      } else {
        // Slightly larger: tiny soft circle
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
        g.addColorStop(0, `rgba(255,255,255,${alpha})`)
        g.addColorStop(1, `rgba(255,255,255,0)`)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      }
    }
    ctx.restore()

    // ── Shooting stars
    updateAndDrawShootingStars(ctx, lw, lh, t)

    // ── Orbit rings (behind core)
    drawOrbitRings(ctx, cx, cy, t)

    // ── Center core
    drawCore(ctx, cx, cy, t)

    // ── Constellations
    const hovered = hoveredRef.current
    const selected = selectedRef.current

    for (const group of constellationsRef.current) {
      const isFiltered = selectedFilter !== "all" && selectedFilter !== group.category
      const alpha = isFiltered ? 0.15 : (selected && selected.category !== group.category ? 0.28 : 1)
      ctx.globalAlpha = alpha

      // Connection lines
      const stars = group.stars
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i]
          const b = stars[j]
          const nearHover = hovered && (hovered.id === a.id || hovered.id === b.id)
          const shimmer = 0.25 + 0.15 * Math.sin(t * 1.5 + i * 0.7 + j * 1.1)
          const lo = nearHover ? 0.8 : shimmer

          const grad = ctx.createLinearGradient(a.lx, a.ly, b.lx, b.ly)
          grad.addColorStop(0,   `${group.glowColor}${lo})`)
          grad.addColorStop(0.5, `${group.glowColor}${lo * 0.5})`)
          grad.addColorStop(1,   `${group.glowColor}${lo})`)

          ctx.beginPath()
          ctx.moveTo(a.lx, a.ly)
          ctx.lineTo(b.lx, b.ly)
          ctx.strokeStyle = grad
          ctx.lineWidth = nearHover ? 1.4 : 0.7
          ctx.stroke()
        }
      }

      // Stars
      for (const star of stars) {
        const isHovered  = hovered?.id === star.id
        const isSelected = selected?.id === star.id

        // Visual radius grows on hover/select but hit-zone stays at star.radius
        const pulse = Math.sin(t * star.pulseSpeed + star.phase)
        const visualR = star.radius
          * (1 + pulse * 0.1)
          * (isHovered ? 1.55 : 1)
          * (isSelected ? 1.8 : 1)
        const glowR = visualR * (isSelected ? 5.5 : isHovered ? 5 : 3.5)

        // Outer glow
        const glow = ctx.createRadialGradient(star.lx, star.ly, 0, star.lx, star.ly, glowR)
        glow.addColorStop(0,   `${star.glowColor}${isSelected ? "0.85" : isHovered ? "0.65" : "0.38"})`)
        glow.addColorStop(0.4, `${star.glowColor}${isSelected ? "0.35" : "0.14"})`)
        glow.addColorStop(1,   `${star.glowColor}0)`)
        ctx.beginPath()
        ctx.arc(star.lx, star.ly, glowR, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // Core
        const sg = ctx.createRadialGradient(star.lx, star.ly, 0, star.lx, star.ly, visualR)
        sg.addColorStop(0,    "#ffffff")
        sg.addColorStop(0.35, star.color)
        sg.addColorStop(1,    `${star.glowColor}0)`)
        ctx.beginPath()
        ctx.arc(star.lx, star.ly, visualR, 0, Math.PI * 2)
        ctx.fillStyle = sg
        ctx.fill()

        // Selected pulsing ring
        if (isSelected) {
          const ringR = visualR + 9 + 4 * Math.sin(t * 3)
          ctx.beginPath()
          ctx.arc(star.lx, star.ly, ringR, 0, Math.PI * 2)
          ctx.strokeStyle = `${star.glowColor}0.55)`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // Label — crisp text (no fractional baseline)
        const fontSize = isHovered || isSelected ? 11 : 9
        ctx.font = `${isHovered || isSelected ? 600 : 400} ${fontSize}px Inter, system-ui, sans-serif`
        ctx.fillStyle = isHovered || isSelected ? "#ffffff" : "rgba(255,255,255,0.6)"
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillText(star.project.name, Math.round(star.lx), Math.round(star.ly + visualR + 7))
        ctx.textBaseline = "alphabetic"
      }

      // Category label
      ctx.font = "600 10px Inter, system-ui, sans-serif"
      ctx.fillStyle = `${group.glowColor}0.7)`
      ctx.textAlign = "center"
      ctx.textBaseline = "alphabetic"
      ctx.fillText(
        `◈ ${CONSTELLATIONS[group.category].label}`,
        Math.round(group.centerLx),
        Math.round(group.centerLy - 55)
      )

      ctx.globalAlpha = 1
    }

    ctx.restore() // undo scale
  }, [selectedFilter])

  // Helpers (defined outside draw to keep draw clean)
  function drawNebula(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, phase: number) {
    const opacity = 0.035 + 0.018 * Math.sin(phase)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0,   `${col}${(opacity * 3).toFixed(3)})`)
    g.addColorStop(0.5, `${col}${opacity.toFixed(3)})`)
    g.addColorStop(1,   `${col}0)`)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = g
    ctx.fill()
  }

  function drawCore(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const pulse = Math.sin(t * 1.2) * 0.15
    const outerR = 65 + pulse * 25

    const corona = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR)
    corona.addColorStop(0,   "rgba(220,200,255,0.2)")
    corona.addColorStop(0.3, "rgba(168,85,247,0.08)")
    corona.addColorStop(0.7, "rgba(6,182,212,0.04)")
    corona.addColorStop(1,   "rgba(0,0,0,0)")
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
    ctx.fillStyle = corona
    ctx.fill()

    // Rotating dashed ring
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(t * 0.15)
    ctx.beginPath()
    ctx.arc(0, 0, 30, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(168,85,247,${0.18 + 0.08 * Math.sin(t * 2)})`
    ctx.lineWidth = 0.8
    ctx.setLineDash([4, 8])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()

    // Inner star glow
    const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 + pulse * 6)
    inner.addColorStop(0,   "rgba(255,255,255,0.95)")
    inner.addColorStop(0.3, "rgba(200,170,255,0.7)")
    inner.addColorStop(0.7, "rgba(168,85,247,0.3)")
    inner.addColorStop(1,   "rgba(168,85,247,0)")
    ctx.beginPath()
    ctx.arc(cx, cy, 18 + pulse * 6, 0, Math.PI * 2)
    ctx.fillStyle = inner
    ctx.fill()

    ctx.font = "bold 12px Inter, system-ui, sans-serif"
    ctx.fillStyle = "rgba(220,200,255,0.9)"
    ctx.textAlign = "center"
    ctx.textBaseline = "alphabetic"
    ctx.fillText("RI Universe", Math.round(cx), Math.round(cy + 38))
    ctx.font = "400 9px Inter, system-ui, sans-serif"
    ctx.fillStyle = "rgba(180,160,255,0.55)"
    ctx.fillText("Full Stack Developer", Math.round(cx), Math.round(cy + 52))
  }

  function drawOrbitRings(ctx: CanvasRenderingContext2D, cx: number, cy: number, _t: number) {
    const radii = [85, 138, 192, 250]
    for (let i = 0; i < radii.length; i++) {
      ctx.beginPath()
      ctx.arc(cx, cy, radii[i], 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(100,80,200,${0.055 - i * 0.008})`
      ctx.lineWidth = 0.7
      ctx.setLineDash([3, 11])
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  function updateAndDrawShootingStars(ctx: CanvasRenderingContext2D, lw: number, lh: number, _t: number) {
    if (Math.random() < 0.004) {
      shootingStarsRef.current.push({
        x: Math.random() * lw * 0.7,
        y: Math.random() * lh * 0.5,
        vx: 5 + Math.random() * 6,
        vy: 2 + Math.random() * 3,
        length: 55 + Math.random() * 75,
        opacity: 0.75 + Math.random() * 0.25,
        life: 0,
        maxLife: 40 + Math.random() * 30,
      })
    }

    shootingStarsRef.current = shootingStarsRef.current.filter(s => {
      s.life++
      s.x += s.vx
      s.y += s.vy
      const alpha = s.opacity * (1 - s.life / s.maxLife)
      const hyp = Math.hypot(s.vx, s.vy)
      const tailX = s.x - (s.vx / hyp) * s.length
      const tailY = s.y - (s.vy / hyp) * s.length

      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y)
      grad.addColorStop(0, "rgba(255,255,255,0)")
      grad.addColorStop(1, `rgba(255,255,255,${alpha})`)

      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(s.x, s.y)
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.2
      ctx.stroke()

      return s.life < s.maxLife
    })
  }

  // ── Setup & animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let dpr = 1

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      const lw = rect?.width  ?? window.innerWidth
      const lh = rect?.height ?? 600
      dpr = window.devicePixelRatio || 1

      // Physical canvas size = logical × dpr (sharp on retina)
      canvas.width  = Math.round(lw * dpr)
      canvas.height = Math.round(lh * dpr)
      // CSS size stays logical
      canvas.style.width  = `${lw}px`
      canvas.style.height = `${lh}px`

      logicalSizeRef.current = { w: lw, h: lh }
      initParticles(lw, lh)
      buildConstellations(lw, lh)
    }

    resize()
    window.addEventListener("resize", resize)

    const loop = () => {
      timeRef.current += 0.016
      const { w, h } = logicalSizeRef.current
      draw(ctx, w, h, dpr, timeRef.current)
      animFrameRef.current = requestAnimationFrame(loop)
    }
    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [draw, initParticles, buildConstellations])

  // ── Mouse interactions: coords are already in logical CSS pixels (clientX - rect.left)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    // Generous hit zone: 2.8× the star's logical radius
    let found: StarNode | null = null
    outer: for (const group of constellationsRef.current) {
      for (const star of group.stars) {
        if (Math.hypot(mx - star.lx, my - star.ly) < star.radius * 2.8) {
          found = star
          break outer
        }
      }
    }
    onStarHover(found)
    canvas.style.cursor = found ? "pointer" : "default"
  }, [onStarHover])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    for (const group of constellationsRef.current) {
      for (const star of group.stars) {
        if (Math.hypot(mx - star.lx, my - star.ly) < star.radius * 3.5) {
          onStarClick(star)
          return
        }
      }
    }
    onStarClick(null)
  }, [onStarClick])

  return { handleMouseMove, handleClick }
}

// ─── TECH TAG ──────────────────────────────────────────────────────────────────

function TechTag({ tech, color }: { tech: string; color: string }) {
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{
        borderColor: `${color}50`,
        color: color,
        background: `${color}12`,
      }}
    >
      {tech}
    </span>
  )
}

// ─── PROJECT DETAIL CARD (portal — never clipped) ─────────────────────────────

function ProjectDetailCard({
  star,
  anchorRef,
  onClose,
}: {
  star: StarNode
  anchorRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
}) {
  const data = CONSTELLATIONS[star.category]
  // Use fixed viewport positioning — immune to any overflow:hidden ancestor
  const [pos, setPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (!anchorRef.current) return
    const update = () => {
      const rect = anchorRef.current!.getBoundingClientRect()
      setPos({
        top: rect.top + rect.height / 2,   // viewport-relative, no scrollY needed for fixed
        right: window.innerWidth - rect.right + 16,
      })
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [anchorRef])

  return createPortal(
    <motion.div
      key={star.id}
      initial={{ opacity: 0, x: 48, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.92 }}
      transition={{ type: "spring", damping: 26, stiffness: 280 }}
      style={{
        position: "fixed",
        top: pos.top,
        right: pos.right,
        transform: "translateY(-50%)",
        zIndex: 9999,
        width: 312,
        maxHeight: "80vh",
        overflowY: "auto",
        background: "rgba(8,6,22,0.88)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: `1px solid ${star.color}35`,
        borderRadius: 20,
        boxShadow: `0 0 48px ${star.color}22, 0 24px 64px rgba(0,0,0,0.55)`,
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          height: 2,
          borderRadius: "20px 20px 0 0",
          background: `linear-gradient(90deg, transparent, ${star.color}, transparent)`,
        }}
      />

      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `${star.color}18`, border: `1px solid ${star.color}35`,
              color: star.color,
            }}
          >
            {data.icon}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 26, height: 26, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)",
              border: "none", cursor: "pointer",
            }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Category badge */}
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 999, fontSize: 11,
            fontWeight: 600, marginBottom: 10,
            background: `${star.color}15`, border: `1px solid ${star.color}30`,
            color: star.color,
          }}
        >
          {data.icon}
          {data.label} Constellation
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10, lineHeight: 1.3 }}>
          {star.project.name}
        </h3>

        {/* Description */}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", lineHeight: 1.65, marginBottom: 16 }}>
          {star.project.description}
        </p>

        {/* Tech stack */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
            Tech Stack
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {star.project.technologies.map((tech) => (
              <TechTag key={tech} tech={tech} color={star.color} />
            ))}
          </div>
        </div>

        {/* Meta */}
        <div
          style={{
            display: "flex", gap: 12, padding: 12, borderRadius: 12, marginBottom: 16,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginBottom: 2 }}>Year</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{star.project.year}</p>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginBottom: 2 }}>Role</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{star.project.role}</p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <motion.a
            href={star.project.github}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: `${star.color}15`, border: `1px solid ${star.color}40`,
              color: star.color, textDecoration: "none",
              boxShadow: `0 0 14px ${star.color}10`,
            }}
          >
            <Github size={13} />
            GitHub
          </motion.a>
          <motion.a
            href={star.project.demo}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(6,182,212,0.15))",
              border: "1px solid rgba(168,85,247,0.4)", color: "#e2c6ff",
              textDecoration: "none",
            }}
          >
            <ExternalLink size={13} />
            Live Demo
          </motion.a>
        </div>
      </div>
    </motion.div>,
    document.body
  )
}

// ─── TOOLTIP ──────────────────────────────────────────────────────────────────

function StarTooltip({ star }: { star: StarNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="pointer-events-none absolute z-20 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
      style={{
        left: star.lx,
        top: star.ly - star.radius - 26,
        transform: "translateX(-50%)",
        background: "rgba(10,8,28,0.92)",
        border: `1px solid ${star.color}60`,
        backdropFilter: "blur(10px)",
        boxShadow: `0 0 10px ${star.color}28`,
        whiteSpace: "nowrap",
      }}
    >
      <Star size={9} className="inline mr-1" style={{ color: star.color }} />
      {star.project.name}
    </motion.div>
  )
}

// ─── LEGEND ───────────────────────────────────────────────────────────────────

function GalaxyLegend({ selectedFilter }: { selectedFilter: string }) {
  return (
    <div className="absolute bottom-5 left-5 z-20 flex flex-col gap-2">
      {Object.entries(CONSTELLATIONS).map(([key, data]) => {
        const isActive = selectedFilter === "all" || selectedFilter === key
        return (
          <div
            key={key}
            className="flex items-center gap-2 transition-opacity duration-300"
            style={{ opacity: isActive ? 1 : 0.28 }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: data.color, boxShadow: `0 0 5px ${data.color}` }}
            />
            <span className="text-xs font-medium" style={{ color: data.color }}>
              {data.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── HUD ──────────────────────────────────────────────────────────────────────

function HUDOverlay({ projectCount }: { projectCount: number }) {
  return (
    <>
      <div
        className="absolute top-4 left-4 z-20 px-3 py-2 rounded-xl text-xs font-mono"
        style={{
          background: "rgba(8,6,22,0.75)",
          border: "1px solid rgba(168,85,247,0.22)",
          backdropFilter: "blur(10px)",
          color: "rgba(200,180,255,0.7)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>GALAXY MAP ACTIVE</span>
        </div>
        <div style={{ color: "rgba(140,120,200,0.45)" }}>
          {projectCount} STAR SYSTEMS DETECTED
        </div>
      </div>

      <div
        className="absolute top-4 right-4 z-20 px-3 py-2 rounded-xl text-xs font-mono text-right"
        style={{
          background: "rgba(8,6,22,0.75)",
          border: "1px solid rgba(6,182,212,0.18)",
          backdropFilter: "blur(10px)",
          color: "rgba(180,220,255,0.45)",
        }}
      >
        <div>COORD: RI Universe</div>
        <div>SYS: Developer Galaxy v2</div>
      </div>
    </>
  )
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

interface ProjectGalaxyProps {
  selectedFilter: string
}

export default function ProjectGalaxy({ selectedFilter }: ProjectGalaxyProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredStar,  setHoveredStar]  = useState<StarNode | null>(null)
  const [selectedStar, setSelectedStar] = useState<StarNode | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleStarClick = useCallback((star: StarNode | null) => {
    setSelectedStar(prev => (prev?.id === star?.id ? null : star))
  }, [])

  const { handleMouseMove, handleClick } = useGalaxyCanvas(
    canvasRef,
    selectedFilter,
    hoveredStar,
    selectedStar,
    handleStarClick,
    setHoveredStar
  )

  const projectCount = Object.entries(CONSTELLATIONS)
    .filter(([key]) => selectedFilter === "all" || selectedFilter === key)
    .reduce((acc, [, data]) => acc + data.projects.length, 0)

  return (
    // No overflow-hidden here — the card portal escapes via document.body
    <div ref={containerRef} className="relative w-full h-full rounded-2xl" style={{ minHeight: 560, background: "#02040a" }}>
      <canvas
        ref={canvasRef}
        className="block rounded-2xl"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => setHoveredStar(null)}
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {/* Tooltip (inside container is fine — just text, doesn't overflow) */}
      <AnimatePresence>
        {hoveredStar && !selectedStar && (
          <StarTooltip key={hoveredStar.id} star={hoveredStar} />
        )}
      </AnimatePresence>

      {/* Detail card — portal to document.body, above everything */}
      <AnimatePresence>
        {mounted && selectedStar && (
          <ProjectDetailCard
            key={selectedStar.id}
            star={selectedStar}
            anchorRef={containerRef}
            onClose={() => setSelectedStar(null)}
          />
        )}
      </AnimatePresence>

      <GalaxyLegend selectedFilter={selectedFilter} />
      <HUDOverlay projectCount={projectCount} />

      <AnimatePresence>
        {!selectedStar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-5 right-5 z-20 text-xs font-mono pointer-events-none"
            style={{ color: "rgba(180,160,255,0.3)" }}
          >
            ◎ click a star to explore
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
