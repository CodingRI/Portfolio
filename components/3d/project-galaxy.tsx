"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, Github, X, Zap, Globe, Cpu, Code2, Star, Layers } from "lucide-react"

// ─── DATA ──────────────────────────────────────────────────────────────────────

interface Project {
  id: number
  name: string
  description: string
  technologies: string[]
  techStarPositions: [number, number][]
  github: string
  demo: string
  year: string
  role: string
  color: string
  glowColor: string
  icon: React.ReactNode
  quadrant: [number, number] // fractional offsets from center, e.g. [-0.3, -0.2]
}

const PROJECTS: Project[] = [
  {
    id: 1,
    name: "Nourishwell",
    description:
      "A health and wellness platform with dynamic diet planning, animated nutrient charts, and a clean modern UI for nutritionist professionals.",
    technologies: ["React", "Chart.js", "CSS Modules", "Firebase"],
    techStarPositions: [[-0.28, -0.22], [0.22, -0.28], [0.30, 0.16], [-0.18, 0.28]],
    github: "https://github.com/CodingRI/nutritionist_portfolio",
    demo: "https://nourishwell.in/",
    year: "2026",
    role: "Full Stack Developer",
    color: "#f97316",
    glowColor: "rgba(249,115,22,",
    icon: <Globe size={14} />,
    quadrant: [-0.30, -0.20],
  },
  {
    id: 2,
    name: "Manim Video Generator",
    description:
      "An automated pipeline for generating high-quality math tutorial videos using Manim animation engine with version controlled scenes, an intelligent rendering queue, and a fine-tuned LLM brain.",
    technologies: ["Node.js", "Python", "Manim", "Docker", "ffmpeg", "Postgres", "Redis", "OpenRouter"],
    techStarPositions: [
      [-0.30, -0.20], [0.28, -0.18], [0.32, 0.20],
      [-0.20, 0.28],  [0.10, 0.35], [-0.35, 0.10],
      [0.18, -0.32],  [-0.12, -0.35],
    ],
    github: "https://github.com/CodingRI/AI-manim-video-generator",
    demo: "https://manim-studio.codingri.dev/",
    year: "2026",
    role: "Personal Project",
    color: "#a855f7",
    glowColor: "rgba(168,85,247,",
    icon: <Zap size={14} />,
    quadrant: [0.28, -0.22],
  },
  {
    id: 3,
    name: "Portfolio",
    description:
      "A cinematic developer portfolio with immersive 3D elements, galaxy-themed project visualization, and smooth micro-animations built for maximum impact.",
    technologies: ["Next.js", "TypeScript", "Three.js", "Framer Motion", "TailwindCSS"],
    techStarPositions: [[-0.26, -0.20], [0.24, -0.24], [0.28, 0.18], [-0.18, 0.26], [0.08, 0.32]],
    github: "https://github.com/CodingRI",
    demo: "#",
    year: "2024",
    role: "Designer & Developer",
    color: "#06b6d4",
    glowColor: "rgba(6,182,212,",
    icon: <Layers size={14} />,
    quadrant: [0.0, 0.28],
  },
  {
    id: 4,
    name: "Electrade",
    description:
      "Open-source CLI toolkit that automates project scaffolding, dependency audits, and cross-environment deployment pipelines. Contributed to the Electrade project.",
    technologies: ["Node.js", "TypeScript", "Commander.js", "Ink"],
    techStarPositions: [[-0.26, -0.20], [0.24, -0.22], [0.26, 0.18], [-0.18, 0.26]],
    github: "https://github.com/CodingRI/elecTrade",
    demo: "https://shreyavishesh.github.io/elecTrade/",
    year: "2024",
    role: "Project Contributor",
    color: "#22c55e",
    glowColor: "rgba(34,197,94,",
    icon: <Code2 size={14} />,
    quadrant: [-0.30, 0.22],
  },
  {
    id: 5,
    name: "Algo Arena",
    description:
      "Real-time collaborative extension for LeetCode problem solving — features live chat, shared code views, WebSocket sync, and state management with Zustand.",
    technologies: ["React", "Node.js", "WebSockets", "Zustand", "Docker"],
    techStarPositions: [[-0.28, -0.20], [0.24, -0.22], [0.28, 0.16], [-0.16, 0.26], [0.08, 0.30]],
    github: "https://github.com/CodingRI/AlgoArena",
    demo: "https://demo.com",
    year: "2025",
    role: "Personal Project",
    color: "#f43f5e",
    glowColor: "rgba(244,63,94,",
    icon: <Cpu size={14} />,
    quadrant: [0.30, 0.18],
  },
  {
    id: 6,
    name: "AWS Nav Extension",
    description:
      "Real-time AI-powered chat extension to navigate complex AWS service trees using RAG, LangChain, and an OpenRouter-backed language model.",
    technologies: ["React", "Node.js", "OpenRouter API", "LangChain", "RAG", "WebSocket"],
    techStarPositions: [
      [-0.28, -0.20], [0.26, -0.20], [0.28, 0.18],
      [-0.18, 0.26],  [0.10, 0.32], [-0.10, -0.30],
    ],
    github: "https://github.com/CodingRI/AWS-nav-extenstion",
    demo: "https://demo.com",
    year: "2025",
    role: "Personal Project",
    color: "#eab308",
    glowColor: "rgba(234,179,8,",
    icon: <Zap size={14} />,
    quadrant: [-0.04, -0.28],
  },
]

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

// A tech-stack star node
interface StarNode {
  id: string           // "{projectId}-{techIndex}"
  lx: number
  ly: number
  techLabel: string
  projectId: number
  color: string
  glowColor: string
  radius: number
  phase: number
  pulseSpeed: number
}

interface ConstellationGroup {
  project: Project
  stars: StarNode[]
  centerLx: number
  centerLy: number
}

// ─── CANVAS HOOK ───────────────────────────────────────────────────────────────

function useGalaxyCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  hoveredStar: StarNode | null,
  selectedProjectId: number | null,
  onStarHover: (star: StarNode | null) => void,
  onStarClick: (star: StarNode | null) => void
) {
  const particlesRef = useRef<StarParticle[]>([])
  const shootingStarsRef = useRef<ShootingStar[]>([])
  const constellationsRef = useRef<ConstellationGroup[]>([])
  const animFrameRef = useRef<number>(0)
  const timeRef = useRef(0)
  const hoveredRef = useRef<StarNode | null>(null)
  const selectedIdRef = useRef<number | null>(null)
  const logicalSizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => { hoveredRef.current = hoveredStar }, [hoveredStar])
  useEffect(() => { selectedIdRef.current = selectedProjectId }, [selectedProjectId])

  // Build constellations in logical pixels
  const buildConstellations = useCallback((lw: number, lh: number) => {
    const cx = lw / 2
    const cy = lh / 2
    const spread = Math.min(lw, lh) * 0.12

    const groups: ConstellationGroup[] = PROJECTS.map((project) => {
      const [qfx, qfy] = project.quadrant
      const qx = cx + qfx * lw
      const qy = cy + qfy * lh

      const stars: StarNode[] = project.technologies.map((tech, i) => {
        const [rx, ry] = project.techStarPositions[i] ?? [0, 0]
        const seedId = project.id * 100 + i
        return {
          id: `${project.id}-${i}`,
          lx: qx + rx * spread * 2.4,
          ly: qy + ry * spread * 2.4,
          techLabel: tech,
          projectId: project.id,
          color: project.color,
          glowColor: project.glowColor,
          radius: 5,
          phase: (seedId * 1.37) % (Math.PI * 2),
          pulseSpeed: 0.4 + (seedId * 0.13) % 0.7,
        }
      })

      return {
        project,
        stars,
        centerLx: qx,
        centerLy: qy,
      }
    })

    constellationsRef.current = groups
  }, [])

  // Init background particles
  const initParticles = useCallback((lw: number, lh: number) => {
    const count = Math.floor((lw * lh) / 2800)
    particlesRef.current = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * lw,
      y: Math.random() * lh,
      r: Math.random() < 0.85 ? 0.3 + Math.random() * 0.9 : 1.0 + Math.random() * 0.8,
      opacity: Math.random() < 0.7 ? 0.3 + Math.random() * 0.4 : 0.65 + Math.random() * 0.35,
      phase: (i * 0.618) % (Math.PI * 2),
      twinkleSpeed: 0.4 + Math.random() * 1.2,
    }))
  }, [])

  const draw = useCallback((
    ctx: CanvasRenderingContext2D,
    lw: number, lh: number,
    dpr: number,
    t: number
  ) => {
    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, lw, lh)

    const cx = lw / 2
    const cy = lh / 2

    // Background
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(lw, lh) * 0.75)
    bg.addColorStop(0,    "#050a16")
    bg.addColorStop(0.45, "#02040a")
    bg.addColorStop(1,    "#010208")
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, lw, lh)

    // Nebula clouds — one per project colour
    drawNebula(ctx, cx * 0.45, cy * 0.42, 180, "rgba(249,115,22,",  t * 0.07)
    drawNebula(ctx, cx * 1.55, cy * 0.42, 175, "rgba(168,85,247,",  t * 0.05 + 1)
    drawNebula(ctx, cx,        cy * 1.55, 160, "rgba(6,182,212,",   t * 0.06 + 2)
    drawNebula(ctx, cx * 0.42, cy * 1.55, 155, "rgba(34,197,94,",   t * 0.04 + 3)
    drawNebula(ctx, cx * 1.55, cy * 1.55, 165, "rgba(244,63,94,",   t * 0.05 + 4)
    drawNebula(ctx, cx,        cy * 0.42, 150, "rgba(234,179,8,",   t * 0.06 + 5)
    drawNebula(ctx, cx,        cy,        90,  "rgba(180,160,255,",  t * 0.03)

    // Background stars
    ctx.save()
    for (const p of particlesRef.current) {
      const twinkle = 0.45 + 0.55 * Math.sin(t * p.twinkleSpeed + p.phase)
      const alpha = p.opacity * twinkle
      if (p.r < 0.8) {
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
      } else {
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

    // Shooting stars
    updateAndDrawShootingStars(ctx, lw, lh, t)

    // Orbit rings + core
    drawOrbitRings(ctx, cx, cy, t)
    drawCore(ctx, cx, cy, t)

    // Constellations
    const hovered = hoveredRef.current
    const selId = selectedIdRef.current

    for (const group of constellationsRef.current) {
      const isSelected = group.project.id === selId
      const alpha = selId !== null && !isSelected ? 0.22 : 1
      ctx.globalAlpha = alpha

      const { stars, project } = group

      // Connection lines between tech stars
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i]
          const b = stars[j]
          const nearHover = hovered && (hovered.id === a.id || hovered.id === b.id)
          const shimmer = 0.18 + 0.12 * Math.sin(t * 1.5 + i * 0.7 + j * 1.1)
          const lo = nearHover ? 0.7 : shimmer

          const grad = ctx.createLinearGradient(a.lx, a.ly, b.lx, b.ly)
          grad.addColorStop(0,   `${project.glowColor}${lo})`)
          grad.addColorStop(0.5, `${project.glowColor}${lo * 0.4})`)
          grad.addColorStop(1,   `${project.glowColor}${lo})`)

          ctx.beginPath()
          ctx.moveTo(a.lx, a.ly)
          ctx.lineTo(b.lx, b.ly)
          ctx.strokeStyle = grad
          ctx.lineWidth = nearHover ? 1.2 : 0.6
          ctx.stroke()
        }
      }

      // Lines from each tech star to the centre
      for (const star of stars) {
        const shimmer = 0.1 + 0.07 * Math.sin(t * 0.8 + star.phase)
        ctx.beginPath()
        ctx.moveTo(group.centerLx, group.centerLy)
        ctx.lineTo(star.lx, star.ly)
        ctx.strokeStyle = `${project.glowColor}${shimmer})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Tech-stack stars
      for (const star of stars) {
        const isHovered = hovered?.id === star.id
        const pulse = Math.sin(t * star.pulseSpeed + star.phase)
        const visualR = star.radius * (1 + pulse * 0.12) * (isHovered ? 1.6 : 1) * (isSelected ? 1.3 : 1)
        const glowR = visualR * (isSelected ? 4.5 : isHovered ? 5 : 3.2)

        const glow = ctx.createRadialGradient(star.lx, star.ly, 0, star.lx, star.ly, glowR)
        glow.addColorStop(0,   `${star.glowColor}${isHovered ? "0.6" : "0.32"})`)
        glow.addColorStop(0.4, `${star.glowColor}0.12)`)
        glow.addColorStop(1,   `${star.glowColor}0)`)
        ctx.beginPath()
        ctx.arc(star.lx, star.ly, glowR, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        const sg = ctx.createRadialGradient(star.lx, star.ly, 0, star.lx, star.ly, visualR)
        sg.addColorStop(0,    "#ffffff")
        sg.addColorStop(0.35, star.color)
        sg.addColorStop(1,    `${star.glowColor}0)`)
        ctx.beginPath()
        ctx.arc(star.lx, star.ly, visualR, 0, Math.PI * 2)
        ctx.fillStyle = sg
        ctx.fill()

        // Tech label below star
        const fontSize = isHovered ? 10 : 8
        ctx.font = `${isHovered ? 600 : 400} ${fontSize}px Inter, system-ui, sans-serif`
        ctx.fillStyle = isHovered ? "#ffffff" : `${project.glowColor}0.7)`
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillText(star.techLabel, Math.round(star.lx), Math.round(star.ly + visualR + 5))
        ctx.textBaseline = "alphabetic"
      }

      // Centre hub of the constellation (slightly larger dot)
      const hubPulse = 0.5 + 0.5 * Math.sin(t * 0.9 + project.id)
      const hubR = 9 + hubPulse * 2.5
      const hubGlow = ctx.createRadialGradient(group.centerLx, group.centerLy, 0, group.centerLx, group.centerLy, hubR * 3.5)
      hubGlow.addColorStop(0,   `${project.glowColor}${isSelected ? "0.9" : "0.55"})`)
      hubGlow.addColorStop(0.5, `${project.glowColor}${isSelected ? "0.3" : "0.15"})`)
      hubGlow.addColorStop(1,   `${project.glowColor}0)`)
      ctx.beginPath()
      ctx.arc(group.centerLx, group.centerLy, hubR * 3.5, 0, Math.PI * 2)
      ctx.fillStyle = hubGlow
      ctx.fill()

      const hub = ctx.createRadialGradient(group.centerLx, group.centerLy, 0, group.centerLx, group.centerLy, hubR)
      hub.addColorStop(0,    "#ffffff")
      hub.addColorStop(0.3,  project.color)
      hub.addColorStop(1,    `${project.glowColor}0)`)
      ctx.beginPath()
      ctx.arc(group.centerLx, group.centerLy, hubR, 0, Math.PI * 2)
      ctx.fillStyle = hub
      ctx.fill()

      // Selected ring
      if (isSelected) {
        const ringR = hubR + 10 + 4 * Math.sin(t * 3)
        ctx.beginPath()
        ctx.arc(group.centerLx, group.centerLy, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = `${project.glowColor}0.55)`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      ctx.globalAlpha = 1
    }

    ctx.restore()
  }, [])

  function drawNebula(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, phase: number) {
    const opacity = 0.03 + 0.015 * Math.sin(phase)
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

  // Setup & animation loop
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

      canvas.width  = Math.round(lw * dpr)
      canvas.height = Math.round(lh * dpr)
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

  // Mouse interactions
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    let found: StarNode | null = null
    outer: for (const group of constellationsRef.current) {
      for (const star of group.stars) {
        if (Math.hypot(mx - star.lx, my - star.ly) < star.radius * 3.5) {
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
        if (Math.hypot(mx - star.lx, my - star.ly) < star.radius * 4) {
          onStarClick(star)
          return
        }
      }
    }
    onStarClick(null)
  }, [onStarClick])

  // Expose constellation positions for DOM overlays
  const getConstellationPositions = useCallback(() => {
    return constellationsRef.current.map(g => ({
      projectId: g.project.id,
      centerLx: g.centerLx,
      centerLy: g.centerLy,
    }))
  }, [])

  return { handleMouseMove, handleClick, getConstellationPositions, constellationsRef }
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
  project,
  anchorRef,
  onClose,
}: {
  project: Project
  anchorRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
}) {
  const [pos, setPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (!anchorRef.current) return
    const update = () => {
      const rect = anchorRef.current!.getBoundingClientRect()
      setPos({
        // shift upward by ~120px relative to vertical center
        top: rect.top + rect.height / 2 - 120,
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
      key={project.id}
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
        width: 320,
        maxHeight: "80vh",
        overflowY: "auto",
        background: "rgba(8,6,22,0.92)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: `1px solid ${project.color}35`,
        borderRadius: 20,
        boxShadow: `0 0 48px ${project.color}22, 0 24px 64px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          height: 2,
          borderRadius: "20px 20px 0 0",
          background: `linear-gradient(90deg, transparent, ${project.color}, transparent)`,
        }}
      />

      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `${project.color}18`, border: `1px solid ${project.color}35`,
              color: project.color,
            }}
          >
            {project.icon}
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

        {/* Title */}
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>
          {project.name}
        </h3>

        {/* Meta row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 9px", borderRadius: 999, fontSize: 10,
              fontWeight: 600, background: `${project.color}15`,
              border: `1px solid ${project.color}30`, color: project.color,
            }}
          >
            {project.icon}
            {project.year}
          </span>
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 9px", borderRadius: 999, fontSize: 10,
              fontWeight: 500, background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)",
            }}
          >
            {project.role}
          </span>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", lineHeight: 1.65, marginBottom: 16 }}>
          {project.description}
        </p>

        {/* Tech stack */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
            Tech Stack
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {project.technologies.map((tech) => (
              <TechTag key={tech} tech={tech} color={project.color} />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <motion.a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: `${project.color}15`, border: `1px solid ${project.color}40`,
              color: project.color, textDecoration: "none",
              boxShadow: `0 0 14px ${project.color}10`,
            }}
          >
            <Github size={13} />
            GitHub
          </motion.a>
          <motion.a
            href={project.demo}
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

// ─── CONSTELLATION LABEL BUTTONS (DOM overlay) ────────────────────────────────

function ConstellationLabels({
  constellationsRef,
  selectedProjectId,
  onSelect,
  canvasRef,
}: {
  constellationsRef: React.RefObject<ConstellationGroup[]>
  selectedProjectId: number | null
  onSelect: (id: number) => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}) {
  const [positions, setPositions] = useState<{ id: number; x: number; y: number; color: string; glowColor: string; name: string }[]>([])

  useEffect(() => {
    let raf: number
    const update = () => {
      if (!canvasRef.current) { raf = requestAnimationFrame(update); return }
      const rect = canvasRef.current.getBoundingClientRect()
      const groups = constellationsRef.current ?? []
      // Scale from logical to rendered CSS px — canvas CSS size equals logical
      setPositions(groups.map(g => ({
        id: g.project.id,
        // centerLx/Ly are already logical CSS pixels matching the canvas CSS size
        x: g.centerLx,
        y: g.centerLy - 52,   // 52px above the hub centre
        color: g.project.color,
        glowColor: g.project.glowColor,
        name: g.project.name,
      })))
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [constellationsRef, canvasRef])

  return (
    <>
      {positions.map(pos => {
        const isSelected = pos.id === selectedProjectId
        return (
          <motion.button
            key={pos.id}
            onClick={() => onSelect(pos.id)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.95 }}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -100%)",
              cursor: "pointer",
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: isSelected ? "#fff" : pos.color,
              background: isSelected
                ? `${pos.color}30`
                : `rgba(8,6,22,0.7)`,
              border: `1px solid ${pos.color}${isSelected ? "80" : "45"}`,
              backdropFilter: "blur(8px)",
              boxShadow: isSelected
                ? `0 0 18px ${pos.color}50, 0 0 6px ${pos.color}30`
                : `0 0 8px ${pos.color}20`,
              zIndex: 10,
              pointerEvents: "auto",
              whiteSpace: "nowrap",
              transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s, color 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: pos.color,
              boxShadow: `0 0 6px ${pos.color}`,
              display: "inline-block",
              flexShrink: 0,
            }} />
            {pos.name}
          </motion.button>
        )
      })}
    </>
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
      {star.techLabel}
    </motion.div>
  )
}

// ─── LEGEND ───────────────────────────────────────────────────────────────────

function GalaxyLegend({ selectedProjectId }: { selectedProjectId: number | null }) {
  return (
    <div className="absolute bottom-5 left-5 z-20 flex flex-col gap-2">
      {PROJECTS.map((project) => {
        const isActive = selectedProjectId === null || selectedProjectId === project.id
        return (
          <div
            key={project.id}
            className="flex items-center gap-2 transition-opacity duration-300"
            style={{ opacity: isActive ? 1 : 0.28 }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: project.color, boxShadow: `0 0 5px ${project.color}` }}
            />
            <span className="text-xs font-medium" style={{ color: project.color }}>
              {project.name}
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

export default function ProjectGalaxy() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredStar,       setHoveredStar]       = useState<StarNode | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const selectedProject = PROJECTS.find(p => p.id === selectedProjectId) ?? null

  const handleStarClick = useCallback((star: StarNode | null) => {
    if (!star) {
      setSelectedProjectId(null)
    } else {
      setSelectedProjectId(prev => (prev === star.projectId ? null : star.projectId))
    }
  }, [])

  const handleLabelClick = useCallback((id: number) => {
    setSelectedProjectId(prev => (prev === id ? null : id))
  }, [])

  const { handleMouseMove, handleClick, constellationsRef } = useGalaxyCanvas(
    canvasRef,
    hoveredStar,
    selectedProjectId,
    setHoveredStar,
    handleStarClick,
  )

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-2xl" style={{ minHeight: 560, background: "#02040a" }}>
      <canvas
        ref={canvasRef}
        className="block rounded-2xl"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => setHoveredStar(null)}
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {/* Clickable project label buttons overlaid on the canvas */}
      <ConstellationLabels
        constellationsRef={constellationsRef}
        selectedProjectId={selectedProjectId}
        onSelect={handleLabelClick}
        canvasRef={canvasRef}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredStar && !selectedProject && (
          <StarTooltip key={hoveredStar.id} star={hoveredStar} />
        )}
      </AnimatePresence>

      {/* Detail card — portal to document.body */}
      <AnimatePresence>
        {mounted && selectedProject && (
          <ProjectDetailCard
            key={selectedProject.id}
            project={selectedProject}
            anchorRef={containerRef}
            onClose={() => setSelectedProjectId(null)}
          />
        )}
      </AnimatePresence>

      <GalaxyLegend selectedProjectId={selectedProjectId} />
      <HUDOverlay projectCount={PROJECTS.length} />

      <AnimatePresence>
        {!selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-5 right-5 z-20 text-xs font-mono pointer-events-none"
            style={{ color: "rgba(180,160,255,0.3)" }}
          >
            ◎ click a star or label to explore
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
