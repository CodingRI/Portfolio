"use client"

import { motion } from "framer-motion"
import ProjectGalaxy from "@/components/3d/project-galaxy"

export default function ProjectsSection() {

  return (
    <section id="projects" className="py-20 relative min-h-screen">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 liquid-gradient font-sora">Project Constellations</h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Navigate my project universe — each constellation is a project. Click a label or a tech star to explore the story behind it.
          </p>
        </motion.div>

        <div
          className="w-full rounded-2xl"
          style={{
            height: "clamp(360px, 55vw, 700px)",
            border: "1px solid rgba(168,85,247,0.12)",
            boxShadow: "0 0 80px rgba(100,60,200,0.1), inset 0 0 80px rgba(0,0,0,0.3)",
          }}
        >
          <ProjectGalaxy />
        </div>
      </div>
    </section>
  )
}
