"use client";

import { TRACK_LENGTH, TRACK_WIDTH } from "@/lib/game";

export default function Track() {
  const tileSize = 8;
  const tilesX = Math.ceil(TRACK_LENGTH / tileSize);
  const tilesZ = Math.ceil(TRACK_WIDTH / tileSize);

  return (
    <group>
      {/* Floor with checker tiles */}
      {Array.from({ length: tilesX }).flatMap((_, i) =>
        Array.from({ length: tilesZ }).map((__, j) => {
          const x = i * tileSize + tileSize / 2;
          const z = j * tileSize - (TRACK_WIDTH / 2) + tileSize / 2;
          const dark = (i + j) % 2 === 0;
          return (
            <mesh
              key={`t-${i}-${j}`}
              position={[x, 0, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[tileSize, tileSize]} />
              <meshStandardMaterial color={dark ? "#3F4B55" : "#4F5C68"} />
            </mesh>
          );
        })
      )}

      {/* Walls */}
      <mesh position={[TRACK_LENGTH / 2, 1, -TRACK_WIDTH / 2 - 0.5]} castShadow receiveShadow>
        <boxGeometry args={[TRACK_LENGTH, 2, 1]} />
        <meshStandardMaterial color="#22D3EE" />
      </mesh>
      <mesh position={[TRACK_LENGTH / 2, 1, TRACK_WIDTH / 2 + 0.5]} castShadow receiveShadow>
        <boxGeometry args={[TRACK_LENGTH, 2, 1]} />
        <meshStandardMaterial color="#F472B6" />
      </mesh>

      {/* Start gate */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[0.4, 4, TRACK_WIDTH]} />
        <meshStandardMaterial color="#FBBF24" />
      </mesh>

      {/* Finish line — bright stripe + arch */}
      <mesh position={[TRACK_LENGTH, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, TRACK_WIDTH]} />
        <meshStandardMaterial color="#A78BFA" emissive="#7C3AED" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[TRACK_LENGTH, 4, 0]}>
        <boxGeometry args={[0.6, 8, TRACK_WIDTH + 2]} />
        <meshStandardMaterial color="#A78BFA" />
      </mesh>

      {/* Distance markers every 50 units */}
      {Array.from({ length: Math.floor(TRACK_LENGTH / 50) }).map((_, i) => {
        const x = (i + 1) * 50;
        return (
          <mesh key={`m-${i}`} position={[x, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, TRACK_WIDTH]} />
            <meshStandardMaterial color="#FBBF24" transparent opacity={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}
