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
    color2: "#78c4ff",
    ringColor: "#c86820",
    moonColor: "",
    hasMoon: false,
    visualType: 1,
    tools: ["Java", "Typescript", "JavaScript", "Python","GO"],
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
    color2: "#5de898",
    ringColor: "",
    moonColor: "#7040d0",
    hasMoon: true,
    visualType: 0,
    tools: ["FastAPI", "RESTful APIs", "gRPC", "WebRTC", "Microservices", "WebSockets","Authentication"],
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
    color2: "#c0a0ff",
    ringColor: "",
    moonColor: "",
    hasMoon: false,
    visualType: 2,
    tools: ["PostgreSQL", "Redis", "MongoDB", "GraphQL", "VectorDB", "Prisma"],
    orbitRadius: 3.4,
    orbitSpeed: 0.22,
    size: 0.40,
    tilt: -0.4,
  },
  {
    name: "DevOps & tools",
    color: "#e07b3f",
    planetColor: "#2e1508",
    atmosphereColor: "#7a3510",
    color2: "#ff9e5a",
    ringColor: "",
    moonColor: "",
    hasMoon: false,
    visualType: 3,
    tools: ["AWS", "Docker", "git", "CI/CD", "Github Actions"],
    orbitRadius: 4.0,
    orbitSpeed: 0.22,
    size: 0.44,
    tilt: 0.5,
  },
  {
    name: "Frameworks & Libraries",
    color: "#d4a017",
    planetColor: "#2a1f00",
    atmosphereColor: "#6b4f00",
    color2: "#f0c040",
    ringColor: "",
    moonColor: "",
    hasMoon: false,
    visualType: 4,
    tools: ["React",
  "Next.js",
  "React Native",
  "TypeScript",
  "Tailwind CSS",
  "Express",
  "FastAPI"],
    orbitRadius: 4.7,
    orbitSpeed: 0.22,
    size: 0.41,
    tilt: -0.6,
  },
  {
    name: "Generative AI",
    color: "#4ab8b8",
    planetColor: "#0a2020",
    atmosphereColor: "#0f4040",
    color2: "#60dede",
    ringColor: "",
    moonColor: "#204060",
    hasMoon: true,
    visualType: 5,
    tools: ["LLMs",
  "RAG",
  "Prompt Engineering",
  "LangChain",
  "NLP",
  "Vector Databases"],
    orbitRadius: 5.4,        // outermost
    orbitSpeed: 0.22,
    size: 0.38,
    tilt: 0.2,
  },
]

// ──────────────────────────────────────────────────────────────────────────────
// GLSL — Planet Surface Shader
// ──────────────────────────────────────────────────────────────────────────────

const PLANET_VERT = /* glsl */`
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vObjPos;
  void main() {
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vObjPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const PLANET_FRAG = /* glsl */`
  uniform float uTime;
  uniform vec3  uDark;
  uniform vec3  uLight;
  uniform vec3  uGlow;
  uniform float uHov;
  uniform float uType;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vObjPos;

  float hash3(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 19.19);
    return fract((p.x + p.y) * p.z);
  }
  float n3(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x), mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x), f.y),
      mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x), mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x), f.y),
      f.z);
  }
  float fbm5(vec3 p){float v=0.0,a=0.5;vec3 s=vec3(100.0);for(int i=0;i<5;i++){v+=a*n3(p);p=p*2.1+s;a*=0.48;}return v;}
  float fbm4(vec3 p){float v=0.0,a=0.5;vec3 s=vec3(100.0);for(int i=0;i<4;i++){v+=a*n3(p);p=p*2.1+s;a*=0.48;}return v;}
  float fbm3(vec3 p){float v=0.0,a=0.5;vec3 s=vec3(100.0);for(int i=0;i<3;i++){v+=a*n3(p);p=p*2.1+s;a*=0.48;}return v;}

  vec3 pRockyGreen(vec3 p) {
    float t  = fbm5(p * 4.2);
    float cr = fbm3(p * 9.0 + vec3(5.7, 3.1, 2.4));
    vec3 c   = mix(uDark, mix(uDark, uLight, 0.5), smoothstep(0.28, 0.55, t));
    c        = mix(c, uLight, smoothstep(0.55, 0.80, t));
    c        = mix(c, uDark * 0.28, smoothstep(0.73, 0.84, cr) * 0.65);
    c       += uLight * 0.15 * smoothstep(0.78, 0.92, t);
    return c;
  }
  vec3 pOcean(vec3 p) {
    float t   = fbm5(p * 2.8);
    float cl  = fbm4(p * 5.0 + vec3(uTime * 0.018, 0.0, uTime * 0.013));
    vec3 deep = uDark;
    vec3 mid  = mix(uDark, uLight, 0.38);
    vec3 land = mix(vec3(0.09,0.19,0.04), vec3(0.14,0.26,0.07), t);
    vec3 c    = mix(deep, mid, smoothstep(0.36, 0.52, t));
    c         = mix(c, land, smoothstep(0.54, 0.68, t));
    c         = mix(c, vec3(0.88, 0.93, 1.0), smoothstep(0.62, 0.78, cl) * 0.68);
    return c;
  }
  vec3 pCrystal(vec3 p) {
    float t  = fbm5(p * 5.0);
    float f2 = fbm3(p * 10.5 + vec3(1.7, 4.2, 3.1));
    float f3 = fbm3(p * 15.0 + vec3(7.3, 2.1, 5.8));
    vec3 c   = mix(uDark, uLight, t * 0.65);
    c       += uLight * smoothstep(0.66, 0.88, f2) * 0.58;
    c       += vec3(1.0) * smoothstep(0.80, 0.96, f3) * 0.22;
    return c;
  }
  vec3 pGasOrange(vec3 p) {
    float b1 = sin(p.y * 20.0 + fbm4(p * 2.0) * 3.5 + uTime * 0.05) * 0.5 + 0.5;
    float b2 = sin(p.y * 12.0 - fbm3(p * 3.0 + vec3(1.0)) * 2.5 + uTime * 0.03) * 0.5 + 0.5;
    float st = fbm4(p * 6.5 + vec3(0.0, 0.0, uTime * 0.01));
    vec3 c   = mix(uDark, uLight, b1 * 0.68);
    c        = mix(c, mix(uDark, uLight * 1.3, 0.4), b2 * 0.38);
    c        = mix(c, uLight * 1.55, smoothstep(0.72, 0.87, st) * 0.52);
    return c;
  }
  vec3 pLava(vec3 p) {
    float rock = fbm5(p * 4.0);
    float cr   = 1.0 - fbm4(p * 7.0 + vec3(3.3, 1.8, 2.7));
    vec3 c     = mix(uDark * 0.60, uDark, rock);
    c          = mix(c, uLight * 1.9, smoothstep(0.58, 0.74, cr) * 0.80);
    c         += uLight * smoothstep(0.80, 0.96, cr) * 2.4;
    return c;
  }
  vec3 pGasTeal(vec3 p) {
    float b1 = sin(p.y * 16.0 + fbm4(p * 2.5) * 3.0 + uTime * 0.028) * 0.5 + 0.5;
    float sw = fbm4(p * 4.5 + vec3(uTime * 0.016, 0.0, uTime * 0.011));
    vec3 c   = mix(uDark, uLight, b1 * 0.58);
    c        = mix(c, uLight * 1.40, sw * smoothstep(0.54, 0.80, b1) * 0.44);
    return c;
  }

  void main() {
    vec3 np = normalize(vObjPos);
    vec3 surf;
    if      (uType < 0.5) surf = pRockyGreen(np);
    else if (uType < 1.5) surf = pOcean(np);
    else if (uType < 2.5) surf = pCrystal(np);
    else if (uType < 3.5) surf = pGasOrange(np);
    else if (uType < 4.5) surf = pLava(np);
    else                  surf = pGasTeal(np);

    vec3 N  = normalize(vWorldNormal);
    vec3 L  = normalize(vec3(0.73, 0.55, 0.37));
    vec3 V  = normalize(cameraPosition - vWorldPos);
    vec3 H  = normalize(L + V);
    float NdL    = dot(N, L);
    float diff   = max(0.0, NdL);
    float shadow = smoothstep(-0.30, 0.38, NdL);
    float amb    = 0.10;
    float spow = (uType < 0.5 || uType > 3.5) ? 10.0 : 28.0;
    float sstr = (uType < 0.5 || uType > 3.5) ? 0.10 : 0.24;
    float spec = pow(max(0.0, dot(N, H)), spow) * sstr;
    float fres = pow(1.0 - max(0.0, dot(N, V)), 2.6);
    float lavaEmit = 0.0;
    if (uType > 3.5 && uType < 4.5) {
      float cr = 1.0 - fbm4(np * 7.0 + vec3(3.3, 1.8, 2.7));
      lavaEmit = smoothstep(0.75, 0.92, cr) * 0.58;
    }
    vec3 col = surf * (amb + diff * shadow * 0.90);
    col += vec3(0.86, 0.92, 1.0) * spec;
    col += uGlow * fres * (0.28 + uHov * 0.42);
    col += surf * lavaEmit;
    col *= 1.0 + uHov * 0.13;
    gl_FragColor = vec4(clamp(col, 0.0, 3.0), 1.0);
  }
`

const ATMO_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ATMO_FRAG = /* glsl */`
  uniform vec3  uGlow;
  uniform float uHov;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 V    = normalize(cameraPosition - vWorldPos);
    float rim = 1.0 - max(0.0, dot(normalize(-vNormal), V));
    rim = pow(rim, 1.65);
    float pulse = 1.0 + sin(uTime * 1.3) * 0.07 * uHov;
    float alpha = rim * (0.30 + uHov * 0.30) * pulse;
    gl_FragColor = vec4(uGlow * (1.1 + uHov * 0.40), alpha);
  }
`

// ─── Procedural Planet Material ────────────────────────────────────────────────
function PlanetMaterial({
  colDark, colLight, colGlow, isHovered, pType,
}: {
  colDark: string; colLight: string; colGlow: string; isHovered: boolean; pType: number
}) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime:  { value: 0 },
      uDark:  { value: new THREE.Color(colDark) },
      uLight: { value: new THREE.Color(colLight) },
      uGlow:  { value: new THREE.Color(colGlow) },
      uHov:   { value: 0 },
      uType:  { value: pType },
    },
    vertexShader:   PLANET_VERT,
    fragmentShader: PLANET_FRAG,
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uHov.value  = THREE.MathUtils.lerp(
      mat.uniforms.uHov.value,
      isHovered ? 1.0 : 0.0,
      0.07
    )
  })

  return <primitive object={mat} attach="material" />
}

// ─── Atmosphere Glow Ring ──────────────────────────────────────────────────────
function AtmosphereGlow({ size, color, isHovered }: { size: number; color: string; isHovered: boolean }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uGlow: { value: new THREE.Color(color) },
      uHov:  { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader:   ATMO_VERT,
    fragmentShader: ATMO_FRAG,
    transparent:    true,
    side:           THREE.BackSide,
    blending:       THREE.AdditiveBlending,
    depthWrite:     false,
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uHov.value  = THREE.MathUtils.lerp(
      mat.uniforms.uHov.value,
      isHovered ? 1.0 : 0.0,
      0.07
    )
  })

  return (
    <mesh scale={[1.30, 1.30, 1.30]}>
      <sphereGeometry args={[size, 32, 32]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ─── Planet Rings (Saturn-like, Languages planet) ──────────────────────────────
function PlanetRings({ size, color }: { size: number; color: string }) {
  return (
    <group rotation={[Math.PI * 0.23, 0.0, Math.PI * 0.07]}>
      <mesh>
        <ringGeometry args={[size * 1.55, size * 2.05, 80]} />
        <meshBasicMaterial color={color} transparent opacity={0.48} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <ringGeometry args={[size * 2.12, size * 2.65, 80]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <ringGeometry args={[size * 2.68, size * 3.10, 80]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── Orbiting Moon (Backend → purple, Architecture → dark blue) ────────────────
function Moon({ parentSize, moonColor }: { parentSize: number; moonColor: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const angleRef = useRef(Math.PI * 0.75)
  const moonSize = parentSize * 0.22
  const orbitR   = parentSize * 2.85

  useFrame((_, delta) => {
    angleRef.current += delta * 1.15
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * orbitR
      groupRef.current.position.y = Math.sin(angleRef.current) * orbitR * 0.18
      groupRef.current.position.z = Math.sin(angleRef.current) * orbitR
    }
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[moonSize, 20, 20]} />
        <meshStandardMaterial
          color={moonColor}
          emissive={moonColor}
          emissiveIntensity={0.22}
          roughness={0.85}
          metalness={0.10}
        />
      </mesh>
      <mesh scale={[1.5, 1.5, 1.5]}>
        <sphereGeometry args={[moonSize, 12, 12]} />
        <meshBasicMaterial color={moonColor} transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
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
        <sphereGeometry args={[skill.size, 80, 80]} />
        <PlanetMaterial
          colDark={skill.planetColor}
          colLight={skill.color2}
          colGlow={skill.color}
          isHovered={isHovered}
          pType={skill.visualType}
        />
      </mesh>

      {/* Atmosphere glow */}
      <AtmosphereGlow size={skill.size} color={skill.color} isHovered={isHovered} />

      {/* Saturn-like rings (Languages planet only) */}
      {skill.visualType === 1 && skill.ringColor && (
        <PlanetRings size={skill.size} color={skill.ringColor} />
      )}

      {/* Orbiting moon (Backend + Architecture) */}
      {skill.hasMoon && skill.moonColor && (
        <Moon parentSize={skill.size} moonColor={skill.moonColor} />
      )}

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
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.055 + Math.sin(state.clock.elapsedTime * 0.4) * 0.018
    }
  })

  return (
    <group rotation={[Math.PI * 0.28, 0, 0]}>
      <mesh ref={ringRef}>
        <torusGeometry args={[3.4, 0.005, 8, 140]} />
        <meshBasicMaterial color="#9b6bff" transparent opacity={0.06} />
      </mesh>
      {skillsData.map((s) => (
        <mesh key={s.name}>
          <torusGeometry args={[s.orbitRadius, 0.003, 6, 140]} />
          <meshBasicMaterial color={s.color} transparent opacity={0.04} />
        </mesh>
      ))}
    </group>
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
          <Card>
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
                mind stack
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