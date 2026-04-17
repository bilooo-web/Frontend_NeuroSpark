// Frontend/src/components/customization/ProceduralLegoBrick.jsx
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

  // ─── Map Rebrickable color name → your exact folder name ──────────────────
  // Maps to exact folder names in public/models/mecabricks/stitch/
  const getColorFolder = (color) => {
    if (!color) return 'All';

    const colorMap = {
      // ── blacks ──
      'black': 'Black',

      // ── blues ──
      'blue': 'Blue',
      'dark blue': 'Dark Blue',
      'dark azure': 'Dark Azure',
      'medium azure': 'Blue',
      'bright light blue': 'Blue',
      'sand blue': 'Blue',
      'light bluish gray': 'Light Bluish Gray',
      'turquoise': 'Turquoise',
      'dark turquoise': 'Dark Turquoise',

      // ── greens ──
      'green': 'Green',
      'dark green': 'Green',
      'lime': 'Lime',
      'olive green': 'Green',
      'bright green': 'Bright Green',

      // ── pinks / reds ──
      'pink': 'Magenta',
      'bright pink': 'Deep Pink',
      'medium dark pink': 'Dark Pink',
      'dark pink': 'Dark Pink',
      'coral': 'Deep Pink',
      'red': 'Red',
      'dark red': 'Dark Red',

      // ── yellows / oranges ──
      'yellow': 'Yellow',
      'light yellow': 'Light Yellow',
      'bright light yellow': 'Light Yellow',
      'orange': 'Bright Light Orange',
      'bright light orange': 'Bright Light Orange',
      'dark orange': 'Dark Orange',

      // ── whites / grays ──
      'white': 'White',
      'light gray': 'Light Bluish Gray',
      'light grey': 'Light Bluish Gray',
      'gray': 'Light Bluish Gray',
      'grey': 'Light Bluish Gray',
      'dark gray': 'Dark Bluish Gray',
      'dark grey': 'Dark Bluish Gray',

      // ── browns / tans ──
      'brown': 'Brown',
      'reddish brown': 'Brown',
      'dark brown': 'Brown',
      'tan': 'Tan',
      'nougat': 'Nougat',
      'medium nougat': 'Medium Nougat',
      'light nougat': 'Nougat',
      'dark tan': 'Tan',

      // ── purples ──
      'magenta': 'Magenta',
      'purple': 'Magenta',
      'dark purple': 'Magenta',
      'lavender': 'Magenta',

      // ── metallics ──
      'gold': 'Pearl Gold',
      'silver': 'Pearl Gold',
      'pearl gold': 'Pearl Gold',

      // ── trans ──
      'trans-clear': 'Trans-Clear',
      'transparent': 'Trans-Clear',
    };

    const normalized = color.toLowerCase();
    return colorMap[normalized] || 'All';
  };

  // ─── Build ordered list of paths to try ───────────────────────────────────
  const buildPaths = () => {
    if (!partNum) return [];
    const folder = getColorFolder(colorName);

    // Priority: exact color folder first, then "All" fallback, then root
    const bases = [
      `/models/mecabricks/${modelSet}/${folder}`,
      `/models/mecabricks/${modelSet}/All`,
      `/models/mecabricks`,
    ];

    const paths = [];
    for (const base of bases) {
      // prefer .obj (so MTL colours load), then .glb / .gltf
      paths.push({ url: `${base}/${partNum}.obj`,  type: 'obj',  base });
      paths.push({ url: `${base}/${partNum}.glb`,  type: 'glb',  base });
      paths.push({ url: `${base}/${partNum}.gltf`, type: 'gltf', base });
    }
    return paths;
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const clearGroup = () => {
    if (!groupRef.current) return;
    while (groupRef.current.children.length > 0)
      groupRef.current.remove(groupRef.current.children[0]);
  };

  // Only override vertex colours if there is NO mtl-based material (i.e. the
  // model loaded grey). We detect that by checking if any material has a
  // non-default color already set by the MTL.
  const applyColorIfNeeded = (model) => {
    if (!colorHex || !colorHex.startsWith('#')) return;
    const colorInt = parseInt(colorHex.slice(1), 16);

    model.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const allDefault = mats.every((m) => {
        // MeshPhongMaterial/MeshStandardMaterial default color is 0xffffff
        const hex = m.color?.getHex?.();
        return hex === undefined || hex === 0xffffff || hex === 0x000000;
      });
      if (!allDefault) return; // MTL already provided real colour — keep it

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
    // ── Proportional scaling — preserve size relationships between pieces ─────
    //
    // The goal: every piece scales by the SAME factor so a 1×2 brick is twice
    // as wide as a 1×1, a 2×4 is four times as wide, etc.
    //
    // Problem: OBJ exporters use different units. Mecabricks can export in:
    //   • LDU  — 1 stud = 20 units   → scale = 0.55/20  = 0.02750
    //   • mm   — 1 stud =  8 mm      → scale = 0.55/8   = 0.06875
    //   • cm   — 1 stud =  0.8 cm    → scale = 0.55/0.8 = 0.68750
    //
    // Strategy: measure the raw bounding box, then try each known scale factor.
    // Pick the one that produces a "sane" LEGO piece size:
    //   reasonable stud count = largest horizontal dim / 0.55 should be 1–12.
    // ────────────────────────────────────────────────────────────────────────

    // Step 1: measure raw bounding box (no changes yet)
    const rawBox  = new THREE.Box3().setFromObject(model);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const rawCenter = rawBox.getCenter(new THREE.Vector3());

    // Step 2: try candidate scale factors (LDU, mm, cm, and a coarser LDraw variant)
    const STUD = 0.55; // scene-units per stud (matches cellSize in CanvasArea)
    const candidates = [
      { name: 'LDU',  factor: STUD / 20   },   // 0.02750
      { name: 'mm',   factor: STUD / 8    },    // 0.06875
      { name: 'cm',   factor: STUD / 0.8  },    // 0.68750
      { name: 'LDU½', factor: STUD / 10   },   // 0.05500 (some exporters halve LDU)
    ];

    // For each candidate, simulate the largest horizontal dimension after scaling
    // A sane LEGO piece sits between 0.4 studs (smaller than 1×1) and 16 studs wide.
    const rawMaxH = Math.max(rawSize.x, rawSize.z); // horizontal max (ignore Y)

    let bestFactor = candidates[0].factor;
    for (const { name, factor } of candidates) {
      const scaledMaxH = rawMaxH * factor;
      const studCount  = scaledMaxH / STUD;
      console.log(`🔍 Part ${partNum} — ${name}: maxH=${scaledMaxH.toFixed(3)}, studs≈${studCount.toFixed(1)}`);
      if (studCount >= 0.4 && studCount <= 16) {
        bestFactor = factor;
        console.log(`✅ Using ${name} scale (${factor}) for part ${partNum}`);
        break;
      }
    }

    // Step 3: center X/Z, align bottom to Y=0
    model.position.x -= rawCenter.x;
    model.position.z -= rawCenter.z;
    model.position.y -= rawBox.min.y;

    // Step 4: apply the chosen scale
    model.scale.multiplyScalar(bestFactor);

    // Step 5: re-snap bottom to Y=0 after scaling shifts things
    const boxAfter = new THREE.Box3().setFromObject(model);
    model.position.y -= boxAfter.min.y;

    // Debug: final size — a 1×2 plate should be ~1.10 × 0.22 × 0.55
    const finalSize = boxAfter.getSize(new THREE.Vector3());
    console.log(`📐 Part ${partNum} final: ${finalSize.x.toFixed(3)} × ${finalSize.y.toFixed(3)} × ${finalSize.z.toFixed(3)}`);

    model.traverse((child) => {
      if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
  };

  // ─── Load loop ────────────────────────────────────────────────────────────
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
        // ── Try to load MTL first, then OBJ ──────────────────────────────
        const mtlUrl = `${base}/${partNum}.mtl`;
        const mtlLoader = new MTLLoader();
        mtlLoader.setPath(`${base}/`); // so textures resolve correctly

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
            // No MTL found — load OBJ with plain colour
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partNum, colorHex, colorName, modelSet]);

  // ─── Idle animation for unplaced pieces ───────────────────────────────────
  useFrame((state) => {
    if (!groupRef.current || isPlaced || !modelLoaded) return;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.04;
    groupRef.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
  });

  // ─── Fallback box-brick when no model is found ────────────────────────────
  // Dimensions in scene units: 1 stud = 0.55, 1 plate = 0.22, 1 brick = 0.44
  const FallbackBrick = () => {
    const fc = colorHex || '#FC97AC';
    // [width, height, depth] — width/depth in stud units (×0.55), height in plate units (×0.22)
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
    const [w, h, d] = dims[partNum] || [0.55, 0.22, 0.55]; // default: 1×1 plate
    return (
      <group>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={fc} roughness={0.3} metalness={0.08} />
        </mesh>
        {/* stud(s) on top */}
        <mesh position={[0, h / 2 + 0.03, 0]} castShadow>
          <cylinderGeometry args={[0.10, 0.10, 0.06, 16]} />
          <meshStandardMaterial color={fc} roughness={0.25} />
        </mesh>
        {w > 0.7 && (
          <mesh position={[w * 0.37, h / 2 + 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.10, 0.10, 0.06, 16]} />
            <meshStandardMaterial color={fc} roughness={0.25} />
          </mesh>
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