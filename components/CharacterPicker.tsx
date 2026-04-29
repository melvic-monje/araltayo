"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Center } from "@react-three/drei";
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
          width: 140,
          height: 180,
          borderColor: "rgba(34,211,238,0.6)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <Canvas camera={{ position: [0, 1.4, 3.2], fov: 35 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 2]} intensity={0.9} />
          <Suspense fallback={null}>
            <Center disableY>
              <CharacterPreview id={value} />
            </Center>
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
  // Clone so multiple instances don't share state.
  const cloned = scene.clone();
  return <primitive ref={ref} object={cloned} />;
}

// Pre-warm cache
CHARACTER_IDS.forEach((id) => useGLTF.preload(characterModelPath(id)));
