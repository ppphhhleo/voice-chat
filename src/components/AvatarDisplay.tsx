"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { BigFive } from "@/types";

interface AvatarDisplayProps {
  traits: BigFive;
  isSpeaking: boolean;
}

function Avatar({ traits, isSpeaking }: AvatarDisplayProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Derive visual style from personality traits
  const avatarStyle = useMemo(() => {
    const e = traits.extraversion / 100;
    const a = traits.agreeableness / 100;
    const o = traits.openness / 100;
    const n = traits.neuroticism / 100;
    const c = traits.conscientiousness / 100;

    // Hue: extraversion = warm (orange/red), introverted = cool (blue/purple)
    const hue = THREE.MathUtils.lerp(0.6, 0.06, e);
    // Saturation: openness increases color vibrancy
    const sat = THREE.MathUtils.lerp(0.25, 0.75, o);
    // Lightness: agreeableness = softer/lighter
    const light = THREE.MathUtils.lerp(0.35, 0.55, a);

    const bodyColor = new THREE.Color().setHSL(hue, sat, light);
    const headColor = new THREE.Color().setHSL(hue, sat * 0.7, light + 0.12);

    // Animation speed: extraversion = more energetic idle
    const animSpeed = THREE.MathUtils.lerp(0.6, 1.8, e);
    // Sway amplitude: neuroticism = more fidgety
    const swayAmount = THREE.MathUtils.lerp(0.015, 0.1, n);
    // Posture tilt: conscientiousness = upright
    const postureOffset = THREE.MathUtils.lerp(-0.12, 0.12, c);
    // Overall scale: extraversion = larger presence
    const scale = THREE.MathUtils.lerp(0.88, 1.08, e);

    return { bodyColor, headColor, animSpeed, swayAmount, postureOffset, scale };
  }, [traits]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const { animSpeed, swayAmount, postureOffset, scale } = avatarStyle;

    if (groupRef.current) {
      // Idle floating bob
      groupRef.current.position.y = Math.sin(t * animSpeed) * 0.06;
      // Gentle sway
      groupRef.current.rotation.z = Math.sin(t * animSpeed * 0.7) * swayAmount;
      groupRef.current.scale.setScalar(scale);
    }

    if (headRef.current) {
      // Subtle head tilt
      headRef.current.rotation.z = Math.sin(t * animSpeed * 0.5) * 0.04;
      headRef.current.rotation.x = postureOffset * 0.08;
      // Speaking: head bob
      if (isSpeaking) {
        headRef.current.position.y = 1.05 + Math.sin(t * 7) * 0.025;
      } else {
        headRef.current.position.y = 1.05;
      }
    }

    if (bodyRef.current) {
      // Breathing
      const breathe = 1 + Math.sin(t * animSpeed * 1.2) * 0.012;
      bodyRef.current.scale.set(1, breathe, 1);
      bodyRef.current.position.y = postureOffset * 0.2;
    }

    // Arm swing
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = 0.2 + Math.sin(t * animSpeed * 0.8) * swayAmount * 1.5;
      if (isSpeaking) {
        leftArmRef.current.rotation.z += Math.sin(t * 5.5) * 0.1;
      }
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = -0.2 - Math.sin(t * animSpeed * 0.8 + 1) * swayAmount * 1.5;
      if (isSpeaking) {
        rightArmRef.current.rotation.z -= Math.sin(t * 5.5 + 0.5) * 0.1;
      }
    }

    // Mouth open/close when speaking
    if (mouthRef.current) {
      if (isSpeaking) {
        const open = (Math.sin(t * 11) + 1) * 0.5;
        mouthRef.current.scale.y = THREE.MathUtils.lerp(0.5, 1.6, open);
      } else {
        mouthRef.current.scale.y = 0.6;
      }
    }

    // Glow ring pulse
    if (glowRef.current) {
      if (isSpeaking) {
        glowRef.current.visible = true;
        const pulse = (Math.sin(t * 4) + 1) * 0.25 + 0.3;
        (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
        glowRef.current.rotation.z = t * 0.5;
      } else {
        glowRef.current.visible = false;
      }
    }
  });

  const { bodyColor, headColor } = avatarStyle;

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0, 0]}>
        <capsuleGeometry args={[0.32, 0.65, 16, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={headColor} roughness={0.3} metalness={0.05} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.1, 1.12, 0.26]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#0f1729" roughness={0.1} metalness={0.4} />
      </mesh>
      <mesh position={[0.1, 1.12, 0.26]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#0f1729" roughness={0.1} metalness={0.4} />
      </mesh>

      {/* Eye highlights */}
      <mesh position={[-0.09, 1.135, 0.3]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.11, 1.135, 0.3]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, 0.95, 0.28]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#1a1035" roughness={0.5} />
      </mesh>

      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-0.47, 0.05, 0]}>
        <capsuleGeometry args={[0.07, 0.45, 8, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[0.47, 0.05, 0]}>
        <capsuleGeometry args={[0.07, 0.45, 8, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Speaking glow ring */}
      <mesh ref={glowRef} position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.55, 0.6, 32]} />
        <meshBasicMaterial color="#8ab4f8" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function AvatarDisplay({ traits, isSpeaking }: AvatarDisplayProps) {
  return (
    <div className="card overflow-hidden aspect-square md:aspect-auto md:min-h-[280px] relative">
      <Canvas
        camera={{ position: [0, 0.6, 2.8], fov: 42 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 4]} intensity={0.9} />
        <directionalLight position={[-2, 3, -3]} intensity={0.25} color="#8ab4f8" />
        <pointLight position={[0, -1, 2]} intensity={0.3} color="#5a9bff" />
        <Avatar traits={traits} isSpeaking={isSpeaking} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
      <div className="absolute bottom-3 left-3 text-[10px] text-[var(--muted)] pointer-events-none uppercase tracking-widest">
        3D Avatar
      </div>
    </div>
  );
}
