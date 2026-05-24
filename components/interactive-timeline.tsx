"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Briefcase } from "lucide-react"

const timelineData = [
  {
    id: 1,
    year: "2026",
    title: "Fully functional nutritionist website",
    company: "Freelance",
    location: "Remote",
    description:
      "Led the end-to-end development of a comprehensive nutritionist website for a client",
    technologies: ["Next.js", "Typescript", "postgreSQL", "React native"],
    achievements: [
      "Increased performance by 40%",
      "Led team of 8 developers",
      "Architected microservices",
    ],
  },
  {
    id: 2,
    year: "2026",
    title: "Open Source Contributor",
    company: "ToolJet",
    location: "Remote",
    description:
      "Contributed to the ToolJet open-source platform by improving frontend functionality, feature enhancements and fixes.",
    technologies: [
      "React",
      "TypeScript",
      "Next.js",
      "Open Source",
      "GitHub",
    ],
    achievements: [
      "Contributed actively during February and March",
      "Worked on frontend improvements and UI refinements",
    ],
  },
]

export default function InteractiveTimeline() {
  const [selectedItem, setSelectedItem] = useState<number | null>(null)

  return (
    <div className="relative">
      {/* ── Timeline vertical line
          Mobile : flush left (left-6), so the line sits behind the dot column.
          Desktop: centred (md:left-1/2).                                        */}
      <div
        className="
          absolute left-6 top-0 h-full
          md:left-1/2
          w-[2px] -translate-x-1/2

          bg-gradient-to-b
          from-cyan-400/10
          via-cyan-300/60
          to-purple-500/10

          shadow-[0_0_25px_rgba(34,211,238,0.35)]
          rounded-full
        "
      />

      <div className="space-y-12 md:space-y-16">
        {timelineData.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.7 }}
            viewport={{ once: true }}
            className={`
              flex items-center
              /* Mobile: always left-aligned (dot on the left, card to the right) */
              flex-row
              /* Desktop: alternate sides */
              ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}
            `}
          >
            {/* ── Card
                Mobile : takes up remaining width after the dot column (pl-10 from dot).
                Desktop: occupies 5/12 with extra padding towards the centre.          */}
            <div
              className={`
                /* Mobile — full width minus the left dot column */
                w-full pl-10
                /* Desktop — half the track width */
                md:w-5/12 md:pl-0
                ${index % 2 === 0 ? "md:pr-10" : "md:pl-10"}
              `}
            >
              <motion.div
                whileHover={{ scale: 1.025 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                onClick={() =>
                  setSelectedItem(selectedItem === item.id ? null : item.id)
                }
                className="cursor-pointer"
              >
                <Card
                  className="
                    border-white/10
                    hover:border-cyan-400/20
                    bg-white/[0.03]
                    hover:shadow-[0_0_60px_rgba(34,211,238,0.16)]
                  "
                >
                  <CardContent className="p-5 md:p-7">
                    {/* Year */}
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-cyan-300 shrink-0" />
                      <span className="text-cyan-200 font-semibold tracking-wide">
                        {item.year}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg md:text-2xl font-semibold text-white mb-3 leading-snug">
                      {item.title}
                    </h3>

                    {/* Company */}
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-purple-300 shrink-0" />
                      <span className="text-white/80 text-sm md:text-base">
                        {item.company}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-4 w-4 text-emerald-300 shrink-0" />
                      <span className="text-white/50 text-sm">{item.location}</span>
                    </div>

                    {/* Description */}
                    <p className="text-white/65 leading-relaxed mb-4 text-sm md:text-base">
                      {item.description}
                    </p>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-2">
                      {item.technologies.map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="
                            border border-cyan-400/10
                            bg-cyan-400/5
                            text-cyan-100
                            backdrop-blur-md
                            hover:bg-cyan-400/10
                            transition-colors
                            text-xs
                          "
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* ── Timeline Node
                Mobile : absolute-style — sits in the fixed left-6 column.
                Desktop: in normal flow between the two half-width columns. */}
            <div
              className="
                /* Mobile: pull the dot to sit on the vertical line */
                absolute left-6 -translate-x-1/2
                /* Desktop: normal flow, reset absolute */
                md:relative md:left-auto md:translate-x-0
                z-10
              "
            >
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="
                  relative w-7 h-7 rounded-full
                  bg-[radial-gradient(circle_at_top,#67e8f9,#7c3aed)]
                  border border-cyan-300/40
                  shadow-[0_0_25px_rgba(34,211,238,0.55)]
                  before:absolute before:inset-[-8px]
                  before:rounded-full
                  before:border before:border-cyan-400/10
                "
              />
            </div>

            {/* ── Spacer (desktop only — fills the opposite half-column) */}
            <div className="hidden md:block md:w-5/12" />
          </motion.div>
        ))}
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-50
              flex items-center justify-center
              p-4
              bg-black/75 backdrop-blur-md
            "
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 18, stiffness: 180 }}
              className="w-full max-w-2xl"
            >
              <Card
                onClick={(e) => e.stopPropagation()}
                className="
                  w-full max-h-[85vh] overflow-y-auto
                  border-white/10
                  shadow-[0_0_90px_rgba(34,211,238,0.14)]
                "
              >
                <CardContent className="p-6 md:p-8">
                  {(() => {
                    const item = timelineData.find((i) => i.id === selectedItem)
                    if (!item) return null

                    return (
                      <div>
                        <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                          {item.title}
                        </h3>

                        <p className="text-white/70 leading-relaxed mb-8 text-sm md:text-base">
                          {item.description}
                        </p>

                        <h4 className="text-lg font-semibold text-cyan-300 mb-4">
                          Key Achievements
                        </h4>

                        <ul className="space-y-3 mb-8">
                          {item.achievements.map((achievement, i) => (
                            <li
                              key={i}
                              className="flex items-start text-white/70 text-sm md:text-base"
                            >
                              <span className="w-2 h-2 rounded-full bg-purple-400 mr-3 mt-1.5 shrink-0" />
                              {achievement}
                            </li>
                          ))}
                        </ul>

                        <div className="flex flex-wrap gap-2">
                          {item.technologies.map((tech) => (
                            <Badge
                              key={tech}
                              variant="secondary"
                              className="
                                border border-cyan-400/10 bg-cyan-400/5
                                text-cyan-100 text-xs
                                hover:bg-cyan-400/10
                              "
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}