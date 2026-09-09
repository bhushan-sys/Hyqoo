import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Prevent TanStack DevTools "data-tsd-source" JSX attribute from breaking R3F property reconciler
if (typeof window !== "undefined") {
  for (const proto of [
    THREE.Object3D.prototype,
    THREE.Material.prototype,
    THREE.BufferGeometry.prototype,
  ]) {
    if (!Object.prototype.hasOwnProperty.call(proto, "data")) {
      Object.defineProperty(proto, "data", {
        get() {
          return (this as any)._data || ((this as any)._data = {});
        },
        set(v) {
          (this as any)._data = v;
        },
        configurable: true,
      });
    }
  }
}

/* ─────────────────────────── Configuration ─────────────────────────── */
const GLOBE_RADIUS = 2.1;
const ASSEMBLY_DURATION = 2.2; // seconds to coalesce

/* ────────────────────── Globe Shaders (Brand Colors) ────────────────── */
const globeVertexShader = /* glsl */ `
  #define GLOBE_RADIUS 2.1

  uniform float uProgress;
  uniform float uTime;
  uniform vec3 uMousePos;
  uniform float uMouseActive;
  uniform float uHoverExpansion;
  uniform float uClickWave;
  uniform float uWaveStrength;

  attribute vec3 aRandomPos;
  attribute float aScale;
  attribute float aType; // 0 = surface dot, 1 = orbit dot (gold), 2 = meridian/lat dot, 3 = talent hub (gold)
  attribute float aPhase;

  varying float vAlpha;
  varying vec3 vWorldPos;
  varying float vHighlight;
  varying float vType;

  void main() {
    vType = aType;

    // 1. Initial assembly from dispersed deep space to sphere geometry
    vec3 targetPos = position;
    vec3 pos = mix(aRandomPos, targetPos, uProgress);

    // 2. Subtle organic breathing & amplified Antigravity hover expansion
    float breathe = sin(uTime * 1.3 + aPhase) * 0.012 * uProgress;
    float radialExpansion = uHoverExpansion * 0.40 * uProgress;
    pos += normalize(targetPos) * (breathe + radialExpansion);

    // Extra outward flare for tilted orbital ring on hover
    if (aType > 0.5 && aType < 1.5) {
      pos += normalize(targetPos) * (uHoverExpansion * 0.55 * uProgress);
    }

    // 3. Interactive Antigravity Mouse Proximity & Ring Repulsion
    float highlight = 0.0;
    if (uMouseActive > 0.01 && uProgress > 0.6) {
      float distToMouse = distance(pos, uMousePos);
      float mouseRadius = 1.6 + uHoverExpansion * 0.6;

      if (distToMouse < mouseRadius) {
        float factor = 1.0 - smoothstep(0.0, mouseRadius, distToMouse);
        float repulse = pow(factor, 1.8) * (0.50 + uHoverExpansion * 0.35) * uMouseActive;

        vec3 pushDir = normalize(pos - uMousePos + vec3(0.001));
        vec3 normalDir = normalize(pos);
        pos += mix(pushDir, normalDir, 0.42) * repulse;

        highlight = factor;
      }
    }

    // 4. Click shockwave pulse
    if (uClickWave > 0.0 && uClickWave < 6.0) {
      float waveFront = abs(length(pos) - (uClickWave * 0.55));
      float pulse = exp(-pow(waveFront * 3.2, 2.0)) * uWaveStrength;
      pos += normalize(pos) * pulse * 0.32;
      highlight = max(highlight, pulse * 1.6);
    }

    vHighlight = max(highlight, uHoverExpansion * 0.18);
    vWorldPos = pos;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Point size attenuation
    float baseSize = 34.0;
    if (aType > 2.5) {
      baseSize = 46.0; // Prominent Global Talent Hubs (Gold)
    } else if (aType > 1.5) {
      baseSize = 38.0; // Latitude/longitude anchor dots
    } else if (aType > 0.5) {
      baseSize = 32.0; // Orbital satellite ring dots (Gold)
    }

    baseSize *= (1.0 + uHoverExpansion * 0.28);
    gl_PointSize = max(aScale * (baseSize / -mvPosition.z), 1.2);

    // Depth-based alpha fade (back hemisphere is delicate and translucent)
    float depthFactor = smoothstep(-GLOBE_RADIUS * 1.1, GLOBE_RADIUS * 0.7, pos.z);
    float typeAlpha = aType > 2.5 ? 1.0 : (aType > 1.5 ? 0.95 : (aType > 0.5 ? 0.92 : 0.8));

    // Text clearance mask: soften front particles directly behind central hero typography
    float textZoneMask = smoothstep(0.35, 1.2, length(pos.xy / vec2(1.65, 0.95)));
    float frontFade = pos.z > 0.3 ? textZoneMask : 1.0;

    vAlpha = smoothstep(0.0, 0.4, uProgress) * mix(0.3, typeAlpha, depthFactor) * frontFade;
  }
`;

const globeFragmentShader = /* glsl */ `
  uniform vec3 uColorMint;   // Hyqoo Electric Mint (#00F29D)
  uniform vec3 uColorTeal;   // Hyqoo Ocean Teal (#0D9488)
  uniform vec3 uColorGold;   // Hyqoo Champagne Gold (#E5C07B)
  uniform vec3 uHighlightCol;// Soft Light Sparkle (#FEF9C3)

  varying float vAlpha;
  varying vec3 vWorldPos;
  varying float vHighlight;
  varying float vType;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float edge = 1.0 - smoothstep(0.32, 0.5, dist);

    vec3 baseColor;
    if (vType > 2.5) {
      // 1. Global Talent Hubs: Radiant Hyqoo Champagne Gold
      baseColor = uColorGold;
    } else if (vType > 0.5 && vType < 1.5) {
      // 2. Orbital Satellite Track: Hyqoo Gold
      baseColor = uColorGold;
    } else {
      // 3. Globe Latitude & Meridians: Mint to Teal gradient
      float yGrad = clamp((vWorldPos.y / 2.1) * 0.5 + 0.5, 0.0, 1.0);
      baseColor = mix(uColorTeal, uColorMint, yGrad);

      // Subtle warm gold accent on equator
      float equatorGlow = 1.0 - smoothstep(0.0, 0.35, abs(vWorldPos.y));
      baseColor = mix(baseColor, uColorGold, equatorGlow * 0.25);
    }

    // Dynamic bright accent on mouse proximity or wave highlight
    vec3 finalColor = mix(baseColor, uHighlightCol, clamp(vHighlight * 1.5, 0.0, 1.0));
    float finalAlpha = (vAlpha * 0.88 + vHighlight * 0.6) * edge;

    gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 1.0));
  }
`;

/* ────────────────── Realistic 3D Deep-Space Starfield ───────────── */
const starVertexShader = /* glsl */ `
  uniform float uTime;
  attribute float aSize;
  attribute float aSpeed;
  attribute float aPhase;
  attribute vec3 aStarColor;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Realistic astronomical scintillation (twinkling)
    float twinkle = sin(uTime * aSpeed + aPhase) * 0.20 + 0.80;

    // Fine pinpoint star sizes matching astrophotography
    gl_PointSize = max(aSize * twinkle * (42.0 / -mvPosition.z), 1.2);

    // Deep space depth fade
    vAlpha = clamp(twinkle * smoothstep(55.0, 2.5, -mvPosition.z) * 1.25, 0.25, 1.0);
    vColor = aStarColor;
  }
`;

const starFragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    // Crisp starlight pinpoint with subtle airy fringe
    float core = 1.0 - smoothstep(0.0, 0.26, d);
    float edge = 1.0 - smoothstep(0.18, 0.50, d);
    float glow = core * 0.72 + edge * 0.52;

    gl_FragColor = vec4(vColor, clamp(vAlpha * glow, 0.0, 1.0));
  }
`;

/* ─────────────────── Geometry Generators ─────────────────────────── */
function buildMinimalGlobeData() {
  const positions: number[] = [];
  const randomPos: number[] = [];
  const scales: number[] = [];
  const types: number[] = []; // 0 = surface dot, 1 = orbit dot (gold), 2 = meridian/lat dot, 3 = talent hub (gold)
  const phases: number[] = [];

  function addPoint(x: number, y: number, z: number, type: number, scale: number) {
    positions.push(x, y, z);
    const spread = 16;
    randomPos.push(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );
    scales.push(scale);
    types.push(type);
    phases.push(Math.random() * Math.PI * 2);
  }

  // 1. Structured Latitude Rings (14 rings with spaced dots)
  const latRings = 14;
  for (let lat = 1; lat < latRings; lat++) {
    const phi = (Math.PI * lat) / latRings;
    const ringRadius = GLOBE_RADIUS * Math.sin(phi);
    const y = GLOBE_RADIUS * Math.cos(phi);
    const circumference = 2 * Math.PI * ringRadius;
    const numPoints = Math.max(10, Math.round(circumference * 9));

    for (let p = 0; p < numPoints; p++) {
      const theta = (2 * Math.PI * p) / numPoints;
      const x = ringRadius * Math.cos(theta);
      const z = ringRadius * Math.sin(theta);
      addPoint(x, y, z, 2, 0.8 + Math.random() * 0.25);
    }
  }

  // 2. Longitude Meridians (10 meridian arcs)
  const meridians = 10;
  const pointsPerMeridian = 32;
  for (let m = 0; m < meridians; m++) {
    const theta = (Math.PI * m) / meridians;
    for (let p = 0; p < pointsPerMeridian; p++) {
      const phi = (Math.PI * (p + 0.5)) / pointsPerMeridian;
      const x = GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
      const y = GLOBE_RADIUS * Math.cos(phi);
      const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
      addPoint(x, y, z, 2, 0.75 + Math.random() * 0.2);
    }
  }

  // 3. Sparse Surface Nodes & Global Talent Hubs (Fibonacci sphere distribution, 480 dots)
  const surfaceCount = 480;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < surfaceCount; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / surfaceCount);
    const phi = (2 * Math.PI * i) / goldenRatio;
    const x = GLOBE_RADIUS * Math.sin(theta) * Math.cos(phi);
    const y = GLOBE_RADIUS * Math.sin(theta) * Math.sin(phi);
    const z = GLOBE_RADIUS * Math.cos(theta);

    // Every 14th surface point is a prominent Global Talent Hub (Gold)
    const isHub = i % 14 === 0;
    const type = isHub ? 3 : 0;
    const scale = isHub ? 1.25 : 0.85 + Math.random() * 0.3;
    addPoint(x, y, z, type, scale);
  }

  // 4. Subtle Tilted Orbital Ring in Hyqoo Champagne Gold (76 dashed dots)
  const orbitCount = 76;
  const orbitRadius = GLOBE_RADIUS * 1.34;
  const tiltAngle = (32 * Math.PI) / 180;

  for (let i = 0; i < orbitCount; i++) {
    const angle = (2 * Math.PI * i) / orbitCount;
    const x0 = orbitRadius * Math.cos(angle);
    const z0 = orbitRadius * Math.sin(angle);
    const x = x0;
    const y = -z0 * Math.sin(tiltAngle);
    const z = z0 * Math.cos(tiltAngle);
    addPoint(x, y, z, 1, 0.8 + Math.random() * 0.25); // type 1 = Gold
  }

  return {
    positions: new Float32Array(positions),
    randomPos: new Float32Array(randomPos),
    scales: new Float32Array(scales),
    types: new Float32Array(types),
    phases: new Float32Array(phases),
    count: positions.length / 3,
  };
}

/* ─────────────────── Interactive Globe Mesh ─────────────────────── */
interface InteractiveGlobeProps {
  mouseRayPos: React.MutableRefObject<THREE.Vector3>;
  isHovered: React.MutableRefObject<boolean>;
  clickTrigger: number;
}

function InteractiveGlobe({ mouseRayPos, isHovered, clickTrigger }: InteractiveGlobeProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const startTime = useRef<number | null>(null);

  const waveProgress = useRef(0);
  const waveActive = useRef(false);

  // Hyqoo Brand Color Palette
  const colorMint = useMemo(() => new THREE.Color("#00F29D"), []);
  const colorTeal = useMemo(() => new THREE.Color("#0D9488"), []);
  const colorGold = useMemo(() => new THREE.Color("#E5C07B"), []);
  const highlightCol = useMemo(() => new THREE.Color("#FEF9C3"), []);

  const globeData = useMemo(() => buildMinimalGlobeData(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(globeData.positions, 3));
    geo.setAttribute("aRandomPos", new THREE.BufferAttribute(globeData.randomPos, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(globeData.scales, 1));
    geo.setAttribute("aType", new THREE.BufferAttribute(globeData.types, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(globeData.phases, 1));
    return geo;
  }, [globeData]);

  const hoverExpansion = useRef(0);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uMousePos: { value: new THREE.Vector3(0, 0, 0) },
      uMouseActive: { value: 0 },
      uHoverExpansion: { value: 0 },
      uClickWave: { value: 0 },
      uWaveStrength: { value: 0 },
      uColorMint: { value: colorMint },
      uColorTeal: { value: colorTeal },
      uColorGold: { value: colorGold },
      uHighlightCol: { value: highlightCol },
    }),
    [colorMint, colorTeal, colorGold, highlightCol]
  );

  useEffect(() => {
    if (clickTrigger > 0) {
      waveProgress.current = 0.01;
      waveActive.current = true;
    }
  }, [clickTrigger]);

  useFrame((state, delta) => {
    if (!materialRef.current || !groupRef.current) return;

    if (startTime.current === null) startTime.current = 0;
    startTime.current += delta;
    const rawProgress = Math.min(startTime.current / ASSEMBLY_DURATION, 1);
    const progress = rawProgress === 1 ? 1 : 1 - Math.pow(2, -10 * rawProgress);
    materialRef.current.uniforms.uProgress.value = progress;

    materialRef.current.uniforms.uTime.value += delta;

    // Smooth hover expansion
    const targetHover = isHovered.current ? 1.0 : 0.0;
    hoverExpansion.current = THREE.MathUtils.lerp(
      hoverExpansion.current,
      targetHover,
      delta * 3.6
    );
    materialRef.current.uniforms.uHoverExpansion.value = hoverExpansion.current;
    materialRef.current.uniforms.uMouseActive.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouseActive.value,
      targetHover,
      delta * 5
    );

    // 3D group scale expansion (~36% swell on hover)
    const currentGroupScale = 1.0 + hoverExpansion.current * 0.36;
    groupRef.current.scale.setScalar(currentGroupScale);

    const localMouse = mouseRayPos.current.clone();
    groupRef.current.worldToLocal(localMouse);
    materialRef.current.uniforms.uMousePos.value.lerp(localMouse, delta * 9);

    if (waveActive.current) {
      waveProgress.current += delta * 3.5;
      materialRef.current.uniforms.uClickWave.value = waveProgress.current;
      materialRef.current.uniforms.uWaveStrength.value = Math.max(0, 1 - waveProgress.current / 5.0);

      if (waveProgress.current > 5.0) {
        waveActive.current = false;
        materialRef.current.uniforms.uClickWave.value = 0;
      }
    }

    // Static elegant 3D perspective orientation (NO continuous spinning) + subtle cursor parallax
    const BASE_ROT_X = 0.12;
    const BASE_ROT_Y = 0.42;
    const targetRotX = BASE_ROT_X - state.pointer.y * 0.08;
    const targetRotY = BASE_ROT_Y + state.pointer.x * 0.08;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 2.5);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 2.5);
    groupRef.current.rotation.z = 0;
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={globeVertexShader}
          fragmentShader={globeFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/* ────────────────── Realistic 3D Deep-Space Starfield ───────────── */
function RealisticStarfield() {
  const starRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const count = 6500;

  const { positions, sizes, speeds, phases, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const sp = new Float32Array(count);
    const ph = new Float32Array(count);
    const col = new Float32Array(count * 3);

    const diamondWhite = new THREE.Color("#FFFFFF");
    const pureWhite = new THREE.Color("#F8FAFC");
    const iceBlue = new THREE.Color("#BAE6FD");
    const celestialCyan = new THREE.Color("#7DD3FC");
    const warmStellar = new THREE.Color("#FEF08A");
    const softDeepBlue = new THREE.Color("#93C5FD");

    for (let i = 0; i < count; i++) {
      // Vast celestial depth field extending across the entire sky
      pos[i * 3] = (Math.random() - 0.5) * 54;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 36;
      // Spread in Z behind the globe
      pos[i * 3 + 2] = -1.5 - Math.random() * 40;

      // Realistic astronomical size distribution: dense crisp pinpoints, occasional anchors
      const randSize = Math.random();
      if (randSize > 0.98) {
        sz[i] = 1.5 + Math.random() * 0.5; // Bright landmark star
      } else if (randSize > 0.85) {
        sz[i] = 0.95 + Math.random() * 0.4; // Medium stellar point
      } else {
        sz[i] = 0.52 + Math.random() * 0.35; // Crisp pinpoint grain
      }

      sp[i] = 0.5 + Math.random() * 2.2; // Twinkling rate
      ph[i] = Math.random() * Math.PI * 2;

      // Astronomical star color distribution matching astrophotography
      const randCol = Math.random();
      let chosenColor = pureWhite;
      if (randCol < 0.50) {
        chosenColor = diamondWhite;
      } else if (randCol < 0.72) {
        chosenColor = iceBlue;
      } else if (randCol < 0.84) {
        chosenColor = celestialCyan;
      } else if (randCol < 0.94) {
        chosenColor = warmStellar;
      } else {
        chosenColor = softDeepBlue;
      }

      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }

    return {
      positions: pos,
      sizes: sz,
      speeds: sp,
      phases: ph,
      colors: col,
    };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aStarColor", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, sizes, speeds, phases, colors]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((state, delta) => {
    if (starRef.current) {
      starRef.current.uniforms.uTime.value += delta;
    }
    if (groupRef.current) {
      // Subtle deep-space cosmic parallax
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        -state.pointer.x * 0.30,
        delta * 2
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        state.pointer.y * 0.20,
        delta * 2
      );
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={starRef}
          vertexShader={starVertexShader}
          fragmentShader={starFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/* ─────────────────── Interaction Raycaster Controller ───────────── */
interface SceneControllerProps {
  mouseRayPos: React.MutableRefObject<THREE.Vector3>;
  isHovered: React.MutableRefObject<boolean>;
}

function SceneController({ mouseRayPos, isHovered }: SceneControllerProps) {
  const { camera, raycaster } = useThree();
  const hitPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hitIntersection = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ pointer }) => {
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(hitPlane, hitIntersection)) {
      mouseRayPos.current.copy(hitIntersection);
      const distFromCenter = Math.sqrt(hitIntersection.x * hitIntersection.x + hitIntersection.y * hitIntersection.y);
      isHovered.current = distFromCenter < GLOBE_RADIUS * 2.4;
    }
  });

  return null;
}

/* ─────────────────── Exported Component ─────────────────────────── */
export default function ParticleGlobe() {
  const mouseRayPos = useRef(new THREE.Vector3(999, 999, 999));
  const isHovered = useRef(false);
  const [clickCount, setClickCount] = useState(0);

  const handlePointerEnter = () => {
    isHovered.current = true;
  };

  const handlePointerLeave = () => {
    isHovered.current = false;
  };

  const handlePointerMove = () => {
    isHovered.current = true;
  };

  const handleClick = useCallback(() => {
    setClickCount((c) => c + 1);
  }, []);

  return (
    <div
      className="particle-canvas"
      aria-hidden="true"
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 7.2], fov: 40, near: 0.1, far: 60 }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      >
        <SceneController
          mouseRayPos={mouseRayPos}
          isHovered={isHovered}
        />
        <RealisticStarfield />
        <InteractiveGlobe
          mouseRayPos={mouseRayPos}
          isHovered={isHovered}
          clickTrigger={clickCount}
        />
      </Canvas>
    </div>
  );
}
