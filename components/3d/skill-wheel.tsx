"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text, OrbitControls, Environment, Html, PresentationControls, Stars, Sparkles } from "@react-three/drei"
import { motion, AnimatePresence } from "framer-motion"
import * as THREE from "three"
import { Card, CardContent } from "@/components/ui/card"

const skillsData = [
  { name: "React", category: "Frontend", level: 95, color: "#00E5FF", description: "Advanced React development with hooks, context, and performance optimization" },
  { name: "Node.js", category: "Backend", level: 90, color: "#00FF7F", description: "Server-side JavaScript with Express, APIs, and microservices architecture" },
  { name: "TypeScript", category: "Frontend", level: 88, color: "#3178C6", description: "Type-safe JavaScript development with advanced TypeScript patterns" },
  { name: "Python", category: "AI/ML", level: 85, color: "#FFD600", description: "Machine learning, data analysis, and backend development with Python" },
  { name: "AWS", category: "Cloud", level: 82, color: "#FF9900", description: "Cloud infrastructure, serverless computing, and DevOps on AWS" },
  { name: "Docker", category: "DevOps", level: 80, color: "#03A9F4", description: "Containerization, orchestration, and deployment automation" },
  { name: "Three.js", category: "Frontend", level: 75, color: "#FFFFFF", description: "3D graphics, WebGL, and immersive web experiences" },
  { name: "GraphQL", category: "Backend", level: 78, color: "#FF1493", description: "API design, schema definition, and efficient data fetching" },
]

// Skill Orb Component
function SkillOrb({ skill, position, onHover, isHovered }: any) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      // Base Rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2
      // Pulsate Scale
      const baseScale = (skill.level / 100) * 0.6 + 0.2
      const pulseFactor = isHovered ? 1.1 + Math.sin(state.clock.elapsedTime * 4) * 0.08 : 1
      meshRef.current.scale.setScalar(baseScale * pulseFactor)
    }
  })

  // Basic Size for labels/positioning
  const size = (skill.level / 100) * 0.6 + 0.2

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={() => {}}
        onPointerOver={(e) => { e.stopPropagation(); onHover(skill); document.body.style.cursor = "pointer" }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = "auto" }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={skill.color}
          emissive={skill.color}
          emissiveIntensity={isHovered ? 1.5 : 0.6}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Label always visible */}
      <Text position={[0, -size - 0.4, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
        {skill.name}
      </Text>
      <Text position={[0, -size - 0.6, 0]} fontSize={0.12} color="#888" anchorX="center" anchorY="middle">
        {skill.level}%
      </Text>

      {/* Hover Card using Html overlay, direct visual connection */}
      <Html position={[size + 0.1, 0, 0]} distanceFactor={6} style={{ pointerEvents: "none" }}>
        <AnimatePresence mode="wait">
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="glass-morphism rounded-lg p-3 w-[200px] border border-white/10"
              style={{
                boxShadow: `0 0 15px 1px ${skill.color}20`,
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))",
              }}
            >
              <h3 className="text-lg font-bold text-white mb-1">{skill.name}</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white">{skill.category}</span>
                <span className="text-white/80 text-sm font-semibold">{skill.level}%</span>
              </div>
              <p className="text-white/70 text-xs line-clamp-3 leading-relaxed">{skill.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Html>
    </group>
  )
}

// Optimization Fallback
function FallbackSkillsGrid({ skills }: any) {
  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {skills.map((skill: any) => (
        <motion.div key={skill.name} whileHover={{ scale: 1.05 }} className="cursor-pointer">
          <Card className="glass-morphism border-white/20 hover:border-cyan-400/50 transition-all duration-300">
            <CardContent className="p-4 text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: skill.color + "20", color: skill.color }}
              >
                {skill.level}%
              </div>
              <h3 className="text-white font-semibold mb-1">{skill.name}</h3>
              <p className="text-white/60 text-sm">{skill.category}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// Main Skill Wheel Component
export default function SkillWheelV2() {
  const [hoveredSkill, setHoveredSkill] = useState<any>(null)
  const [webglSupported, setWebglSupported] = useState(true)

  // Calculate dynamic positions
  const orbPositions = useMemo(() => {
    const radius = 3.2
    return skillsData.map((_, i) => {
      const angle = (i / skillsData.length) * Math.PI * 2
      return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
    })
  }, [])

  useEffect(() => {
    // Basic WebGL support check
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      if (!gl) setWebglSupported(false)
    } catch (e) {
      setWebglSupported(false)
    }
  }, [])

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {webglSupported ? (
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 2]}
        >
          {/* Increased lighting for dynamic color visibility */}
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#FFD600" />
          <Environment preset="city" blur={0.5} />

          {/* Drei Built-in Background Effects */}
          <Stars radius={50} depth={50} count={2500} factor={4} saturation={0} fade speed={1.5} />
          <Sparkles count={150} scale={15} size={2} speed={0.4} opacity={0.3} color="#00E5FF" />

          {/* Presentational Controls for immersive feel */}
          <PresentationControls global rotation={[0, 0, 0]} polar={[-Math.PI / 10, Math.PI / 10]} azimuth={[-Math.PI / 10, Math.PI / 10]}>
            <group>
              {skillsData.map((skill, index) => (
                <SkillOrb
                  key={skill.name}
                  skill={skill}
                  position={orbPositions[index]}
                  onHover={setHoveredSkill}
                  isHovered={hoveredSkill?.name === skill.name}
                />
              ))}

              {/* Central Core Element */}
              <mesh>
                <sphereGeometry args={[1, 64, 64]} />
                <meshPhongMaterial color="#000000" emissive="#ffffff" emissiveIntensity={0.05} reflectivity={1} />
                <Html distanceFactor={10}>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white tracking-widest">SKILLS</h2>
                    <p className="text-white/60 text-sm">Technology Ecosystem</p>
                  </div>
                </Html>
              </mesh>
            </group>
          </PresentationControls>

          <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} maxDistance={10} minDistance={4} />
        </Canvas>
      ) : (
        <FallbackSkillsGrid skills={skillsData} />
      )}
    </div>
  )
}