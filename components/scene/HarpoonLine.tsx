"use client";

export default function HarpoonLine({
  fromX,
  fromZ,
  toX,
  toZ,
}: {
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
}) {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const midX = (fromX + toX) / 2;
  const midZ = (fromZ + toZ) / 2;
  return (
    <mesh position={[midX, 1.6, midZ]} rotation={[0, -angle, 0]}>
      <boxGeometry args={[len, 0.18, 0.18]} />
      <meshStandardMaterial
        color="#22D3EE"
        emissive="#22D3EE"
        emissiveIntensity={1.2}
      />
    </mesh>
  );
}
