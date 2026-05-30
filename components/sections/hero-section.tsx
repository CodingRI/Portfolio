"use client"

import { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Download, Rocket, AlertCircle } from "lucide-react"
import ParticleBackground from "@/components/3d/particle-background"
import HolographicAvatar from "@/components/3d/holographic-avatar"
import { isWebGLSupported } from "@/lib/webgl-utils"

const TypewriterText = ({ text, delay = 100 }: { text: string; delay?: number }) => {
  const [currentText, setCurrentText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
    const timeout = setTimeout(() => {
        setCurrentText((prevText) => prevText + text[currentIndex])
        setCurrentIndex((prevIndex) => prevIndex + 1)
      }, delay)
    return () => clearTimeout(timeout)
    }
  }, [currentIndex, delay, text])

  return (
    <span className="inline-flex items-center">
      {currentText}
      <span className="animate-pulse border-r-4 border-cyan-400 h-[1em] ml-1"></span>
    </span>
  )
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webglSupported, setWebglSupported] = useState(true)

  useEffect(() => {
    setWebglSupported(isWebGLSupported())
  }, [])

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <ParticleBackground />
      </div>

      {/* WebGL Warning */}
      {!webglSupported && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 left-4 right-4 z-20"
        >
          <div className="glass-morphism border-yellow-400/50 rounded-lg p-3 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">3D features unavailable - displaying in 2D mode</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-4xl mx-auto"
        >
          {/* Holographic Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mb-8"
          >
            <HolographicAvatar />
          </motion.div>

          {/* Name with Liquid Gradient */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-6xl md:text-8xl font-bold mb-6 liquid-gradient font-sora min-h-[1.2em]"
          >
            <TypewriterText text="I'm CodingRI" delay={150} />
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-xl md:text-2xl text-white/80 mb-8 font-light"
          >
            I build robust software to solve real problems. Driven by curiosity, pragmatism, and a passion for making things that matter.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="glass-morphism hover:animate-glow text-white border-cyan-400 hover:border-cyan-300 px-8 py-4 text-lg bg-transparent"
              variant="outline"
              onClick={() =>
                document
                  .getElementById("about")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Rocket className="mr-2 h-5 w-5" />Explore My Universe
            </Button>
            <Button
              size="lg"
              className="glass-morphism hover:animate-glow text-white border-purple-400 hover:border-purple-300 px-8 py-4 text-lg bg-transparent"
              variant="outline"
              asChild
            >
              {/* ↓ Replace the href value with your Google Drive shareable link */}
              <a
                href="https://drive.google.com/file/d/1nhpQy0il7HcDiwjq3AymMUJObQlupExV/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-5 w-5" />Download Resume
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="w-1 h-3 bg-cyan-400 rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  )
}
