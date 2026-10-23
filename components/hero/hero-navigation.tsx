"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Download, Rocket } from "lucide-react"

export interface NavTarget {
  x: number // viewport clientX px
  y: number // viewport clientY px
}

export interface HeroNavigationProps {
  revealed: boolean
  onTargetsChange?: (targets: NavTarget[]) => void
  onHoverIndex?: (index: number | null) => void
}

/** Navigation destinations & labels */
export const HERO_NAV_ITEMS = [
  { name: "Home", href: "#home", id: "01" },
  { name: "About", href: "#about", id: "02" },
  { name: "Projects", href: "#projects", id: "03" },
  { name: "Skills", href: "#skills", id: "04" },
  { name: "Blog", href: "#blog", id: "05" },
  { name: "Contact", href: "#contact", id: "06" },
]

const RESUME_URL = "https://drive.google.com/file/d/12ZFRCEl3f5XZ-cKG_QiOHJllYoD6mN0i/view?usp=sharing"
const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Editorial Typographic Navigation:
 * Anchors the destinations with delicate glowing terminal pips where living WebGL particle conduits arrive.
 * Zero static SVG lines.
 */
export default function HeroNavigation({
  revealed,
  onTargetsChange,
  onHoverIndex,
}: HeroNavigationProps) {
  const reduce = useReducedMotion()
  const boxRef = useRef<HTMLDivElement>(null)
  const pipRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [current, setCurrent] = useState<number | null>(null)

  const measure = useCallback(() => {
    const targets: NavTarget[] = pipRefs.current.map((el) => {
      if (!el) return { x: 0, y: 0 }
      const r = el.getBoundingClientRect()
      return {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
      }
    })
    onTargetsChange?.(targets)
  }, [onTargetsChange])

  useLayoutEffect(() => {
    measure()
    const t1 = setTimeout(measure, 100)
    const t2 = setTimeout(measure, 400)
    const ro = new ResizeObserver(measure)
    if (boxRef.current) ro.observe(boxRef.current)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, { passive: true })
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure)
    }
  }, [measure])

  const setHover = (idx: number | null) => {
    setCurrent(idx)
    onHoverIndex?.(idx)
  }

  const d = (i: number) => 0.12 + i * 0.07

  return (
    <div
      ref={boxRef}
      className="relative w-full max-w-md transition-opacity duration-700"
      style={{ visibility: revealed ? "visible" : "hidden" }}
    >
      <nav aria-label="Primary" className="relative">
        <ul
          className="relative z-10 flex flex-col gap-6 pl-2 md:pl-6"
          onMouseLeave={() => setHover(null)}
        >
          {HERO_NAV_ITEMS.map((link, i) => {
            const active = current === i
            return (
              <motion.li
                key={link.name}
                initial={{ opacity: reduce ? 1 : 0, x: reduce ? 0 : 20 }}
                animate={{ opacity: revealed ? 1 : 0, x: revealed ? 0 : 20 }}
                transition={{ duration: 0.55, delay: reduce ? 0 : d(i) + 0.3, ease: EASE }}
              >
                <div className="relative flex items-center gap-4">
                  {/* Terminal Anchor Pip: Destination target for the living Three.js particle conduit */}
                  <span
                    ref={(el) => {
                      pipRefs.current[i] = el
                    }}
                    className={`relative flex h-2 w-2 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      active
                        ? "scale-150 bg-white shadow-[0_0_12px_#ffffff,0_0_24px_#dc5aae]"
                        : "bg-[#d4cbff]/40"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-pink-400 opacity-60" />
                    )}
                  </span>

                  {/* Typographic Link */}
                  <motion.a
                    href={link.href}
                    onHoverStart={() => setHover(i)}
                    onHoverEnd={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    onTapStart={() => setHover(i)}
                    onTap={() =>
                      window.setTimeout(() => setHover(null), 700)
                    }
                    onTapCancel={() => setHover(null)}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    animate={{
                      x: active && !reduce ? 10 : 0,
                    }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="group relative flex items-baseline gap-3.5 py-1 outline-none"
                  >
                    {/* Destination Title */}
                    <span
                      className={`font-sora text-xl font-light tracking-wide transition-all duration-300 md:text-2xl ${
                        active
                          ? "font-normal text-white drop-shadow-[0_0_20px_rgba(220,90,174,0.7)]"
                          : "text-white/75 group-hover:text-white"
                      }`}
                    >
                      {link.name}
                    </span>
                  </motion.a>
                </div>
              </motion.li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

/** Icon-only actions anchored bottom-right with smooth expanding hover labels */
export function HeroActions() {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: reduce ? 0 : 1.2, ease: EASE }}
      className="absolute bottom-6 right-6 z-20 flex items-center gap-3 md:bottom-8 md:right-8"
    >
      <ActionTile
        label="Explore Universe"
        onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
      >
        <Rocket className="h-4 w-4 text-purple-300 group-hover:text-white" strokeWidth={1.8} />
      </ActionTile>
      <ActionTile label="Download Resume" href={RESUME_URL}>
        <Download className="h-4 w-4 text-pink-300 group-hover:text-white" strokeWidth={1.8} />
      </ActionTile>
    </motion.div>
  )
}

function ActionTile({
  label,
  href,
  onClick,
  children,
}: {
  label: string
  href?: string
  onClick?: () => void
  children: React.ReactNode
}) {
  const cls =
    "group flex h-11 items-center rounded-full border border-white/10 bg-white/[0.04] px-3.5 text-[#b9b4e8] outline-none backdrop-blur-md transition-all duration-300 hover:border-pink-500/50 hover:bg-white/[0.08] hover:shadow-[0_0_24px_rgba(220,90,174,0.35)] focus-visible:ring-2 focus-visible:ring-[#e58ac6] active:scale-95"

  const content = (
    <>
      {children}
      <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 font-sora text-xs font-medium tracking-wider text-white opacity-0 transition-all duration-300 group-hover:max-w-[12rem] group-hover:pl-2.5 group-hover:opacity-100 group-focus-visible:max-w-[12rem] group-focus-visible:pl-2.5 group-focus-visible:opacity-100">
        {label}
      </span>
    </>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls}>
        {content}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cls}>
      {content}
    </button>
  )
}
