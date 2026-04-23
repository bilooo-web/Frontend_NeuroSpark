import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const MecabricksBrick = ({ 
  partNum,
  colorHex, 
  position, 
  isPlaced, 
  onPlace 
}) => {
  const groupRef = useRef();
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  useEffect(() => {
    if (!partNum) {
      setLoadError(true);
      return;
    }
    
    let isMounted = true;
    const loader = new GLTFLoader();
    
    const localModelUrl = `/models/mecabricks/${partNum}.glb`;
    
    console.log(`Loading local model for part ${partNum} from: ${localModelUrl}`);
    
    loader.load(
      localModelUrl,
      (gltf) => {
        if (!isMounted) return;
        while (groupRef.current?.children.length > 0) {
          groupRef.current.remove(groupRef.current.children[0]);
        }
        
        const model = gltf.scene;
        if (colorHex && colorHex.startsWith('#')) {
          const colorInt = parseInt(colorHex.slice(1), 16);
          model.traverse((child) => {
            if (child.isMesh && child.material) {
              if (Array.isArray(child.material)) {
                child.material = child.material.map(m => {
                  const cloned = m.clone();
                  cloned.color.setHex(colorInt);
                  return cloned;
                });
              } else {
                const cloned = child.material.clone();
                cloned.color.setHex(colorInt);
                child.material = cloned;
              }
            }
          });
        }
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scale = 0.35 / maxDim;
          model.scale.multiplyScalar(scale);
        }
        
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        groupRef.current?.add(model);
        setModelLoaded(true);
        setLoadError(false);
        console.log(`✅ Loaded model for part ${partNum}`);
      },
      undefined,
      (error) => {
        console.warn(`❌ No local model for part ${partNum}, using fallback brick`);
        setLoadError(true);
        setModelLoaded(false);
      }
    );
    
    return () => {
      isMounted = false;
    };
  }, [partNum, colorHex]);
  
  useFrame((state) => {
    if (groupRef.current && !isPlaced && modelLoaded) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.04;
    }
  });
  
  const FallbackBrick = () => {
    const fallbackColor = colorHex || '#FC97AC';
    
    const getDimensions = () => {
      const dimensions = {
        '3024': { w: 0.45, d: 0.45, h: 0.22 }, // Plate 1x1
        '3023': { w: 0.9, d: 0.45, h: 0.22 },  // Plate 1x2
        '3623': { w: 1.35, d: 0.45, h: 0.22 }, // Plate 1x3
        '3710': { w: 1.8, d: 0.45, h: 0.22 },  // Plate 1x4
        '3666': { w: 2.7, d: 0.45, h: 0.22 },  // Plate 1x6
        
        // Plates (2x2, 2x3, 2x4)
        '3022': { w: 0.9, d: 0.9, h: 0.22 },   // Plate 2x2
        '3021': { w: 0.9, d: 1.35, h: 0.22 },  // Plate 2x3
        '3020': { w: 0.9, d: 1.8, h: 0.22 },   // Plate 2x4
        
        // Bricks
        '3005': { w: 0.45, d: 0.45, h: 0.44 }, // Brick 1x1
        '3004': { w: 0.9, d: 0.45, h: 0.44 },  // Brick 1x2
        '3010': { w: 1.8, d: 0.45, h: 0.44 },  // Brick 1x4
        '3009': { w: 2.7, d: 0.45, h: 0.44 },  // Brick 1x6
        
        // Slopes (approx dimensions)
        '54200': { w: 0.45, d: 0.45, h: 0.3 },  // Cheese slope
        '85984': { w: 0.9, d: 0.45, h: 0.3 },   // Slope 30° 1x2
        '3040b': { w: 0.9, d: 0.45, h: 0.44 },  // Slope 45° 1x2
        '15068': { w: 0.9, d: 0.9, h: 0.3 },    // Slope curved 2x2
        '93273': { w: 1.8, d: 0.45, h: 0.3 },   // Slope curved 4x1
      };
      
      return dimensions[partNum] || { w: 0.45, d: 0.45, h: 0.22 };
    };
    
    const { w, d, h } = getDimensions();
    
    return (
      <group>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial 
            color={fallbackColor} 
            roughness={0.3} 
            metalness={0.08}
          />
        </mesh>
        
        {w >= 0.45 && (
          <>
            <mesh position={[0, h/2 + 0.03, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 0.06, 16]} />
              <meshStandardMaterial color={fallbackColor} roughness={0.25} />
            </mesh>
            {w > 0.6 && (
              <mesh position={[w * 0.4, h/2 + 0.03, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.09, 0.06, 16]} />
                <meshStandardMaterial color={fallbackColor} roughness={0.25} />
              </mesh>
            )}
          </>
        )}
      </group>
    );
  };
  
  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={onPlace}
      castShadow
      receiveShadow
    >
      {loadError && <FallbackBrick />}
    </group>
  );
};

export default MecabricksBrick;