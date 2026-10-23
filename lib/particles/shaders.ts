import * as THREE from "three"

/** Compact glyph atlas: two 64x64 cells, "0" then "1". Sampled in the fragment shader (no per-frame text work). */
export function createGlyphAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext("2d")!
  ctx.clearRect(0, 0, 128, 64)
  ctx.fillStyle = "#fff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = "700 52px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
  ctx.fillText("0", 32, 34)
  ctx.fillText("1", 96, 34)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = true
  tex.colorSpace = THREE.NoColorSpace
  return tex
}

/** `position` holds the portrait target (x, y, depth); `aText` the wordmark target.
 *  DELAY_SPREAD must match particle-simulation.ts. */
export const portraitVertex = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uSp;        // px per portrait-height unit
  uniform float uSt;        // px per wordmark-width unit
  uniform vec2  uCenter;    // stage centre in canvas-centred px (y up)
  uniform vec2  uPointer;   // stage-local px
  uniform float uPointerAct;
  uniform float uRadius;
  uniform float uPR;
  uniform float uIntro;
  uniform vec3  uTextA;
  uniform vec3  uTextB;

  attribute vec2 aText;
  attribute vec4 aRand;     // delay, size jitter, phase, glyph seed
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute vec3 aDyn;      // offset.xy, binary amount

  varying vec3  vColor;
  varying float vAlpha;
  varying float vBin;
  varying float vGlyph;

  const float DELAY_SPREAD = 0.38;

  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    float tl = clamp((uMorph - aRand.x * DELAY_SPREAD) / (1.0 - DELAY_SPREAD), 0.0, 1.0);
    float e = easeInOutCubic(tl);
    float transit = sin(3.14159265 * e);

    vec2 p = position.xy * uSp;
    vec2 q = aText * uSt;
    vec2 pos = mix(p, q, e);

    // Slightly organic trajectory: a bounded sideways bulge perpendicular to the travel direction.
    vec2 dir = q - p;
    float len = length(dir) + 1e-3;
    vec2 nrm = vec2(-dir.y, dir.x) / len;
    float side = (aRand.z * 2.0 - 1.0);
    pos += nrm * side * 0.16 * len * transit;
    pos += vec2(sin(uTime * 1.3 + aRand.z * 40.0), cos(uTime * 1.1 + aRand.w * 40.0)) * 3.0 * transit;

    // Calm "breathing" at rest.
    float rest = 1.0 - transit;
    pos += vec2(sin(uTime * 0.55 + aRand.z * 6.2831), cos(uTime * 0.47 + aRand.w * 6.2831)) * 0.0011 * uSp * rest;

    // Pointer ripple: a flowing wave radiating from the cursor, localised by a smooth falloff.
    vec2 rel = pos - uPointer;
    float d = length(rel);
    float f = pow(max(1.0 - d / uRadius, 0.0), 2.0) * uPointerAct;
    pos += rel / (d + 1e-3) * sin(d * 0.12 - uTime * 6.0 + aRand.z * 2.0) * 0.0055 * uSp * f;

    pos += aDyn.xy;
    pos += uCenter;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);

    float bin = aDyn.z;
    float depth = mix(position.z, 0.0, e);
    float unit = uSp / 640.0;
    float dotSize = (1.5 + aRand.y * 1.5) * (1.0 + depth * 0.35) * (1.0 + 0.3 * transit);
    float dotPx = max(dotSize * unit, 1.2);
    float glyphPx = max(9.5 * unit, 7.5);
    gl_PointSize = mix(dotPx, glyphPx, bin) * uPR * uIntro;

    // Colour: portrait palette -> wordmark gradient as the morph completes.
    vec3 textCol = mix(uTextA, uTextB, clamp(aText.x + 0.5, 0.0, 1.0));
    vColor = mix(aColor, textCol, e);
    vColor = mix(vColor, vec3(0.93, 0.9, 1.0), bin * 0.45);
    float twinkle = 0.88 + 0.12 * sin(uTime * 1.7 + aRand.w * 30.0);
    vAlpha = mix(aAlpha, 0.96, e) * twinkle * uIntro * (1.0 + 0.25 * bin);
    vBin = bin;
    // Glyph flickers between 0 and 1 slowly, per particle.
    vGlyph = step(0.5, fract(sin(aRand.w * 127.1 + floor(uTime * 2.4 + aRand.z * 9.0) * 3.7) * 43758.5453));
  }
`

export const portraitFragment = /* glsl */ `
  uniform sampler2D uAtlas;
  varying vec3  vColor;
  varying float vAlpha;
  varying float vBin;
  varying float vGlyph;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float dotA = smoothstep(0.5, 0.2, r);

    vec2 uv = vec2((gl_PointCoord.x + vGlyph) * 0.5, 1.0 - gl_PointCoord.y);
    float glyphA = texture2D(uAtlas, uv).a;

    float a = mix(dotA, glyphA, smoothstep(0.12, 0.7, vBin));
    if (a < 0.01) discard;
    // Restrained glow: a faint brightening at the core of dots only.
    float core = smoothstep(0.38, 0.0, r) * (1.0 - vBin);
    vec3 col = vColor * (1.0 + 0.3 * core);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`

export const starsVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2  uView;      // canvas size px
  uniform vec2  uParallax;  // px offset from pointer
  uniform float uPR;
  uniform float uIntro;
  attribute vec4 aStar;     // x01, y01, size, seed
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float depth = 0.3 + aStar.z * 0.7;
    vec2 p = (aStar.xy - 0.5) * uView;
    // Very slow upward drift, wrapped within the view.
    float drift = uTime * (2.0 + 6.0 * depth);
    p.y = mod(p.y + uView.y * 0.5 + drift, uView.y) - uView.y * 0.5;
    p += uParallax * depth;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
    gl_PointSize = (0.8 + aStar.z * 1.4) * uPR;
    float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aStar.w) + aStar.w * 50.0);
    vAlpha = (0.12 + 0.38 * depth) * tw * uIntro;
    vColor = aColor;
  }
`

export const starsFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, r);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`

/**
 * Living Particle Conduits:
 * Streams glowing, organic particles from the digital sculpture to the 6 navigation items.
 */
export const conduitVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPR;
  uniform float uIntro;
  uniform vec2  uOrigins[6];
  uniform vec2  uTargets[6];
  uniform float uActive[6];
  uniform float uVisible;

  attribute vec4 aConduit; // x: streamIndex (0..5), y: phase (0..1), z: seed (0..1), w: lateral spread (0..1)
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    int idx = int(aConduit.x + 0.5);
    idx = clamp(idx, 0, 5);

    vec2 p0 = uOrigins[idx];
    vec2 p3 = uTargets[idx];
    float activeVal = uActive[idx];

    // Flow speed surges when hovered
    float speed = 0.22 + 0.18 * activeVal + aConduit.w * 0.06;
    float t = fract(uTime * speed + aConduit.y);

    // Smooth cubic Bezier interpolation
    float dx = p3.x - p0.x;
    vec2 p1 = vec2(p0.x + dx * 0.48, p0.y);
    vec2 p2 = vec2(p3.x - dx * 0.38, p3.y);

    float omt = 1.0 - t;
    vec2 pos = omt * omt * omt * p0 + 3.0 * omt * omt * t * p1 + 3.0 * omt * t * t * p2 + t * t * t * p3;

    // Organic perpendicular flutter (sine envelope that pinches at endpoints)
    vec2 tangent = normalize((3.0 * omt * omt * (p1 - p0) + 6.0 * omt * t * (p2 - p1) + 3.0 * t * t * (p3 - p2)) + vec2(1e-4, 0.0));
    vec2 normal = vec2(-tangent.y, tangent.x);

    float wave = sin(t * 14.0 - uTime * 7.0 + aConduit.z * 6.28) * sin(3.14159 * t);
    float lateralSpread = (1.2 + 3.8 * aConduit.w) * (1.0 + 0.6 * activeVal);
    pos += normal * wave * lateralSpread;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);

    // Particle size along the conduit
    float baseSize = mix(2.6, 1.8, t) * (1.0 + 1.2 * activeVal);
    gl_PointSize = max(baseSize * uPR * uIntro * uVisible, 0.0);

    // Color gradient: deep violet at avatar -> vibrant magenta -> radiant lavender/white at nav item
    vec3 colOrigin = vec3(0.55, 0.37, 0.82); // purple #8c6fd0
    vec3 colMid    = vec3(0.86, 0.35, 0.68); // magenta #dc5aae
    vec3 colDest   = vec3(0.95, 0.92, 1.0);  // lavender-white

    vec3 col = mix(mix(colOrigin, colMid, smoothstep(0.0, 0.5, t)), colDest, smoothstep(0.5, 1.0, t));
    if (activeVal > 0.05) {
      col = mix(col, vec3(1.0, 0.85, 0.95), activeVal * 0.65);
    }

    vColor = col;
    // Bell curve alpha envelope (fades smoothly in near avatar, fades gently out near destination node)
    float alphaT = sin(3.14159 * t);
    vAlpha = alphaT * (0.35 + 0.65 * activeVal) * uIntro * uVisible;
  }
`

export const conduitFragment = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, r);
    if (a < 0.01) discard;
    float core = smoothstep(0.35, 0.0, r);
    vec3 col = vColor * (1.0 + 0.45 * core);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`
