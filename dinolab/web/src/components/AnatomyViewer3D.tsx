import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  CanvasTexture,
  DoubleSide,
  type Group,
  type Mesh,
  Quaternion,
  Raycaster,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";
import { createOrganicBoneGeometry } from "../data/boneOrganicGeometry";
import { SPECIES_3D_OFFSET } from "../data/skeleton3dLayout";
import { getSpeciesRootRotation, type BoneSegmentDef } from "../data/skeleton3dSegments";
import { getSueHighFidelityBoneMeshes } from "../data/species/trexSueHighFidelityBones";
import {
  coarseMeshMatchesSpeciesPrefix,
  getTheropodHighFidelityBoneMeshes,
} from "../data/theropodHighFidelityRig";
import type { AnatomyLayer, BoneRecord, DinosaurSpecies } from "../data/types";

const REFERENCE_IMAGE_URL = "/reference/fmnh-pr2081-sue-lateral.png";

/** Match 2D bone map: selected = dark green, hover = orange. */
const BONE_SELECTED = "#14532d";
const BONE_SELECTED_EMI = "#052e16";
const BONE_HOVER = "#ea580c";
const BONE_HOVER_EMI = "#ff8c2b";
const BONE_SCHEMATIC_BASE = "#6a8fa8";

/** Schematic fossil palette (non-cast species). */
const FOSSIL_BASE = "#c4a06a";
const FOSSIL_SHADOW = "#7d5a38";
const FOSSIL_RIM_LIGHT = "#e8d4a8";

/** Cast look — off-white physical bone in 3D. */
const CAST_BONE = "#ebe8e2";
const CAST_SHADOW = "#b8b4ac";

function useFossilRoughnessMap(): CanvasTexture {
  const map = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const n =
          110 +
          Math.sin(x * 0.15) * 12 +
          Math.cos(y * 0.12) * 10 +
          (Math.random() - 0.5) * 28;
        const v = Math.max(60, Math.min(200, n));
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  return map;
}

/** Lighter micro-variation for white cast bone (PBR-friendly). */
function useMuseumCastRoughnessMap(): CanvasTexture {
  const map = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const n =
          175 +
          Math.sin(x * 0.12) * 15 +
          Math.cos(y * 0.1) * 12 +
          (Math.random() - 0.5) * 18;
        const v = Math.max(140, Math.min(220, n));
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  return map;
}

interface RenderBone {
  key: string;
  boneId: string;
  segment: BoneSegmentDef;
}

function buildSueHighFidelityRenderList(): RenderBone[] {
  return getSueHighFidelityBoneMeshes().map(({ id, segment }) => ({
    key: id,
    boneId: id,
    segment,
  }));
}

function buildTheropodHighFidelityRenderList(speciesId: string): RenderBone[] {
  return getTheropodHighFidelityBoneMeshes(speciesId).map((item) => ({
    key: item.key,
    boneId: item.boneId,
    segment: item.segment,
  }));
}

/** When 2D uses coarse ids (skull, cervical, …), highlight matching fine 3D fragments (T. rex). */
const SUE_PREFIX_BY_COARSE: Record<string, string> = {
  skull: "sue-skull",
  mandible: "sue-mandible",
  cervical: "sue-cervical",
  dorsal: "sue-dorsal",
  sacrum: "sue-sacrum",
  ribs: "sue-rib",
  gastralia: "sue-gastralia",
  caudal: "sue-caudal",
  scapula: "sue-scapula",
  humerus: "sue-humerus",
  antebrachium: "sue-antebrachium",
  manus: "sue-manus",
  ilium: "sue-ilium",
  pubis: "sue-pubis",
  femur: "sue-femur",
  tibia: "sue-tibia",
  metatarsus: "sue-metatarsus",
  pes: "sue-pes",
};

function sueCoarseHighlightsMesh(meshId: string, selectedId: string | null): boolean {
  if (!selectedId) return false;
  const prefix = SUE_PREFIX_BY_COARSE[selectedId];
  return Boolean(prefix && meshId.startsWith(prefix));
}

interface Props {
  species: DinosaurSpecies;
  activeLayers: Set<AnatomyLayer>;
  selectedBoneId: string | null;
  onSelectBone: (bone: BoneRecord) => void;
}

function BoneCapsule({
  segment,
  selected,
  hovered,
  xrayMode,
  fossilLook,
  castBoneWhite,
  roughnessMap,
  meshKey,
  onPick,
  onBonePointerOver,
  onBonePointerOut,
}: {
  segment: BoneSegmentDef;
  selected: boolean;
  hovered: boolean;
  xrayMode: boolean;
  fossilLook: boolean;
  castBoneWhite: boolean;
  roughnessMap: CanvasTexture;
  meshKey: string;
  onPick: () => void;
  onBonePointerOver: (key: string) => void;
  onBonePointerOut: (key: string) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const geom = useMemo(
    () => createOrganicBoneGeometry(segment, meshKey),
    [segment, meshKey],
  );
  const ribSquash = meshKey.includes("rib") ? { sx: 0.72, sz: 1.28 } : { sx: 1, sz: 1 };

  useEffect(() => {
    return () => {
      geom.dispose();
    };
  }, [geom]);

  const { position, quaternion } = useMemo(() => {
    const a = new Vector3(...segment.from);
    const b = new Vector3(...segment.to);
    const dir = new Vector3().subVectors(b, a);
    const len = dir.length();
    if (len < 1e-6) {
      return {
        position: [a.x, a.y, a.z] as [number, number, number],
        quaternion: new Quaternion(),
      };
    }
    dir.normalize();
    const mid = new Vector3().addVectors(a, b).multiplyScalar(0.5);
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir);
    return {
      position: [mid.x, mid.y, mid.z] as [number, number, number],
      quaternion: q,
    };
  }, [segment]);

  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    const pulse = selected ? 1 + Math.sin(t * 3) * 0.035 : 1;
    m.scale.set(ribSquash.sx * pulse, pulse, ribSquash.sz * pulse);
  });

  if (fossilLook && !xrayMode) {
    const baseColor = castBoneWhite
      ? selected
        ? "#1a3d2a"
        : hovered
          ? "#f59e0b"
          : CAST_BONE
      : selected
        ? "#1e4d32"
        : hovered
          ? "#c2410c"
          : FOSSIL_BASE;
    return (
      <mesh
        ref={meshRef}
        position={position}
        quaternion={quaternion}
        castShadow
        receiveShadow
        geometry={geom}
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          onBonePointerOver(meshKey);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
          onBonePointerOut(meshKey);
        }}
      >
        <meshPhysicalMaterial
          color={baseColor}
          roughness={castBoneWhite ? 0.52 : 0.88}
          metalness={castBoneWhite ? 0.02 : 0}
          roughnessMap={roughnessMap}
          clearcoat={castBoneWhite ? 0.06 : 0.08}
          clearcoatRoughness={castBoneWhite ? 0.55 : 0.62}
          envMapIntensity={castBoneWhite ? 0.95 : 0.65}
          emissive={
            castBoneWhite
              ? selected
                ? BONE_SELECTED_EMI
                : hovered
                  ? BONE_HOVER_EMI
                  : CAST_SHADOW
              : selected
                ? BONE_SELECTED_EMI
                : hovered
                  ? BONE_HOVER_EMI
                  : FOSSIL_SHADOW
          }
          emissiveIntensity={
            castBoneWhite
              ? selected
                ? 0.18
                : hovered
                  ? 0.22
                  : 0.04
              : selected
                ? 0.2
                : hovered
                  ? 0.18
                  : 0.07
          }
        />
      </mesh>
    );
  }

  const color = xrayMode
    ? selected
      ? "#22c55e"
      : hovered
        ? "#fb923c"
        : "#7ef9d0"
    : selected
      ? BONE_SELECTED
      : hovered
        ? BONE_HOVER
        : BONE_SCHEMATIC_BASE;
  const opacity = xrayMode ? 0.48 : 1;

  return (
    <mesh
      ref={meshRef}
      position={position}
      quaternion={quaternion}
      castShadow
      receiveShadow
      geometry={geom}
      onClick={(e) => {
        e.stopPropagation();
        onPick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onBonePointerOver(meshKey);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
        onBonePointerOut(meshKey);
      }}
    >
      <meshStandardMaterial
        color={color}
        emissive={
          selected ? BONE_SELECTED_EMI : hovered ? BONE_HOVER_EMI : xrayMode ? "#002218" : "#000000"
        }
        emissiveIntensity={selected ? 0.42 : hovered ? 0.38 : xrayMode ? 0.28 : 0}
        transparent={xrayMode}
        opacity={opacity}
        metalness={0.12}
        roughness={0.68}
      />
    </mesh>
  );
}

function SpecimenReferenceBackdrop() {
  const tex = useTexture(REFERENCE_IMAGE_URL, (t) => {
    t.colorSpace = SRGBColorSpace;
  });
  return (
    <mesh position={[-0.2, -0.02, -1.55]} renderOrder={-10}>
      <planeGeometry args={[2.6, 1.45]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={0.26}
        depthWrite={false}
        toneMapped={true}
        side={DoubleSide}
      />
    </mesh>
  );
}

function RigContent(props: Props) {
  const { gl, camera } = useThree();
  const castStage = props.species.viewerStyle === "cast";
  const fossilRoughness = useFossilRoughnessMap();
  const castRoughness = useMuseumCastRoughnessMap();
  const roughnessMap = castStage ? castRoughness : fossilRoughness;
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isGeometryLoading, setIsGeometryLoading] = useState(true);

  const onBonePointerOver = (key: string) => setHoveredKey(key);
  const onBonePointerOut = (key: string) =>
    setHoveredKey((prev) => (prev === key ? null : prev));

  useEffect(() => {
    const el = gl.domElement;
    const leave = () => setHoveredKey(null);
    el.addEventListener("pointerleave", leave);
    return () => el.removeEventListener("pointerleave", leave);
  }, [gl]);

  const showBones = props.activeLayers.has("skeleton") || props.activeLayers.has("xray");
  const xrayMode = props.activeLayers.has("xray");
  const fossilLook = showBones && !xrayMode;
  const tweak = SPECIES_3D_OFFSET[props.species.id] ?? { y: 0, scale: 1 };
  const [rx, ry, rz] = getSpeciesRootRotation(props.species.id);
  const boneItems = useMemo((): RenderBone[] => {
    if (props.species.id === "trex") {
      return buildSueHighFidelityRenderList();
    }
    return buildTheropodHighFidelityRenderList(props.species.id);
  }, [props.species.id]);

  const rootRef = useRef<Group>(null);
  const meshMapRef = useRef<Map<string, Mesh>>(new Map());

  useEffect(() => {
    if (showBones) {
      setIsGeometryLoading(false);
    }
  }, [showBones]);

  useEffect(() => {
    gl.toneMappingExposure = fossilLook ? (castStage ? 1.12 : 1.05) : 1;
  }, [gl, fossilLook, castStage]);

  useFrame((state) => {
    const g = rootRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.position.y = tweak.y + Math.sin(t * 0.85) * 0.012;
  });

  const pick = (id: string) => {
    const bone = props.species.bones.find((b) => b.id === id);
    if (bone) props.onSelectBone(bone);
  };

  const showReferenceBackdrop = props.species.id === "trex" && !castStage;

  if (!showBones) {
    return (
      <group ref={rootRef} scale={tweak.scale}>
        <group rotation={[rx, ry, rz]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshBasicMaterial color="#334455" wireframe />
          </mesh>
        </group>
      </group>
    );
  }

  return (
    <group ref={rootRef} scale={tweak.scale}>
      {showReferenceBackdrop ? <SpecimenReferenceBackdrop /> : null}
      <group rotation={[rx, ry, rz]}>
        {showBones
          ? boneItems.map((item) => {
              const selected =
                props.selectedBoneId === item.boneId ||
                (props.species.id === "trex" &&
                  sueCoarseHighlightsMesh(item.boneId, props.selectedBoneId)) ||
                (props.species.id !== "trex" &&
                  coarseMeshMatchesSpeciesPrefix(
                    props.species.id,
                    item.boneId,
                    props.selectedBoneId,
                  ));
              return (
                <BoneCapsule
                  key={item.key}
                  meshKey={item.key}
                  segment={item.segment}
                  selected={selected}
                  hovered={hoveredKey === item.key}
                  xrayMode={xrayMode}
                  fossilLook={fossilLook}
                  castBoneWhite={castStage}
                  roughnessMap={roughnessMap}
                  onPick={() => pick(item.boneId)}
                  onBonePointerOver={onBonePointerOver}
                  onBonePointerOut={onBonePointerOut}
                />
              );
            })
          : null}
      </group>
    </group>
  );
}

function Scene(props: Props) {
  const castStage = props.species.viewerStyle === "cast";
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, [props.species.id]);

  return (
    <>
      <color attach="background" args={[castStage ? "#000000" : "#0b0d10"]} />
      <ambientLight intensity={castStage ? 0.2 : 0.28} />
      <hemisphereLight
        args={castStage ? ["#f2f2f2", "#050505", 0.52] : ["#c4b8a8", "#1a1510", 0.45]}
        position={[0, 3, 0]}
      />
      <directionalLight
        position={[4.2, 7, 3.8]}
        intensity={castStage ? 1.6 : 1.35}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
      />
      <directionalLight
        position={[-3.5, 2.2, -2.2]}
        intensity={castStage ? 0.45 : 0.38}
        color={castStage ? "#d0dcf5" : "#a8c4ff"}
      />
      <pointLight
        position={[0.5, 0.4, 1.2]}
        intensity={castStage ? 0.42 : 0.35}
        color={castStage ? "#ffffff" : FOSSIL_RIM_LIGHT}
        distance={4}
      />
      <Suspense fallback={null}>
        <Environment
          preset={castStage ? "studio" : "warehouse"}
          environmentIntensity={castStage ? 0.7 : 0.45}
        />
        {!isLoading && <RigContent {...props} />}
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.07}
        minDistance={0.55}
        maxDistance={5}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        autoRotate
        autoRotateSpeed={0.32}
        target={[0.05, -0.05, 0]}
      />
    </>
  );
}

export function AnatomyViewer3D(props: Props) {
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  return (
    <div
      className="anatomy-viewer-3d anatomy-viewer-3d--specimen"
      role="img"
      aria-label={`3D specimen skeleton for ${props.species.binomial}. Full spherical orbit.`}
    >
      {!isCanvasReady && (
        <div
          className="anatomy-viewer-3d__loading"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(11, 13, 16, 0.8)",
            zIndex: 10,
            fontSize: "14px",
            color: "#c4b8a8",
          }}
        >
          Loading 3D skeleton…
        </div>
      )}
      <Canvas
        shadows
        className="anatomy-viewer-3d__canvas"
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [1.65, 0.48, 1.48], fov: 40, near: 0.05, far: 80 }}
        onPointerMissed={() => {
          document.body.style.cursor = "";
        }}
        onCreated={() => setIsCanvasReady(true)}
      >
        <Scene {...props} />
      </Canvas>
      <p className="anatomy-viewer-3d__caption" aria-hidden>
        {props.species.viewerStyle === "cast"
          ? `Cast-style lighting · ${props.species.bones.length} clickable elements · drag to orbit · scroll to zoom`
          : "Drag to orbit · scroll to zoom · all angles"}
      </p>
    </div>
  );
}
