"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import ProjectGalaxy from "@/components/3d/project-galaxy"
import ProjectFilter from "@/components/project-filter"

export default function ProjectsSection() {
  const [selectedFilter, setSelectedFilter] = useState("all")

  return (
    <section id="projects" className="py-20 relative min-h-screen">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 liquid-gradient font-sora">Developer Galaxy</h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Navigate my project universe — each constellation maps a skill domain. Hover to illuminate, click a star to explore the story behind it.
          </p>

          <ProjectFilter selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />
        </motion.div>

        <div className="h-[700px] w-full rounded-2xl"
          style={{
            border: "1px solid rgba(168,85,247,0.12)",
            boxShadow: "0 0 80px rgba(100,60,200,0.1), inset 0 0 80px rgba(0,0,0,0.3)",
          }}
        >
          <ProjectGalaxy selectedFilter={selectedFilter} />
        </div>
      </div>
    </section>
  )
}
