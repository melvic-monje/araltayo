"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { avatarFor } from "@/lib/avatars";

export default function PlayerMesh({
  id,
  name,
  x,
  z,
  rotY,
  stunUntil,
  avatarUrl,
}: {
  id: string;
  name: string;
  x: number;
  z: number;
  rotY: number;
  stunUntil: number;
  avatarUrl: string | null;
}) {
  const group = useRef<THREE.Group>(null);
  const stunStarsRef = useRef<THREE.Group>(null);
  const avatar = avatarFor(id);
  const isStunned = stunUntil > Date.now();

  const texture = useMemo(() => {
    if (!avatarUrl) return null;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const t = loader.load(avatarUrl);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [avatarUrl]);

  useFrame(() => {
    if (group.current) {
      group.current.position.x = x;
      group.current.position.z = z;
      group.current.rotation.y = rotY;
    }
    if (stunStarsRef.current) {
      stunStarsRef.current.rotation.y += 0.1;
      stunStarsRef.current.visible = isStunned;
    }
  });

  // Materials for the hat (6 faces: +X, -X, +Y, -Y, +Z, -Z)
  // We want the photo on all 4 side faces so it shows from any direction.
  const hatMaterials = useMemo(() => {
    if (!texture) return null;
    const photoMat = new THREE.MeshStandardMaterial({ map: texture });
    const sideMat = new THREE.MeshStandardMaterial({ color: avatar.color });
    return [photoMat, photoMat, sideMat, sideMat, photoMat, photoMat];
  }, [texture, avatar.color]);

  return (
    <group ref={group} position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1, 1.6, 0.8]} />
        <meshStandardMaterial color={avatar.color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#F1DCC0" />
      </mesh>
      {/* Hat — photo wrapped on the four side faces, avatar color on top/bottom */}
      <mesh position={[0, 2.85, 0]} castShadow material={hatMaterials ?? undefined}>
        <boxGeometry args={[1.4, 0.7, 1.4]} />
        {!hatMaterials && <meshStandardMaterial color={avatar.color} />}
      </mesh>
      {/* Direction nose so you can tell which way they face */}
      <mesh position={[0.5, 2.1, 0]} castShadow>
        <boxGeometry args={[0.3, 0.25, 0.25]} />
        <meshStandardMaterial color="#F1DCC0" />
      </mesh>
      {/* Name label above */}
      <Billboard position={[0, 4, 0]}>
        <Text
          fontSize={0.45}
          color={avatar.color}
          outlineColor="#000"
          outlineWidth={0.04}
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
        {!texture && (
          <Text
            position={[0, -0.6, 0]}
            fontSize={0.6}
            color="#fff"
            anchorX="center"
            anchorY="middle"
          >
            {avatar.emoji}
          </Text>
        )}
      </Billboard>
      {/* Stun stars */}
      <group ref={stunStarsRef} position={[0, 3.5, 0]} visible={isStunned}>
        {[0, 1, 2].map((i) => {
          const angle = (i / 3) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.7, 0, Math.sin(angle) * 0.7]}
            >
              <boxGeometry args={[0.18, 0.18, 0.18]} />
              <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={0.8} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
