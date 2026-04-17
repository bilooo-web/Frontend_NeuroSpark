import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const LegoPiece3D = ({ type, color, position, isPlaced, onPlace }) => {
  const meshRef = useRef();
  
  // Realistic LEGO colors
  const colors = {
    red: '#C41E3A',
    blue: '#0055A4',
    yellow: '#F3D03E',
    green: '#2E8B57',
    brown: '#8B4513',
    black: '#2C2C2C',
    white: '#F5F5F5',
    pink: '#FF69B4',
    orange: '#FF8C42'
  };
  
  const pieceColor = colors[color] || colors.red;
  
  // Floating animation for pieces not yet placed
  useFrame((state) => {
    if (meshRef.current && !isPlaced) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.03;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
  // Different geometries based on piece type
  const renderPiece = () => {
    if (type === 'wheel') {
      return (
        <group>
          {/* Tire */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.15, 24]} />
            <meshStandardMaterial color="#2C2C2C" roughness={0.8} metalness={0.1} />
          </mesh>
          {/* Rim */}
          <mesh position={[0, 0, 0.02]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
            <meshStandardMaterial color="#CCCCCC" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0, -0.02]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
            <meshStandardMaterial color="#CCCCCC" roughness={0.3} metalness={0.7} />
          </mesh>
        </group>
      );
    }
    
    if (type === 'window') {
      return (
        <group>
          {/* Frame */}
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.3, 0.05]} />
            <meshStandardMaterial color="#CCCCCC" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Glass */}
          <mesh position={[0, 0, 0.03]} castShadow>
            <boxGeometry args={[0.42, 0.22, 0.02]} />
            <meshStandardMaterial color="#88AAFF" roughness={0.1} metalness={0.9} transparent opacity={0.6} />
          </mesh>
        </group>
      );
    }
    
    if (type === 'ear') {
      return (
        <mesh castShadow position={[0, 0.1, 0]}>
          <coneGeometry args={[0.15, 0.25, 8]} />
          <meshStandardMaterial color={pieceColor} roughness={0.4} />
        </mesh>
      );
    }
    
    if (type === 'eye') {
      return (
        <mesh castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={pieceColor} roughness={0.2} emissive={0x111111} />
        </mesh>
      );
    }
    
    // Default brick with stud
    return (
      <group>
        {/* Main brick body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.45, 0.2, 0.45]} />
          <meshStandardMaterial color={pieceColor} roughness={0.3} metalness={0.1} />
        </mesh>
        {/* LEGO stud on top */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.06, 16]} />
          <meshStandardMaterial color={pieceColor} roughness={0.2} />
        </mesh>
      </group>
    );
  };
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onPlace}
      castShadow
      receiveShadow
    >
      {renderPiece()}
    </mesh>
  );
};

export default LegoPiece3D;