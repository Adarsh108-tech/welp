"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function RotatingSphere({ speedRef }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current && speedRef.current) {
      meshRef.current.rotation.y += speedRef.current;
      meshRef.current.rotation.x += speedRef.current / 2;
    }
  });

  return (
    <mesh ref={meshRef} position={[-2, 0, 0]}>
      <sphereGeometry args={[1.8, 64, 64]} />
      <meshStandardMaterial color="#3B82F6" wireframe />
    </mesh>
  );
}
