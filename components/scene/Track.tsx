"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { OBSTACLES, TRACK_LENGTH, TRACK_WIDTH } from "@/lib/game";

export default function Track() {
  const finishTex = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const t = loader.load("/finish-line.jpg");
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  // Map the photo onto the front + back faces of the arch box; sides + top/
  // bottom keep a solid color so the photo isn't smeared along the X axis.
  const finishMats = useMemo(() => {
    const photo = new THREE.MeshStandardMaterial({ map: finishTex });
    const trim = new THREE.MeshStandardMaterial({ color: "#A78BFA" });
    return [trim, trim, trim, trim, photo, photo];
  }, [finishTex]);
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

      {/* Start gate — half the wall height (walls are 2u tall) */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.4, 1, TRACK_WIDTH]} />
        <meshStandardMaterial color="#FBBF24" />
      </mesh>

      {/* Finish line — bright stripe + arch */}
      <mesh position={[TRACK_LENGTH, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, TRACK_WIDTH]} />
        <meshStandardMaterial color="#A78BFA" emissive="#7C3AED" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[TRACK_LENGTH, 4, 0]} material={finishMats}>
        <boxGeometry args={[0.6, 8, TRACK_WIDTH + 2]} />
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

      {/* Obstacles — chicane pillars + walls forcing players to weave */}
      {OBSTACLES.map((o, i) => (
        <mesh
          key={`o-${i}`}
          position={[o.cx, o.height / 2, o.cz]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[o.hw * 2, o.height, o.hd * 2]} />
          <meshStandardMaterial color="#FBBF24" emissive="#A16207" emissiveIntensity={0.18} />
        </mesh>
      ))}
    </group>
  );
}
