"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function Mine({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 0.85 + Math.sin(clock.elapsedTime * 6) * 0.15;
    ref.current.scale.set(pulse, 1, pulse);
    ref.current.rotation.y += 0.03;
  });
  return (
    <mesh ref={ref} position={[x, 0.25, z]} castShadow>
      <cylinderGeometry args={[0.7, 0.7, 0.4, 12]} />
      <meshStandardMaterial color="#EF4444" emissive="#DC2626" emissiveIntensity={0.7} />
    </mesh>
  );
}
