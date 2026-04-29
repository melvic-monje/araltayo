"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function Projectile({
  x0,
  z0,
  vx,
  vz,
  bornAt,
}: {
  x0: number;
  z0: number;
  vx: number;
  vz: number;
  bornAt: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = (Date.now() - bornAt) / 1000;
    ref.current.position.x = x0 + vx * t;
    ref.current.position.y = 1.2;
    ref.current.position.z = z0 + vz * t;
    ref.current.rotation.x += 0.2;
    ref.current.rotation.y += 0.2;
  });
  return (
    <mesh ref={ref} position={[x0, 1.2, z0]} castShadow>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#F472B6" emissive="#F472B6" emissiveIntensity={0.7} />
    </mesh>
  );
}
