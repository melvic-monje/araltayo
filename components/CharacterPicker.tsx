"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { CHARACTER_IDS, characterModelPath, type CharacterId } from "@/lib/characters";

export default function CharacterPicker({
  value,
  onChange,
}: {
  value: CharacterId;
  onChange: (id: CharacterId) => void;
}) {
  const idx = CHARACTER_IDS.indexOf(value);
  function go(delta: number) {
    const next = (idx + delta + CHARACTER_IDS.length) % CHARACTER_IDS.length;
    onChange(CHARACTER_IDS[next]);
  }
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => go(-1)}
        className="btn-ghost px-3 py-2 text-lg"
        aria-label="Previous character"
      >
        ←
      </button>
      <div
        className="rounded-2xl overflow-hidden border-2"
        style={{
          width: 160,
          height: 200,
          borderColor: "rgba(34,211,238,0.6)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <Canvas dpr={[1, 1.5]} camera={{ position: [3, 2, 4], fov: 35 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 2]} intensity={1.0} />
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.4}>
              <CharacterPreview id={value} />
            </Bounds>
          </Suspense>
        </Canvas>
      </div>
      <button
        type="button"
        onClick={() => go(1)}
        className="btn-ghost px-3 py-2 text-lg"
        aria-label="Next character"
      >
        →
      </button>
    </div>
  );
}

function CharacterPreview({ id }: { id: string }) {
  const { scene } = useGLTF(characterModelPath(id));
  const ref = useRef<THREE.Object3D>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  const cloned = scene.clone(true);
  return <primitive ref={ref} object={cloned} />;
}

CHARACTER_IDS.forEach((id) => useGLTF.preload(characterModelPath(id)));
