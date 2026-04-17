import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ProceduralLegoBrick from './ProceduralLegoBrick';

// ─── Color map ────────────────────────────────────────────────────────────
const COLOR_MAP = {
  'Black': '#1B2A34', 'Blue': '#0055BF', 'Red': '#C91A09',
  'Yellow': '#F2CD37', 'Green': '#237841', 'White': '#FFFFFF',
  'Orange': '#FE8A18', 'Dark Brown': '#352100', 'Brown': '#6C3F18',
  'Medium Dark Pink': '#F785B1', 'Bright Pink': '#FF007F', 'Pink': '#FC97AC',
  'Medium Azure': '#36AEBF', 'Azure': '#078BC9', 'Magenta': '#923978',
  'Lime': '#BBE90B', 'Tan': '#E4CD9E', 'Dark Tan': '#958A73',
  'Sand Blue': '#5A7184', 'Dark Blue': '#0A3463', 'Lavender': '#E1D5ED',
  'Dark Purple': '#3F3691', 'Purple': '#81007B', 'Nougat': '#D09168',
  'Light Nougat': '#F6D7B3', 'Turquoise': '#008E9B', 'Gold': '#DBAC34',
  'Silver': '#A0A5A9', 'Dark Gray': '#6D6E5C', 'Light Gray': '#9BA19D',
  'Gray': '#9BA19D', 'Dark Green': '#184632', 'Coral': '#FF698F',
  'Bright Light Blue': '#9FC3E9', 'Bright Light Yellow': '#FFE001',
  'Reddish Brown': '#89351D',
  red: '#C91A09', blue: '#0055BF', yellow: '#F2CD37',
  green: '#237841', brown: '#6C3F18', black: '#1B2A34',
  white: '#FFFFFF', pink: '#FC97AC', orange: '#FE8A18',
};

function resolveColor(c) {
  if (!c) return '#C41E3A';
  if (c.startsWith('#')) return c;
  return COLOR_MAP[c] || COLOR_MAP[c.toLowerCase()] || '#C41E3A';
}

// ─── Instruction page config ──────────────────────────────────────────────
const INSTR_BASE  = 'https://lego.brickinstructions.com/instructions/43000/43249/';
const THUMB_BASE  = 'https://lego.brickinstructions.com/thumbnails/43000/43249/';
const TOTAL_PAGES = 152;
const pageUrl  = (n) => INSTR_BASE + String(n).padStart(3, '0') + '.jpg';
const thumbUrl = (n) => THUMB_BASE  + String(n).padStart(3, '0') + '.jpg';

// ─── LEGO Stud-Snap System ───────────────────────────────────────────────
const STUD  = 0.55;
const PLATE = 0.22;

const PART_DIMS = {
  '3024':[1,1,1],'3023':[2,1,1],'3623':[3,1,1],
  '3710':[4,1,1],'3666':[6,1,1],'3460':[8,1,1],
  '3022':[2,2,1],'3021':[3,2,1],'3020':[4,2,1],'2445':[12,2,1],
  '3005':[1,1,3],'3004':[2,1,3],'3622':[3,1,3],
  '3010':[4,1,3],'3009':[6,1,3],'3008':[8,1,3],
  '3003':[2,2,3],'3002':[3,2,3],'3001':[4,2,3],
  '54200':[1,1,1],'85984':[2,1,1],'3040b':[2,1,2],
  '15068':[2,2,1],'93273':[4,1,1],'11477':[2,1,1],
  '4073':[1,1,1],'98138':[1,1,1],'3070b':[1,1,1],
  '3069b':[2,1,1],'2412b':[2,1,1],
};

function getPartDims(partNum) {
  if (!partNum) return [1, 1, 1];
  const base = String(partNum).replace(/[a-zA-Z]+$/, '');
  return PART_DIMS[partNum] || PART_DIMS[base] || [1, 1, 1];
}

function buildHeightMap(placedPieces, excludeId = null) {
  const map = {};
  for (const p of placedPieces) {
    if (p.id != null && p.id === excludeId) continue;
    const [sw, sd, sh] = getPartDims(p.partNum);
    const topH = (p.stackPlates || 0) + sh;
    for (let dx = 0; dx < sw; dx++)
      for (let dz = 0; dz < sd; dz++) {
        const key = `${p.x + dx},${p.z + dz}`;
        map[key] = Math.max(map[key] || 0, topH);
      }
  }
  return map;
}

function getSnapHeight(heightMap, x, z, partNum) {
  const [sw, sd] = getPartDims(partNum);
  let maxH = 0;
  for (let dx = 0; dx < sw; dx++)
    for (let dz = 0; dz < sd; dz++)
      maxH = Math.max(maxH, heightMap[`${x + dx},${z + dz}`] || 0);
  return maxH;
}

const BASEPLATE_TOP = 0.035;
function platesToY(plates) { return BASEPLATE_TOP + plates * PLATE; }

// ─── Audio ────────────────────────────────────────────────────────────────
function makeCtx() {
  try { return new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
}
function playSnapSound() {
  const ctx = makeCtx(); if (!ctx) return;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.exp(-i/ctx.sampleRate*140) * 0.7;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=3000; f.Q.value=1.5;
  src.connect(f); f.connect(ctx.destination); src.start();
}
function playPickupSound() {
  const ctx = makeCtx(); if (!ctx) return;
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type='sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime+0.06);
  g.gain.setValueAtTime(0.07, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime+0.1);
  osc.start(); osc.stop(ctx.currentTime+0.1);
}
function playRemoveSound() {
  const ctx = makeCtx(); if (!ctx) return;
  const buf = ctx.createBuffer(1, ctx.sampleRate*0.09, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1)*Math.exp(-i/ctx.sampleRate*55)*0.5;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=700;
  src.connect(f); f.connect(ctx.destination); src.start();
}
function playHoverTick() {
  const ctx = makeCtx(); if (!ctx) return;
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.frequency.value=1100;
  g.gain.setValueAtTime(0.015, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime+0.03);
  osc.start(); osc.stop(ctx.currentTime+0.03);
}

// ─── Ghost preview ────────────────────────────────────────────────────────
const GhostPiece = ({ piece, x, z, heightMap, gridWidth, gridHeight, cellSize }) => {
  const [sw, sd] = getPartDims(piece?.partNum);
  const snapPlates = getSnapHeight(heightMap, x, z, piece?.partNum);
  const xPos = (x - gridWidth/2 + 0.5) * cellSize + (sw-1)*cellSize/2;
  const yPos = platesToY(snapPlates) + PLATE * 0.4;
  const zPos = (z - gridHeight/2 + 0.5) * cellSize + (sd-1)*cellSize/2;
  const color = piece?.colorHex || '#4299e1';
  const t = useRef(0);
  const meshRef = useRef();
  useFrame((_, delta) => {
    t.current += delta * 3;
    if (meshRef.current) meshRef.current.position.y = yPos + Math.sin(t.current)*0.012;
  });

  return (
    <group ref={meshRef} position={[xPos, yPos, zPos]}>
      <mesh>
        <boxGeometry args={[sw*cellSize-0.06, PLATE*0.55, sd*cellSize-0.06]} />
        <meshStandardMaterial color={color} transparent opacity={0.32} depthWrite={false} />
      </mesh>
      {/* stud rings */}
      {Array.from({length:sw},(_,dx)=>Array.from({length:sd},(_,dz)=>(
        <mesh key={`gs-${dx}-${dz}`}
          position={[(dx-(sw-1)/2)*cellSize, PLATE*0.28, (dz-(sd-1)/2)*cellSize]}>
          <cylinderGeometry args={[0.2,0.2,0.035,20]} />
          <meshStandardMaterial color={color} transparent opacity={0.55} depthWrite={false} />
        </mesh>
      )))}
    </group>
  );
};

// ─── Stud footprint highlights on baseplate ───────────────────────────────
const StudHighlights = ({ cells, gridWidth, gridHeight, cellSize, valid }) => (
  <>
    {cells.map(({ x, z }, i) => {
      if (x < 0||x>=gridWidth||z<0||z>=gridHeight) return null;
      const px = (x - gridWidth/2 + 0.5)*cellSize;
      const pz = (z - gridHeight/2 + 0.5)*cellSize;
      return (
        <mesh key={`hl-${i}`} position={[px, -0.052, pz]}>
          <boxGeometry args={[cellSize-0.05, 0.008, cellSize-0.05]} />
          <meshStandardMaterial color={valid?'#00ff88':'#ff4444'}
            transparent opacity={0.65} depthWrite={false} />
        </mesh>
      );
    })}
  </>
);

// ─── Single interactive placed piece ─────────────────────────────────────
const PlacedPiece = ({ piece, idx, isHeld, isHovered, onPickUp, onRightClick, gridWidth, gridHeight, cellSize }) => {
  const groupRef = useRef();
  const yBase = platesToY(piece.stackPlates || 0);
  const targetY = useRef(yBase);
  const currentY = useRef(yBase);
  const xPos = (piece.x - gridWidth/2 + 0.5)*cellSize;
  const zPos = (piece.z - gridHeight/2 + 0.5)*cellSize;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Smooth lift when picked up
    targetY.current = isHeld ? yBase + 0.6 : yBase;
    currentY.current += (targetY.current - currentY.current) * Math.min(1, delta*20);
    groupRef.current.position.y = currentY.current;
    // Gentle hover wobble
    if (isHovered && !isHeld) {
      groupRef.current.rotation.y = Math.sin(Date.now()*0.003)*0.06;
    } else {
      groupRef.current.rotation.y *= 0.85;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[xPos, yBase, zPos]}
      onClick={(e) => { e.stopPropagation(); onPickUp(piece, idx); }}
      onContextMenu={(e) => { e.stopPropagation(); e.nativeEvent?.preventDefault(); onRightClick(piece, idx); }}
    >
      <ProceduralLegoBrick
        partNum={piece.partNum}
        colorHex={piece.colorHex}
        colorName={piece.color}
        modelSet={piece.modelSet || 'stitch'}
        position={[0, 0, 0]}
        isPlaced
      />
      {/* Gold glow ring on hover */}
      {isHovered && !isHeld && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.22, 0.32, 28]} />
          <meshStandardMaterial color="#FFD700" transparent opacity={0.75}
            side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};

// ─── Building Grid ────────────────────────────────────────────────────────
const BuildingGrid = ({ width, height, cellSize, onCellClick, onCellHover,
  hoveredCell, dropTargetCell, highlightCells }) => {
  const cells = [];
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < height; z++) {
      const isHov  = hoveredCell?.x===x && hoveredCell?.z===z;
      const isDrop = dropTargetCell?.x===x && dropTargetCell?.z===z;
      const isHL   = highlightCells?.some(c=>c.x===x&&c.z===z);
      cells.push(
        <mesh key={`cell-${x}-${z}`}
          position={[(x-width/2+0.5)*cellSize, -0.04, (z-height/2+0.5)*cellSize]}
          onClick={()=>onCellClick(x,z)}
          onPointerOver={()=>onCellHover(x,z)}
          onPointerOut={()=>onCellHover(null,null)}
        >
          <boxGeometry args={[cellSize-0.03, 0.025, cellSize-0.03]} />
          <meshStandardMaterial
            color={isHL?'#90cdf4':isDrop?'#4299e1':isHov?'#FFD966':'#D4A373'}
            transparent opacity={isHL?0.85:isDrop?0.9:isHov?0.75:0.45}
          />
        </mesh>
      );
    }
  }
  return (
    <group>
      <mesh position={[0,-0.09,0]} receiveShadow>
        <boxGeometry args={[width*cellSize+0.3, 0.07, height*cellSize+0.3]} />
        <meshStandardMaterial color="#C8A96E" roughness={0.65} />
      </mesh>
      {Array.from({length:width},(_,x)=>Array.from({length:height},(_,z)=>(
        <mesh key={`stud-${x}-${z}`}
          position={[(x-width/2+0.5)*cellSize,-0.04,(z-height/2+0.5)*cellSize]}>
          <cylinderGeometry args={[0.06,0.06,0.03,10]} />
          <meshStandardMaterial color="#B89860" roughness={0.5} />
        </mesh>
      )))}
      {cells}
    </group>
  );
};

// ─── Instruction Panel ────────────────────────────────────────────────────
const InstructionPanel = ({ onClose, onPageChange }) => {
  const [page,setPage]=[useState(1)[0],useState(1)[1]]; // hoisted below
  const [pg, setPg]           = useState(1);
  const [imgLoaded,setImgLoaded] = useState(false);
  const [expanded,setExpanded]   = useState(false);
  const jumpRef = useRef(null);
  const goPage=(d)=>{ const n=pg+d; if(n>=1&&n<=TOTAL_PAGES){setImgLoaded(false);setPg(n);onPageChange?.(n);} };
  const jumpTo=()=>{ const v=parseInt(jumpRef.current?.value); if(v>=1&&v<=TOTAL_PAGES){setImgLoaded(false);setPg(v);onPageChange?.(v);} };
  const pct = Math.round(((pg-1)/(TOTAL_PAGES-1))*100);
  const iBtn=(bg,c)=>({width:28,height:28,border:'none',borderRadius:7,background:bg,color:c,cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0});
  const nav=(s)=>({position:'absolute',[s]:6,top:'50%',transform:'translateY(-50%)',width:30,height:30,background:'rgba(255,255,255,0.9)',border:'none',borderRadius:'50%',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',color:'#4a5568',zIndex:10});
  return (
    <>
      {expanded&&<div onClick={()=>setExpanded(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)',zIndex:149}}/>}
      <div style={{position:'absolute',top:0,right:0,bottom:0,width:expanded?'88%':'400px',maxWidth:'100%',background:'#EAFBF7',display:'flex',flexDirection:'column',zIndex:150,boxShadow:'-6px 0 40px rgba(0,0,0,0.2)',borderRadius:'0 20px 20px 0',overflow:'hidden',transition:'width 0.25s ease'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',background:'linear-gradient(135deg,#fef7ff,#fff0f6)',borderBottom:'0.5px solid #f0e6f0',flexShrink:0}}>
          <span style={{fontSize:22}}>📖</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:'#2d3748'}}>Building Instructions</div>
            <div style={{fontSize:9,color:'#a0aec0',marginTop:1}}>Stitch · LEGO 43249 · {TOTAL_PAGES} pages</div>
          </div>
          <div style={{background:'#FC97AC',color:'white',fontSize:11,fontWeight:700,padding:'3px 11px',borderRadius:20,flexShrink:0}}>{pg}/{TOTAL_PAGES}</div>
          <button onClick={()=>setExpanded(e=>!e)} style={iBtn('#ede9fe','#6d28d9')}>{expanded?'⊡':'⊞'}</button>
          <button onClick={onClose} style={iBtn('#fee2e2','#c53030')}>✕</button>
        </div>
        <div style={{height:3,background:'#f0e6f0',flexShrink:0}}><div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#FC97AC,#d53f8c)',transition:'width 0.35s ease'}}/></div>
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#fafaf5',position:'relative',overflow:'hidden',padding:'8px 40px'}}>
          <button onClick={()=>goPage(-1)} disabled={pg<=1} style={nav('left')}>‹</button>
          {!imgLoaded&&<div style={{position:'absolute',width:36,height:36,border:'3px solid #3AC7C1',borderTop:'3px solid #FC97AC',borderRadius:'50%',animation:'spin 0.75s linear infinite'}}/>}
          <img key={pg} src={pageUrl(pg)} alt={`p${pg}`} onLoad={()=>setImgLoaded(true)}
            style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:8,boxShadow:'0 6px 24px rgba(0,0,0,0.1)',opacity:imgLoaded?1:0,transition:'opacity 0.2s'}}/>
          <button onClick={()=>goPage(1)} disabled={pg>=TOTAL_PAGES} style={nav('right')}>›</button>
        </div>
        <div style={{display:'flex',gap:4,padding:'5px 10px',overflowX:'auto',background:'#fff',borderTop:'0.5px solid #f0e6f0',flexShrink:0,scrollbarWidth:'none'}}>
          {Array.from({length:TOTAL_PAGES},(_,i)=>i+1).map(n=>(
            <div key={n} onClick={()=>{setImgLoaded(false);setPg(n);}} style={{flexShrink:0,width:32,height:32,borderRadius:5,overflow:'hidden',cursor:'pointer',border:n===pg?'2px solid #FC97AC':'1.5px solid transparent',opacity:n===pg?1:0.5}}>
              <img src={thumbUrl(n)} alt={n} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
            </div>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderTop:'0.5px solid #f0e6f0',background:'white',flexShrink:0}}>
          <button onClick={()=>goPage(-1)} disabled={pg<=1} style={{padding:'5px 12px',background:'#f7fafc',border:'0.5px solid #e2e8f0',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',color:'#4a5568'}}>← Prev</button>
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <span style={{fontSize:10,color:'#a0aec0'}}>Jump to</span>
            <input ref={jumpRef} type="number" defaultValue={pg} key={`j${pg}`} min={1} max={TOTAL_PAGES} onKeyDown={e=>e.key==='Enter'&&jumpTo()} style={{width:52,padding:'4px 6px',border:'0.5px solid #e2e8f0',borderRadius:6,fontSize:12,textAlign:'center'}}/>
            <button onClick={jumpTo} style={{padding:'4px 10px',background:'#FC97AC',color:'white',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>Go</button>
          </div>
          <button onClick={()=>goPage(1)} disabled={pg>=TOTAL_PAGES} style={{padding:'5px 12px',background:'#f7fafc',border:'0.5px solid #e2e8f0',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',color:'#4a5568'}}>Next →</button>
        </div>
      </div>
    </>
  );
};

// ─── Main CanvasArea ──────────────────────────────────────────────────────
const CanvasArea = ({
  model, placedPieces, currentStep, onPlacePiece,
  selectedPiece, onDropPiece, onRemovePiece, onMovePiece,
  onInstructionPageChange, usedCounts = {},
}) => {
  const cellSize   = 0.55;
  const gridWidth  = model?.gridSize?.[0] || 12;
  const gridHeight = model?.gridSize?.[1] || 10;
  const currentStepData = model?.steps?.[currentStep-1];

  const [hoveredCell,      setHoveredCell]      = useState(null);
  const [hoveredPieceIdx,  setHoveredPieceIdx]  = useState(null);
  const [heldPiece,        setHeldPiece]        = useState(null);
  const [ghostCell,        setGhostCell]        = useState(null);
  const [isDragOver,       setIsDragOver]       = useState(false);
  const [dropTargetCell,   setDropTargetCell]   = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const orbitRef   = useRef(null);
  const canvasRef  = useRef(null);
  const lastGhostKey = useRef('');

  // Disable orbit controls while holding a piece (so camera doesn't rotate on drag)
  useEffect(() => {
    if (orbitRef.current) orbitRef.current.enabled = !heldPiece && !selectedPiece;
  }, [heldPiece, selectedPiece]);

  // Height map — exclude currently held piece so it doesn't block its own landing spot
  const heightMap = buildHeightMap(placedPieces, heldPiece?.piece?.id);

  // Active piece (held or selected from palette)
  const activePiece = heldPiece?.piece || selectedPiece;
  const activeCell  = ghostCell;
  const [sw, sd]    = getPartDims(activePiece?.partNum);

  // Stud highlight cells under ghost
  const highlightCells = activeCell && activePiece
    ? Array.from({length:sw},(_,dx)=>Array.from({length:sd},(_,dz)=>({x:activeCell.x+dx,z:activeCell.z+dz}))).flat()
    : [];

  // Pick up a placed piece
  const handlePickUp = useCallback((piece, idx) => {
    playPickupSound();
    setHeldPiece({ piece, originalIdx: idx });
    setGhostCell({ x: piece.x, z: piece.z });
    setHoveredPieceIdx(null);
  }, []);

  // Right-click remove
  const handleRightClick = useCallback((piece, idx) => {
    playRemoveSound();
    onRemovePiece?.(idx);
    if (heldPiece?.originalIdx === idx) { setHeldPiece(null); setGhostCell(null); }
  }, [onRemovePiece, heldPiece]);

  // Grid cell click
  const handleCellClick = (x, z) => {
    if (heldPiece) {
      const snapPlates = getSnapHeight(heightMap, x, z, heldPiece.piece.partNum);
      onMovePiece?.(heldPiece.originalIdx, { ...heldPiece.piece, x, z, stackPlates: snapPlates });
      playSnapSound();
      setHeldPiece(null);
      setGhostCell(null);
      return;
    }
    if (selectedPiece) {
      const currentUsed = usedCounts?.[selectedPiece.partNum] || 0;
      const maxQty = selectedPiece.quantity || 1;
      if (currentUsed >= maxQty) { alert(`No more ${selectedPiece.name} left! (${maxQty} used)`); return; }
      const snapPlates = getSnapHeight(heightMap, x, z, selectedPiece.partNum);
      onPlacePiece({ ...selectedPiece, x, z, stackPlates: snapPlates }, x, z);
      playSnapSound();
    }
  };

  // Grid cell hover — update ghost and play tick
  const handleCellHover = (x, z) => {
    if (x === null) { setHoveredCell(null); return; }
    setHoveredCell({ x, z });
    if (activePiece) {
      const key = `${x},${z}`;
      if (key !== lastGhostKey.current) {
        lastGhostKey.current = key;
        playHoverTick();
        setGhostCell({ x, z });
      }
    }
  };

  // Escape cancels held piece
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && heldPiece) {
        // Return piece to original position
        onMovePiece?.(heldPiece.originalIdx, heldPiece.piece);
        setHeldPiece(null);
        setGhostCell(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [heldPiece, onMovePiece]);

  // HTML drag from palette
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const gx = Math.max(0,Math.min(gridWidth-1,  Math.floor(((e.clientX-rect.left)/rect.width)*gridWidth)));
      const gz = Math.max(0,Math.min(gridHeight-1, Math.floor((1-(e.clientY-rect.top)/rect.height)*gridHeight)));
      setDropTargetCell({ x:gx, z:gz });
      setGhostCell({ x:gx, z:gz });
    }
  };
  const handleDragLeave = () => { setIsDragOver(false); setDropTargetCell(null); setGhostCell(null); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData('application/lego-piece');
    if (!raw) { setDropTargetCell(null); setGhostCell(null); return; }
    let piece; try { piece=JSON.parse(raw); } catch { setDropTargetCell(null); setGhostCell(null); return; }
    const tx = dropTargetCell?.x ?? Math.floor(gridWidth/2);
    const tz = dropTargetCell?.z ?? Math.floor(gridHeight/2);
    const snapPlates = getSnapHeight(heightMap, tx, tz, piece.partNum);
    onDropPiece({ ...piece, x:tx, z:tz, stackPlates:snapPlates }, tx, tz);
    playSnapSound();
    setDropTargetCell(null);
    setGhostCell(null);
  };

  const cursorStyle = heldPiece ? 'grabbing' : selectedPiece ? 'crosshair' : 'default';

  return (
    <div
      ref={canvasRef}
      className={`canvas-area${isDragOver?' drag-over':''}`}
      style={{ cursor: cursorStyle }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Held piece banner ── */}
      {heldPiece && (
        <div style={{
          position:'absolute', top:12, left:'50%', transform:'translateX(-50%)',
          background:'rgba(0,0,0,0.78)', color:'white',
          padding:'7px 20px', borderRadius:24, fontSize:12, fontWeight:700,
          zIndex:100, pointerEvents:'none', backdropFilter:'blur(8px)',
          border:'1px solid rgba(255,255,255,0.18)',
          display:'flex', alignItems:'center', gap:10, boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <span style={{fontSize:18}}>🖐️</span>
          <span>Click a cell to place · <kbd style={{background:'rgba(255,255,255,0.18)',padding:'1px 7px',borderRadius:4,fontFamily:'monospace'}}>Esc</kbd> to cancel</span>
        </div>
      )}

      

      <div className="canvas-drop-hint"><span>Drop piece here</span></div>

      <Canvas
        shadows="soft"
        camera={{ position:[5,4,6], fov:42 }}
        style={{ background:'transparent', width:'100%', height:'100%' }}
        onPointerMissed={() => {
          if (heldPiece) { onMovePiece?.(heldPiece.originalIdx,heldPiece.piece); setHeldPiece(null); setGhostCell(null); }
        }}
      >
        <color attach="background" args={['#EAFBF7']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[6,10,6]} intensity={1.2} castShadow
          shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <pointLight position={[-3,4,2]} intensity={0.4} color="#FFCC88" />
        <pointLight position={[3,6,-3]} intensity={0.25} color="#CCE4FF" />

        {/* floor */}
        <mesh position={[0,-0.5,0]} receiveShadow>
          <boxGeometry args={[gridWidth*cellSize+2, 0.5, gridHeight*cellSize+2]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>

        <BuildingGrid
          width={gridWidth} height={gridHeight} cellSize={cellSize}
          onCellClick={handleCellClick}
          onCellHover={handleCellHover}
          hoveredCell={hoveredCell}
          dropTargetCell={dropTargetCell}
          highlightCells={highlightCells}
        />

        {/* Stud highlights under ghost */}
        {highlightCells.length > 0 && (
          <StudHighlights
            cells={highlightCells}
            gridWidth={gridWidth} gridHeight={gridHeight} cellSize={cellSize}
            valid={true}
          />
        )}

        {/* Ghost snap preview */}
        {ghostCell && activePiece && (
          <GhostPiece
            piece={activePiece}
            x={ghostCell.x} z={ghostCell.z}
            heightMap={heightMap}
            gridWidth={gridWidth} gridHeight={gridHeight} cellSize={cellSize}
          />
        )}

        {/* Placed pieces */}
        {placedPieces.map((piece, idx) => {
          const isBeingHeld = heldPiece?.piece?.id != null
            ? heldPiece.piece.id === piece.id
            : heldPiece?.originalIdx === idx;
          if (isBeingHeld) return null; // ghost shows instead
          return (
            <PlacedPiece
              key={piece.id || `p-${idx}`}
              piece={{ ...piece, modelSet: model?.id || 'stitch' }}
              idx={idx}
              isHeld={false}
              isHovered={hoveredPieceIdx === idx}
              onPickUp={handlePickUp}
              onRightClick={handleRightClick}
              gridWidth={gridWidth} gridHeight={gridHeight} cellSize={cellSize}
            />
          );
        })}

        {/* Step guide ghost pieces */}
        {currentStepData?.pieces.map((piece, idx) => {
          if (placedPieces.some(p => p.x===piece.x && p.z===piece.z)) return null;
          const xPos = (piece.x - gridWidth/2 + 0.5)*cellSize;
          const zPos = (piece.z - gridHeight/2 + 0.5)*cellSize;
          return (
            <ProceduralLegoBrick
              key={`g-${idx}`}
              partNum={piece.partNum||'3023'}
              colorHex={piece.colorHex}
              colorName={piece.color}
              modelSet={model?.id||'stitch'}
              position={[xPos, 0.45, zPos]}
              isPlaced={false}
              onPlace={() => handleCellClick(piece.x, piece.z)}
            />
          );
        })}

        <OrbitControls
          ref={orbitRef}
          enablePan enableZoom enableRotate
          zoomSpeed={1.1} rotateSpeed={0.75}
          target={[0,0.3,0]} minDistance={3} maxDistance={18}
        />
      </Canvas>

      {/* Controls */}
      <div className="canvas-controls-right">
        <button className="canvas-control-btn" title="Blueprint"
          onClick={()=>window.dispatchEvent(new CustomEvent('toggleBlueprint'))}>📋</button>
        <button className="canvas-control-btn" title="Palette"
          onClick={()=>window.dispatchEvent(new CustomEvent('togglePalette'))}>🧱</button>
        <button className="canvas-control-btn" title="Undo"
          onClick={()=>window.dispatchEvent(new CustomEvent('undoLastPiece'))}>↩️</button>
        <button className="canvas-control-btn" title="Instructions"
          onClick={()=>setShowInstructions(v=>!v)}
          style={{ background:showInstructions?'#3AC7C1':'rgba(219,234,254,0.92)',
            border:showInstructions?'2px solid #FC97AC':'none', position:'relative' }}>
          📖
          {showInstructions&&<span style={{position:'absolute',top:3,right:3,width:7,height:7,borderRadius:'50%',background:'#FC97AC',border:'2px solid white'}}/>}
        </button>
      </div>

      {showInstructions && (
        <InstructionPanel
          onClose={()=>setShowInstructions(false)}
          onPageChange={onInstructionPageChange}
        />
      )}
    </div>
  );
};

export default CanvasArea;