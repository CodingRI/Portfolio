"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text, Stars, Html, OrbitControls } from "@react-three/drei"
import { motion, AnimatePresence } from "framer-motion"
import * as THREE from "three"
import { Card, CardContent } from "@/components/ui/card"

// ─── Skill Data with real tools ───────────────────────────────────────────────
// Each planet has its OWN orbit ring — staggered radii prevent any collision
const skillsData = [
  {
    name: "Languages",
    color: "#4a9eff",
    planetColor: "#1a3a5c",
    atmosphereColor: "#1e4080",
    tools: ["Python", "SQL", "JavaScript / Node.js"],
    orbitRadius: 2.2,        // innermost
    orbitSpeed: 0.22,        // same speed for all — no catching up
    size: 0.38,
    tilt: 0.3,
  },
  {
    name: "Backend",
    color: "#3dba7a",
    planetColor: "#0f2e1a",
    atmosphereColor: "#1a5c30",
    tools: ["FastAPI", "RESTful APIs", "gRPC", "Protocol Buffers", "Microservices"],
    orbitRadius: 2.8,
    orbitSpeed: 0.22,
    size: 0.42,
    tilt: 0.6,
  },
  {
    name: "Databases",
    color: "#9b6bff",
    planetColor: "#1a0f35",
    atmosphereColor: "#3d1a80",
    tools: ["PostgreSQL", "BigQuery", "Firestore", "Elasticsearch", "Redis"],
    orbitRadius: 3.4,
    orbitSpeed: 0.22,
    size: 0.40,
    tilt: -0.4,
  },
  {
    name: "Cloud & DevOps",
    color: "#e07b3f",
    planetColor: "#2e1508",
    atmosphereColor: "#7a3510",
    tools: ["AWS (MWAA, ECS, S3, EC2)", "GCP (Cloud Run)", "Docker", "Terraform", "CI/CD"],
    orbitRadius: 4.0,
    orbitSpeed: 0.22,
    size: 0.44,
    tilt: 0.5,
  },
  {
    name: "Data & Orchestration",
    color: "#d4a017",
    planetColor: "#2a1f00",
    atmosphereColor: "#6b4f00",
    tools: ["Apache Airflow", "ETL Pipelines", "Knowledge Graphs", "Process Mining"],
    orbitRadius: 4.7,
    orbitSpeed: 0.22,
    size: 0.41,
    tilt: -0.6,
  },
  {
    name: "Architecture",
    color: "#4ab8b8",
    planetColor: "#0a2020",
    atmosphereColor: "#0f4040",
    tools: ["Distributed Systems", "SAGA Pattern", "System Design", "JIRA", "QGIS"],
    orbitRadius: 5.4,        // outermost
    orbitSpeed: 0.22,
    size: 0.38,
    tilt: 0.2,
  },
]

// ─── Procedural Planet Material ────────────────────────────────────────────────
function PlanetMaterial({ baseColor, emitColor, isHovered }: {
  baseColor: string
  emitColor: string
  isHovered: boolean
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = isHovered
        ? 0.35 + Math.sin(state.clock.elapsedTime * 3) * 0.1
        : 0.08
    }
  })

  return (
    <meshStandardMaterial
      ref={matRef}
      color={baseColor}
      emissive={emitColor}
      emissiveIntensity={0.08}
      roughness={0.82}
      metalness={0.05}
    />
  )
}

// ─── Atmosphere Glow Ring ──────────────────────────────────────────────────────
function AtmosphereGlow({ size, color, isHovered }: { size: number; color: string; isHovered: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = isHovered
        ? 0.18 + Math.sin(state.clock.elapsedTime * 2.5) * 0.06
        : 0.06
    }
  })

  return (
    <mesh ref={ringRef}>
      <sphereGeometry args={[size * 1.22, 24, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.06} side={THREE.BackSide} />
    </mesh>
  )
}

// ─── Single Orbiting Planet ─────────────────────────────────────────────────────
function OrbitingPlanet({
  skill,
  angleOffset,
  onHover,
  isHovered,
}: {
  skill: typeof skillsData[0]
  angleOffset: number
  onHover: (s: typeof skillsData[0] | null) => void
  isHovered: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const planetRef = useRef<THREE.Mesh>(null)
  const angleRef = useRef(angleOffset)

  useFrame((_, delta) => {
    // Circular orbit — all at same speed, angle offset keeps them apart
    angleRef.current += delta * skill.orbitSpeed

    if (groupRef.current) {
      // True circle in XZ plane, then tilt the whole system via camera
      groupRef.current.position.x = Math.cos(angleRef.current) * skill.orbitRadius
      groupRef.current.position.z = Math.sin(angleRef.current) * skill.orbitRadius
      groupRef.current.position.y = 0
    }

    // Gentle self-rotation
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.35
      planetRef.current.rotation.x = skill.tilt * 0.2
    }
  })

  return (
    <group ref={groupRef}>
      {/* Planet body */}
      <mesh
        ref={planetRef}
        onPointerOver={(e) => { e.stopPropagation(); onHover(skill); document.body.style.cursor = "pointer" }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = "auto" }}
      >
        <sphereGeometry args={[skill.size, 48, 48]} />
        <PlanetMaterial
          baseColor={skill.planetColor}
          emitColor={skill.color}
          isHovered={isHovered}
        />
      </mesh>

      {/* Atmosphere glow */}
      <AtmosphereGlow size={skill.size} color={skill.atmosphereColor} isHovered={isHovered} />

      {/* Planet label */}
      <Text
        position={[0, -skill.size - 0.28, 0]}
        fontSize={0.16}
        color={isHovered ? skill.color : "rgba(255,255,255,0.7)"}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {skill.name}
      </Text>
    </group>
  )
}

// ─── Orbit Ring (drawn as torus) ───────────────────────────────────────────────
function OrbitRing() {
  return (
    <mesh rotation={[Math.PI * 0.28, 0, 0]}>
      <torusGeometry args={[3.4, 0.004, 8, 120]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.07} />
    </mesh>
  )
}

// ─── Central Black Hole ─────────────────────────────────────────────────────────
function BlackHoleCore() {
  const ringRef = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ringRef.current) ringRef.current.rotation.z = state.clock.elapsedTime * 0.3
    if (ring2Ref.current) ring2Ref.current.rotation.z = -state.clock.elapsedTime * 0.18
  })

  return (
    <group>
      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[0.52, 64, 64]} />
        <meshStandardMaterial color="#000000" roughness={1} metalness={0} />
      </mesh>

      {/* Accretion disc ring 1 */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.8, 0.2, 0]}>
        <torusGeometry args={[0.82, 0.06, 6, 60]} />
        <meshBasicMaterial color="#ff6a00" transparent opacity={0.55} />
      </mesh>

      {/* Accretion disc ring 2 — wider, dimmer */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 2.5, -0.3, 0]}>
        <torusGeometry args={[1.05, 0.03, 6, 60]} />
        <meshBasicMaterial color="#ffaa40" transparent opacity={0.3} />
      </mesh>

      {/* Subtle glow halo */}
      <mesh>
        <sphereGeometry args={[0.75, 24, 24]} />
        <meshBasicMaterial color="#220800" transparent opacity={0.45} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

// ─── Hover Info Overlay (2D DOM card) ─────────────────────────────────────────
function HoverCard({ skill }: { skill: typeof skillsData[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 w-[320px] z-20"
      style={{ filter: `drop-shadow(0 0 18px ${skill.color}55)` }}
    >
      <div
        className="rounded-xl p-4 border"
        style={{
          background: "rgba(8, 10, 18, 0.88)",
          backdropFilter: "blur(14px)",
          borderColor: `${skill.color}55`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: skill.color, boxShadow: `0 0 6px ${skill.color}` }}
          />
          <span className="text-base font-semibold" style={{ color: skill.color }}>
            {skill.name}
          </span>
        </div>

        {/* Divider */}
        <div className="w-full h-px mb-3" style={{ background: `${skill.color}30` }} />

        {/* Tool pills */}
        <div className="flex flex-wrap gap-2">
          {skill.tools.map((tool) => (
            <span
              key={tool}
              className="text-xs px-2 py-1 rounded-md font-mono"
              style={{
                background: `${skill.color}12`,
                border: `1px solid ${skill.color}35`,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              • {tool}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Fallback 2D grid ──────────────────────────────────────────────────────────
function FallbackSkillsGrid({ skills }: { skills: typeof skillsData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
      {skills.map((skill) => (
        <motion.div key={skill.name} whileHover={{ scale: 1.04 }}>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: skill.color }} />
                <span className="font-semibold text-sm" style={{ color: skill.color }}>{skill.name}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {skill.tools.map((t) => (
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/70 border border-white/10">
                    {t}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Solar System Scene ─────────────────────────────────────────────────────────
function SolarSystem({ onHover, hoveredSkill }: {
  onHover: (s: typeof skillsData[0] | null) => void
  hoveredSkill: typeof skillsData[0] | null
}) {
  // Evenly distribute starting angles so planets don't bunch up
  const startAngles = useMemo(
    () => skillsData.map((_, i) => (i / skillsData.length) * Math.PI * 2),
    []
  )

  return (
    <group>
      <BlackHoleCore />
      <OrbitRing />
      {skillsData.map((skill, i) => (
        <OrbitingPlanet
          key={skill.name}
          skill={skill}
          angleOffset={startAngles[i]}
          onHover={onHover}
          isHovered={hoveredSkill?.name === skill.name}
        />
      ))}
    </group>
  )
}

// ─── Main Export ────────────────────────────────────────────────────────────────
export default function SkillWheel() {
  const [hoveredSkill, setHoveredSkill] = useState<typeof skillsData[0] | null>(null)
  const [webglSupported, setWebglSupported] = useState(true)

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      if (!gl) setWebglSupported(false)
    } catch {
      setWebglSupported(false)
    }
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#02040a" }}>
      {webglSupported ? (
        <>
          <Canvas
            camera={{ position: [0, 0, 9], fov: 55 }}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            dpr={[1, 1.8]}
          >
            {/* Dim, directional lighting — lets planet colors show without over-brightening */}
            <ambientLight intensity={0.18} />
            <pointLight position={[0, 0, 0]} intensity={0.6} color="#ff8030" decay={1.5} />
            <directionalLight position={[8, 6, 4]} intensity={0.55} color="#c0d0ff" />
            <directionalLight position={[-6, -4, -2]} intensity={0.2} color="#102040" />

            {/* Star field */}
            <Stars radius={80} depth={60} count={3500} factor={3} saturation={0} fade speed={0.6} />

            <SolarSystem onHover={setHoveredSkill} hoveredSkill={hoveredSkill} />

            {/* Allow gentle manual orbit with mouse */}
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={true}
              rotateSpeed={0.35}
              autoRotate={false}
            />
          </Canvas>

          {/* Center label — pure DOM, perfectly centered */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center select-none" style={{ marginTop: "-2px" }}>
              <p className="text-[11px] tracking-[0.4em] uppercase text-white/55 font-mono">
                tech stack
              </p>
            </div>
          </div>

          {/* Hover card — anchored bottom-center of the canvas */}
          <AnimatePresence mode="wait">
            {hoveredSkill && <HoverCard key={hoveredSkill.name} skill={hoveredSkill} />}
          </AnimatePresence>
        </>
      ) : (
        <FallbackSkillsGrid skills={skillsData} />
      )}
    </div>
  )
}