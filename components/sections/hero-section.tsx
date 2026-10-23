"use client"

import { useCallback, useRef, useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import ParticlePortrait from "@/components/hero/particle-portrait"
import HeroNavigation, { HeroActions, type NavTarget } from "@/components/hero/hero-navigation"
import type { MorphState } from "@/lib/particles/morph-controller"

const EASE = [0.22, 1, 0.36, 1] as const

export default function HeroSection() {
  const stageRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<(() => void) | null>(null)
  const [fallback, setFallback] = useState(false)
  const [morphState, setMorphState] = useState<MorphState>("portrait")
  const [seenText, setSeenText] = useState(false)

  // Targets & hover state for real WebGL particle conduits
  const [navTargets, setNavTargets] = useState<NavTarget[]>([])
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null)

  const onFallback = useCallback(() => setFallback(true), [])
  const onStateChange = useCallback((s: MorphState) => {
    setMorphState(s)
    if (s === "morphing-to-text" || s === "text") setSeenText(true)
  }, [])

  const showingText = morphState === "text" || morphState === "morphing-to-text"
  const revealed = seenText || fallback

  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-black">
      {/* Subtle atmospheric glow that fades completely into pure black */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 35% 50%, rgba(140, 111, 208, 0.08) 0%, transparent 60%)",
        }}
      />

      {/* 3D Particle Portrait, Ambient Stars & Living Particle Conduits */}
      <ParticlePortrait
        stageRef={stageRef}
        toggleRef={toggleRef}
        onStateChange={onStateChange}
        onFallback={onFallback}
        navTargets={navTargets}
        activeHoverIndex={activeHoverIndex}
        revealed={revealed}
      />

      {fallback && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-4 right-4 z-20"
        >
          <div className="glass-morphism border-yellow-400/50 rounded-lg p-3 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Interactive portrait unavailable - showing static layout</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Hero Container: Balanced 2-column layout */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 items-center gap-8 px-6 pb-24 pt-12 md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:px-12 lg:px-20">
        {/* Left: Particle Portrait Stage */}
        <motion.div
          ref={stageRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
          className="relative h-[55vh] min-h-[360px] max-h-[580px] w-full md:h-[min(82vh,780px)] md:max-h-none"
          style={{ touchAction: "pan-y" }}
        >
          {fallback ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-sora text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#dc5aae] via-[#a98be0] to-[#d4cbff] bg-clip-text text-transparent sm:text-7xl">
                I&apos;m CodingRI
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => toggleRef.current?.()}
              aria-pressed={showingText}
              aria-label={
                showingText
                  ? "Return to portrait"
                  : "Transform portrait into the CodingRI wordmark"
              }
              className="absolute inset-0 cursor-pointer rounded-3xl bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#e58ac6]/70"
            />
          )}
        </motion.div>

        {/* Right: Editorial Typographic Navigation */}
        <div className="flex items-center justify-center md:justify-start md:pl-20 lg:pl-32 xl:pl-40">
          <HeroNavigation
            revealed={revealed}
            onTargetsChange={setNavTargets}
            onHoverIndex={setActiveHoverIndex}
          />
        </div>
      </div>

      {/* Action Buttons: Anchored bottom-right */}
      <HeroActions />

      {/* Centered Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transform"
      >
        <div className="flex h-10 w-6 justify-center rounded-full border-2 border-white/30 backdrop-blur-sm">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="mt-2 h-3 w-1 rounded-full bg-[#dc5aae] shadow-[0_0_8px_#dc5aae]"
          />
        </div>
      </motion.div>
    </section>
  )
}
