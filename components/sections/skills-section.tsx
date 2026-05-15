"use client"

import { motion } from "framer-motion"
import SkillWheel from "@/components/3d/skill-wheel"

export default function SkillsSection() {
  return (
    <section id="skills" className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 liquid-gradient font-sora">Skills Galaxy</h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
          This was the best way to explain what's in my mind most of the time, tho it's sad :|
          </p>
        </motion.div>

        <div className="h-[600px] w-full">
          <SkillWheel />
        </div>
      </div>
    </section>
  )
}
