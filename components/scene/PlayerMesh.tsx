"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { avatarFor } from "@/lib/avatars";
import { characterModelPath, DEFAULT_CHARACTER, isCharacterId } from "@/lib/characters";

export default function PlayerMesh({
  id,
  name,
  characterId,
  x,
  z,
  rotY,
  stunUntil,
  avatarUrl,
  isSelf,
}: {
  id: string;
  name: string;
  characterId: string | null;
  x: number;
  z: number;
  rotY: number;
  stunUntil: number;
  avatarUrl: string | null;
  isSelf: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const stunStarsRef = useRef<THREE.Group>(null);
  const avatar = avatarFor(id);
  const isStunned = stunUntil > Date.now();

  const charId = isCharacterId(characterId) ? characterId : DEFAULT_CHARACTER;
  const { scene } = useGLTF(characterModelPath(charId));
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const photoTex = useMemo(() => {
    if (!avatarUrl) return null;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const t = loader.load(avatarUrl);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [avatarUrl]);

  useFrame((_, dt) => {
    if (group.current) {
      if (isSelf) {
        group.current.position.x = x;
        group.current.position.z = z;
        group.current.rotation.y = rotY;
      } else {
        const k = Math.min(1, dt * 12);
        group.current.position.x += (x - group.current.position.x) * k;
        group.current.position.z += (z - group.current.position.z) * k;
        let diff = rotY - group.current.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        group.current.rotation.y += diff * k;
      }
    }
    if (stunStarsRef.current) {
      stunStarsRef.current.rotation.y += 0.1;
      stunStarsRef.current.visible = isStunned;
    }
  });

  return (
    <group ref={group} position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Loaded character. Scale and orient: GLBs come facing -Z; we want +X,
          so rotate -90° around Y. Our movement uses +X as forward. */}
      <group rotation={[0, -Math.PI / 2, 0]} scale={1.15}>
        <primitive object={cloned} />
      </group>

      {/* Photo billboard floating above head — falls back to emoji if no upload */}
      <Billboard position={[0, 2.6, 0]}>
        {photoTex ? (
          <mesh>
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial map={photoTex} transparent />
          </mesh>
        ) : (
          <Text fontSize={0.7} color="#fff" anchorX="center" anchorY="middle">
            {avatar.emoji}
          </Text>
        )}
        <Text
          position={[0, -0.7, 0]}
          fontSize={0.32}
          color={avatar.color}
          outlineColor="#000"
          outlineWidth={0.04}
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
      </Billboard>

      {/* Stun stars */}
      <group ref={stunStarsRef} position={[0, 2.2, 0]} visible={isStunned}>
        {[0, 1, 2].map((i) => {
          const angle = (i / 3) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6]}
            >
              <boxGeometry args={[0.16, 0.16, 0.16]} />
              <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={0.8} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
