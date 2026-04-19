import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import * as THREE from 'three';

const ProceduralLegoBrick = ({
  partNum,
  colorHex,
  colorName,
  position,
  isPlaced,
  onPlace,
  modelSet = 'stitch',
}) => {
  const groupRef = useRef();
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadError, setLoadError]     = useState(false);
  const getColorFolder = (color) => {
    if (!color) return 'All';

    const colorMap = {
      'black': 'Black',

      'blue': 'Blue',
      'dark blue': 'Dark Blue',
      'dark azure': 'Dark Azure',
      'medium azure': 'Blue',
      'bright light blue': 'Blue',
      'sand blue': 'Blue',
      'light bluish gray': 'Light Bluish Gray',
      'turquoise': 'Turquoise',
      'dark turquoise': 'Dark Turquoise',

      'green': 'Green',
      'dark green': 'Green',
      'lime': 'Lime',
      'olive green': 'Green',
      'bright green': 'Bright Green',

      'pink': 'Magenta',
      'bright pink': 'Deep Pink',
      'medium dark pink': 'Dark Pink',
      'dark pink': 'Dark Pink',
      'coral': 'Deep Pink',
      'red': 'Red',
      'dark red': 'Dark Red',

      'yellow': 'Yellow',
      'light yellow': 'Light Yellow',
      'bright light yellow': 'Light Yellow',
      'orange': 'Bright Light Orange',
      'bright light orange': 'Bright Light Orange',
      'dark orange': 'Dark Orange',

      'white': 'White',
      'light gray': 'Light Bluish Gray',
      'light grey': 'Light Bluish Gray',
      'gray': 'Light Bluish Gray',
      'grey': 'Light Bluish Gray',
      'dark gray': 'Dark Bluish Gray',
      'dark grey': 'Dark Bluish Gray',

      'brown': 'Brown',
      'reddish brown': 'Brown',
      'dark brown': 'Brown',
      'tan': 'Tan',
      'nougat': 'Nougat',
      'medium nougat': 'Medium Nougat',
      'light nougat': 'Nougat',
      'dark tan': 'Tan',

      'magenta': 'Magenta',
      'purple': 'Magenta',
      'dark purple': 'Magenta',
      'lavender': 'Magenta',

      'gold': 'Pearl Gold',
      'silver': 'Pearl Gold',
      'pearl gold': 'Pearl Gold',

      'trans-clear': 'Trans-Clear',
      'transparent': 'Trans-Clear',
    };

    const normalized = color.toLowerCase();
    return colorMap[normalized] || 'All';
  };

  const buildPaths = () => {
    if (!partNum) return [];
    const folder = getColorFolder(colorName);

    const bases = [
      `/models/mecabricks/${modelSet}/${folder}`,
      `/models/mecabricks/${modelSet}/All`,
      `/models/mecabricks`,
    ];

    const paths = [];
    for (const base of bases) {
      paths.push({ url: `${base}/${partNum}.obj`,  type: 'obj',  base });
      paths.push({ url: `${base}/${partNum}.glb`,  type: 'glb',  base });
      paths.push({ url: `${base}/${partNum}.gltf`, type: 'gltf', base });
    }
    return paths;
  };

  const clearGroup = () => {
    if (!groupRef.current) return;
    while (groupRef.current.children.length > 0)
      groupRef.current.remove(groupRef.current.children[0]);
  };
  const applyColorIfNeeded = (model) => {
    if (!colorHex || !colorHex.startsWith('#')) return;
    const colorInt = parseInt(colorHex.slice(1), 16);

    model.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const allDefault = mats.every((m) => {
        const hex = m.color?.getHex?.();
        return hex === undefined || hex === 0xffffff || hex === 0x000000;
      });
      if (!allDefault) return; 

      if (Array.isArray(child.material)) {
        child.material = child.material.map((m) => {
          const c = m.clone(); c.color.setHex(colorInt); return c;
        });
      } else {
        const c = child.material.clone(); c.color.setHex(colorInt);
        child.material = c;
      }
    });
  };

  const centerAndScale = (model) => {
    const STUD = 0.55;

    model.updateMatrixWorld(true);
    const rawBox    = new THREE.Box3().setFromObject(model);
    const rawSize   = rawBox.getSize(new THREE.Vector3());
    const rawCenter = rawBox.getCenter(new THREE.Vector3());
    const candidates = [
      { name: 'LDU',  factor: STUD / 20   },
      { name: 'mm',   factor: STUD / 8    },
      { name: 'cm',   factor: STUD / 0.8  },
      { name: 'LDU½', factor: STUD / 10   },
    ];
    const rawMaxH = Math.max(rawSize.x, rawSize.z);
    let bestFactor = candidates[0].factor;
    for (const { name, factor } of candidates) {
      const studCount = (rawMaxH * factor) / STUD;
      if (studCount >= 0.4 && studCount <= 16) {
        bestFactor = factor;
        console.log(`✅ Part ${partNum}: ${name} scale (${factor.toFixed(5)}), studs≈${studCount.toFixed(1)}`);
        break;
      }
    }

    model.scale.setScalar(bestFactor);

    model.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

    model.position.x -= scaledCenter.x;
    model.position.z -= scaledCenter.z;
    model.position.y -= scaledBox.min.y;

    model.updateMatrixWorld(true);
    const finalBox  = new THREE.Box3().setFromObject(model);
    const finalSize = finalBox.getSize(new THREE.Vector3());
    console.log(`📐 Part ${partNum} final: ${finalSize.x.toFixed(3)} × ${finalSize.y.toFixed(3)} × ${finalSize.z.toFixed(3)}`);

    model.traverse((child) => {
      if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  };

  useEffect(() => {
    if (!partNum) { setLoadError(true); return; }

    let isMounted = true;
    setLoadError(false);
    setModelLoaded(false);
    clearGroup();

    const paths = buildPaths();

    const tryLoad = (index = 0) => {
      if (index >= paths.length) {
        console.warn(`❌ No 3D model found for part ${partNum} (set: ${modelSet}, color: ${colorName})`);
        if (isMounted) { setLoadError(true); setModelLoaded(false); }
        return;
      }

      const { url, type, base } = paths[index];
      console.log(`🔍 Trying [${index}] ${url}`);

      const onSuccess = (model) => {
        if (!isMounted) return;
        clearGroup();
        applyColorIfNeeded(model);
        centerAndScale(model);
        groupRef.current.add(model);
        console.log(`✅ Loaded part ${partNum} (color: ${colorName}) from: ${base}`);
        if (isMounted) { setModelLoaded(true); setLoadError(false); }
      };

      const onFail = (err) => {
        console.warn(`⚠️  Failed ${url}:`, err?.message || err);
        tryLoad(index + 1);
      };

      if (type === 'obj') {
        const mtlUrl = `${base}/${partNum}.mtl`;
        const mtlLoader = new MTLLoader();
        mtlLoader.setPath(`${base}/`);

        mtlLoader.load(
          mtlUrl,
          (materials) => {
            materials.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load(url, (obj) => onSuccess(obj), undefined, onFail);
          },
          undefined,
          () => {
            console.log(`ℹ️  No MTL at ${mtlUrl}, loading OBJ without materials`);
            const objLoader = new OBJLoader();
            objLoader.load(url, (obj) => onSuccess(obj), undefined, onFail);
          }
        );
        return;
      }

      if (type === 'glb' || type === 'gltf') {
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => onSuccess(gltf.scene.clone()), undefined, onFail);
        return;
      }

      tryLoad(index + 1);
    };

    tryLoad();
    return () => { isMounted = false; };
  }, [partNum, colorHex, colorName, modelSet]);

  useFrame((state) => {
    if (!groupRef.current || isPlaced || !modelLoaded) return;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.04;
    groupRef.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
  });
  const FallbackBrick = () => {
    const fc = colorHex || '#FC97AC';
    const dims = {
      // 1×N plates (height = 1 plate = 0.22)
      '3024': [0.55, 0.22, 0.55],   // Plate 1×1
      '3023': [1.10, 0.22, 0.55],   // Plate 1×2
      '3623': [1.65, 0.22, 0.55],   // Plate 1×3
      '3710': [2.20, 0.22, 0.55],   // Plate 1×4
      '3666': [3.30, 0.22, 0.55],   // Plate 1×6
      // 2×N plates
      '3022': [1.10, 0.22, 1.10],   // Plate 2×2
      '3021': [1.65, 0.22, 1.10],   // Plate 2×3
      '3020': [2.20, 0.22, 1.10],   // Plate 2×4
      // 1×N bricks (height = 3 plates = 0.44 … actually 1 brick = 3 plates)
      '3005': [0.55, 0.44, 0.55],   // Brick 1×1
      '3004': [1.10, 0.44, 0.55],   // Brick 1×2
      '3010': [2.20, 0.44, 0.55],   // Brick 1×4
      '3009': [3.30, 0.44, 0.55],   // Brick 1×6
      '3008': [4.40, 0.44, 0.55],   // Brick 1×8
      // 2×N bricks
      '3003': [1.10, 0.44, 1.10],   // Brick 2×2
      '3002': [1.65, 0.44, 1.10],   // Brick 2×3
      '3001': [2.20, 0.44, 1.10],   // Brick 2×4
    };
    const [w, h, d] = dims[partNum] || [0.55, 0.22, 0.55]; 

    const bodyY = h / 2;

    const studsX = Math.max(1, Math.round(w / 0.55));
    const studsZ = Math.max(1, Math.round(d / 0.55));

    return (
      <group>
        <mesh position={[0, bodyY, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={fc} roughness={0.3} metalness={0.08} />
        </mesh>
        {Array.from({ length: studsX }, (_, ix) =>
          Array.from({ length: studsZ }, (_, iz) => {
            const sx = studsX === 1 ? 0 : (ix / (studsX - 1) - 0.5) * (w - 0.55);
            const sz = studsZ === 1 ? 0 : (iz / (studsZ - 1) - 0.5) * (d - 0.55);
            return (
              <mesh key={`s-${ix}-${iz}`} position={[sx, h + 0.03, sz]} castShadow>
                <cylinderGeometry args={[0.10, 0.10, 0.06, 16]} />
                <meshStandardMaterial color={fc} roughness={0.25} />
              </mesh>
            );
          })
        )}
      </group>
    );
  };

  return (
    <group ref={groupRef} position={position} onClick={onPlace}>
      {loadError && <FallbackBrick />}
    </group>
  );
};

export default ProceduralLegoBrick;