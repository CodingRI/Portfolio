"use client"

import { motion } from "framer-motion"

export default function HolographicAvatar() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-8">
      {/* Holographic Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
      />

      {/* Inner Ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="absolute inset-2 rounded-full border border-purple-400/40"
      />

      {/* Avatar Container */}
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute inset-4 rounded-full glass-morphism flex items-center justify-center overflow-hidden"
      >
        {/* Placeholder Avatar - Replace with actual image */}
        <div className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden group">

          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 via-purple-500/20 to-pink-500/20 blur-xl animate-pulse" />

          {/* Inner planet surface */}
          <div className="absolute inset-[6px] rounded-full bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_45%,#020617_100%)] border border-white/10 shadow-[inset_0_0_25px_rgba(255,255,255,0.06)]" />

          {/* Atmospheric glow */}
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 shadow-[0_0_35px_rgba(34,211,238,0.25)]" />

          {/* Tiny stars texture */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-[22%] left-[30%] w-[2px] h-[2px] bg-white rounded-full" />
            <div className="absolute top-[60%] left-[65%] w-[1.5px] h-[1.5px] bg-cyan-300 rounded-full" />
            <div className="absolute top-[42%] left-[72%] w-[2px] h-[2px] bg-purple-300 rounded-full" />
            <div className="absolute top-[70%] left-[40%] w-[1.5px] h-[1.5px] bg-white rounded-full" />
          </div>

          {/* Main Letter */}
          <div className="relative z-10 text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-500 drop-shadow-[0_0_18px_rgba(34,211,238,0.45)] select-none">
            R
          </div>

          {/* Hover shine */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.12),transparent)] translate-x-[-100%] group-hover:translate-x-[100%]" />
        </div>
      </motion.div>

      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-xl animate-pulse" />
    </div>
  )
}
