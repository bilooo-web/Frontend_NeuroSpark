import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import UnlockErrorModal from './UnlockErrorModal';

const MODEL_SETS = {
  stitch:    '43249-1',
  simba:     '43247-1',
  flower:    '30404-1',
  wednesday: '76781-1',
  pikachu:   '72152-1',
  castle:    '40720-1',
};

const REBRICKABLE_KEY = 'df89f504066bb0f4ede8313f5829b2fe';

async function fetchAllParts(setNum) {
  let results = [];
  let url = `https://rebrickable.com/api/v3/lego/sets/${setNum}/parts/?key=${REBRICKABLE_KEY}&page_size=250`;
  while (url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      results = [...results, ...(data.results || [])];
      url = data.next || null;
    } catch (err) {
      console.error('Error fetching parts:', err);
      throw err;
    }
  }
  return results;
}

const seededRandom = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
};

const buildFreeSet = (parts) => {
  const byColor = {};
  parts.forEach((p) => {
    const c = p.color.name;
    if (!byColor[c]) byColor[c] = [];
    byColor[c].push(p);
  });

  const freePartNums = new Set();

  Object.entries(byColor).forEach(([colorName, colorParts]) => {
    const n = colorParts.length;

    if (n === 1) {
      freePartNums.add(String(colorParts[0].part.part_num));
      return;
    }

    const rand      = seededRandom(colorName);
    const freeCount = 1 + Math.floor(rand * (n - 1));

    const shuffled = [...colorParts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(colorName + i) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    shuffled.slice(0, freeCount).forEach((p) => {
      freePartNums.add(String(p.part.part_num));
    });
  });

  return freePartNums;
};

const getPiecePrice = (partNum) => {
  const hash = String(partNum).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const tier = hash % 3;
  if (tier === 0) return 800  + (hash % 700);
  if (tier === 1) return 1500 + (hash % 1500);
  return               3000  + (hash % 2000);
};

const formatPrice = (price) => price.toLocaleString();

const BrickPalette = ({
  modelId,
  onSelectPiece,
  onClose,
  usedCounts = {},
  userCoins = 0,
  onPurchasePiece,
  onPartsLoaded,          
}) => {
  const [parts,        setParts]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [activeColor,  setActiveColor]  = useState('all');
  const [selectedPart, setSelectedPart] = useState(null);
  const [draggingId,   setDraggingId]   = useState(null);
  const ghostRef = useRef(null);

  const setNum = MODEL_SETS[modelId] || MODEL_SETS.stitch;

  const [freePieces,     setFreePieces]     = useState(() => new Set());
  const [unlockedPieces, setUnlockedPieces] = useState(() => new Set());

  const isPieceLocked = useCallback((partNum) => {
    const key = String(partNum);
    return !freePieces.has(key) && !unlockedPieces.has(key);
  }, [freePieces, unlockedPieces]);

  const [errorModal, setErrorModal] = useState({ isOpen: false, pieceName: '', piecePrice: 0 });
  const closeErrorModal = () => setErrorModal({ isOpen: false, pieceName: '', piecePrice: 0 });

  const handleUnlockAttempt = (part) => {
    const partNum = String(part.part.part_num);
    if (!isPieceLocked(partNum)) return true;

    const price = getPiecePrice(partNum);
    const name  = part.part.name;

    if (userCoins >= price) {
      const ok = window.confirm(
        `Unlock "${name}" for ${formatPrice(price)} coins?\n\nYour balance: ${formatPrice(userCoins)} coins`
      );
      if (ok) {
        if (onPurchasePiece) onPurchasePiece(partNum, price);
        setUnlockedPieces(prev => new Set([...prev, partNum]));
        return true;
      }
      return false;
    } else {
      setErrorModal({ isOpen: true, pieceName: name, piecePrice: price });
      return false;
    }
  };

  const loadParts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setParts([]);
    setActiveColor('all');
    setFreePieces(new Set());
    setUnlockedPieces(new Set());
    try {
      const data = await fetchAllParts(setNum);
      data.sort((a, b) => a.color.name.localeCompare(b.color.name));
      setParts(data);
      setFreePieces(buildFreeSet(data));

      if (onPartsLoaded) {
        const totalQty = data.reduce((sum, p) => sum + (p.quantity || 1), 0);
        onPartsLoaded(totalQty);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [setNum, onPartsLoaded]);

  useEffect(() => { loadParts(); }, [loadParts]);
  useEffect(() => () => {
    if (ghostRef.current?.parentNode) document.body.removeChild(ghostRef.current);
  }, []);

  const COLOR_DISPLAY_NAMES = {
    'all': 'All', 'Black': 'Black', 'Blue': 'Blue', 'Green': 'Green',
    'Orange': 'Orange', 'Yellow': 'Yellow', 'Pink': 'Pink', 'Azure': 'Azure',
    'Dark Blue': 'Dark Blue', 'Gray': 'Gray', 'Dark Brown': 'Dark Brown_Orange',
    'Medium Dark Pink': 'Deep Pink', 'Bright Pink': 'Deep Pink', 'Red': 'Red',
    'Medium Azure': 'Turquoise', 'Dark Green': 'Dark Green', 'Light Gray': 'Light Gray',
    'Lime': 'Lime', 'Magenta': 'Magenta', 'Bright Light Blue': 'Light Azure',
    'Nougat': 'Nougat', 'Light Nougat': 'Light Nougat', 'Gold': 'Gold',
    'Coral': 'Light Red', 'Brown': 'Brown', 'Tan': 'Tan',
    'Trans-Clear': 'Trans-Clear', 'White': 'White',
    'Bright Light Yellow': 'Light Yellow', 'Dark Tan': 'Tan', 'Sand Blue': 'Blue',
    'Lavender': 'Light Azure', 'Reddish Brown': 'Brown', 'Dark Purple': 'Magenta',
    'Purple': 'Magenta', 'Silver': 'Gold', 'Turquoise': 'Turquoise',
  };
  const getDisplayName = (c) => c === 'all' ? 'All' : (COLOR_DISPLAY_NAMES[c] || c);
  const uniqueColors = ['all', ...new Set(parts.map(p => p.color.name))];

  const filtered = parts.filter(p => {
    const matchSearch =
      !searchTerm ||
      p.part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.part.part_num.toLowerCase().includes(searchTerm.toLowerCase());
    const matchColor = activeColor === 'all' || p.color.name === activeColor;
    return matchSearch && matchColor;
  });

  const colorStats = useMemo(() => {
    const stats = {};
    uniqueColors.forEach(colorName => {
      if (colorName === 'all') return;
      const cp        = parts.filter(p => p.color.name === colorName);
      const freeCount = cp.filter(p => freePieces.has(String(p.part.part_num))).length;
      stats[colorName] = { total: cp.length, freeCount, lockedCount: cp.length - freeCount };
    });
    return stats;
  }, [parts, freePieces]);

  const normalizePart = (part) => ({
    id: part.id, type: 'brick',
    name: part.part.name, partNum: String(part.part.part_num),
    color: part.color.name, colorName: part.color.name,
    colorHex: '#' + part.color.rgb, quantity: part.quantity,
    imageUrl: part.part.part_img_url, raw: part,
  });

  const getRemainingQuantity = (part) =>
    Math.max(0, part.quantity - (usedCounts[part.part.part_num] || 0));

 const handleDragStart = (e, part) => {
    if (!handleUnlockAttempt(part)) { e.preventDefault(); return; }
    setDraggingId(part.id);
    e.dataTransfer.setData('application/lego-piece', JSON.stringify(normalizePart(part)));
    e.dataTransfer.effectAllowed = 'copy';

    const ghost = document.createElement('div');
    ghost.style.cssText = `
      position:fixed;top:-9999px;left:-9999px;
      background:rgba(255,255,255,0.98);border-radius:16px;padding:12px;
      box-shadow:0 16px 48px rgba(0,0,0,0.4);border:3px solid #4299e1;
      width:140px;height:140px;display:flex;align-items:center;
      justify-content:center;pointer-events:none;z-index:10000;
    `;
    if (part.part.part_img_url) {
      const img = document.createElement('img');
      img.src = part.part.part_img_url;
      img.style.cssText = 'width:116px;height:116px;object-fit:contain;';
      img.draggable = false;
      ghost.appendChild(img);
    } else {
      const sq = document.createElement('div');
      sq.style.cssText = `width:116px;height:116px;border-radius:12px;background:#${part.color.rgb};border:2px solid rgba(0,0,0,0.15);`;
      ghost.appendChild(sq);
    }
    const lbl = document.createElement('div');
    lbl.style.cssText = `position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:9px;font-weight:700;color:#4a5568;font-family:sans-serif;`;
    lbl.textContent = `×${part.quantity}`;
    ghost.appendChild(lbl);
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    e.dataTransfer.setDragImage(ghost, 70, 70);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    if (ghostRef.current?.parentNode) {
      document.body.removeChild(ghostRef.current);
      ghostRef.current = null;
    }
  };

  const handleSelect = (part) => {
    if (!handleUnlockAttempt(part)) return;
    setSelectedPart(part);
    onSelectPiece(normalizePart(part));
  };

  const getSetDisplayName = (id) => ({
    stitch: '🐚 Stitch', simba: '🦁 Young Simba', flower: '🌸 Friendship Flower',
    wednesday: '🏴 Wednesday Dorm', pikachu: '⚡ Pikachu', castle: '👑 Sleeping Beauty',
  }[id] || '🧱 Set');

  if (loading) return (
    <div className="brick-palette">
      <div className="palette-header">
        <h3>BRICK PALETTE</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="palette-loading">
        <div className="palette-spinner" />
        <p className="palette-loading-text">Loading LEGO pieces...</p>
        <p className="palette-loading-sub">Set {setNum}</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="brick-palette">
      <div className="palette-header">
        <h3>BRICK PALETTE</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="palette-error">
        <span style={{ fontSize: 28 }}>⚠️</span>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#c53030', margin: 0 }}>Connection Error</p>
        <p style={{ fontSize: 10, color: '#718096', margin: 0 }}>{error}</p>
        <button className="palette-retry-btn" onClick={loadParts}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="brick-palette">

      <div className="palette-header">
        <div>
          <h3 style={{ margin: 0 }}>BRICK PALETTE</h3>
          <span style={{ fontSize: 9, color: '#718096' }}>{filtered.length} / {parts.length} parts</span>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 6, padding: '4px 8px',
        background: 'rgba(255,255,255,0.6)', borderRadius: 8, marginBottom: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#718096' }}>SET {setNum}</span>
          <span style={{ fontSize: 10, color: '#4a5568' }}>·</span>
          <span style={{ fontSize: 11 }}>{getSetDisplayName(modelId)}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(0,0,0,0.07)', borderRadius: 20, padding: '2px 8px',
        }}>
          <span style={{ fontSize: 13 }}>🪙</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#b7791f', letterSpacing: 0.3 }}>
            {formatPrice(userCoins)}
          </span>
        </div>
      </div>

      <div className="palette-search">
        <input
          type="text"
          placeholder="Search parts or number…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="color-filter-strip">
        {uniqueColors.map(colorName => {
          const match = parts.find(p => p.color.name === colorName);
          const hex   = match ? '#' + match.color.rgb : '#ccc';
          const stats = colorStats[colorName];
          return (
            <button
              key={colorName}
              className={`color-chip ${activeColor === colorName ? 'active' : ''}`}
              onClick={() => setActiveColor(colorName)}
              title={stats ? `${stats.freeCount} free · ${stats.lockedCount} locked` : ''}
            >
              {colorName !== 'all' && (
                <span className="color-chip-dot" style={{ background: hex }} />
              )}
              {getDisplayName(colorName)}
            </button>
          );
        })}
      </div>

      <div className="brick-grid">
        {filtered.length === 0 ? (
          <div className="brick-no-results">No parts found</div>
        ) : filtered.map(part => {
          const hex         = '#' + part.color.rgb;
          const isSelected  = selectedPart?.id === part.id;
          const isDragging  = draggingId === part.id;
          const remaining   = getRemainingQuantity(part);
          const isExhausted = remaining <= 0;
          const locked      = isPieceLocked(part.part.part_num);
          const lockPrice   = getPiecePrice(part.part.part_num);
          const canAfford   = userCoins >= lockPrice;

          return (
            <div
              key={part.id}
              className={`brick-tile${isSelected ? ' selected' : ''}${isDragging ? ' dragging' : ''}${isExhausted ? ' exhausted' : ''}${locked ? ' locked' : ''}`}
              draggable={!isExhausted}
              onDragStart={e => !isExhausted ? handleDragStart(e, part) : e.preventDefault()}
              onDragEnd={handleDragEnd}
              onClick={() => !isExhausted && handleSelect(part)}
              style={{
                position: 'relative',
                opacity:  isExhausted ? 0.45 : 1,
                cursor:   isExhausted ? 'not-allowed' : 'pointer',
              }}
              title={locked
                ? `🔒 ${part.part.name} — unlock for ${formatPrice(lockPrice)} coins`
                : `${part.part.name} · ×${remaining} left`
              }
            >
              <span className="brick-qty-badge">
                {isExhausted ? '✓ Used' : `×${remaining} left`}
              </span>

              {!locked && (
                <div style={{
                  position: 'absolute', top: 6, left: 6, zIndex: 5,
                  background: 'linear-gradient(135deg,#FFD700,#FFA500)',
                  color: '#1a1a1a', fontWeight: 800, fontSize: 7,
                  padding: '2px 6px', borderRadius: 10,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  letterSpacing: 0.4,
                }}>
                  FREE
                </div>
              )}

              {locked && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  borderRadius: 'inherit',
                  background: 'rgba(0,0,0,0.58)',
                  backdropFilter: 'blur(2px)',
                }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>🔒</span>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    background: 'rgba(0,0,0,0.82)',
                    border: `1px solid ${canAfford ? 'rgba(255,215,0,0.75)' : 'rgba(255,90,90,0.6)'}`,
                    borderRadius: 20, padding: '2px 8px',
                  }}>
                    <span style={{ fontSize: 11 }}>🪙</span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
                      color: canAfford ? '#FFD700' : '#ff6b6b',
                    }}>
                      {formatPrice(lockPrice)}
                    </span>
                  </div>

                  <span style={{
                    fontSize: 8, color: 'white', fontWeight: 500,
                    background: 'rgba(0,0,0,0.6)',
                    padding: '2px 7px', borderRadius: 10,
                  }}>
                    {canAfford ? 'Click to unlock' : 'Not enough coins'}
                  </span>
                </div>
              )}

              {/* Image or colour swatch */}
              {part.part.part_img_url ? (
                <img
                  src={part.part.part_img_url}
                  alt={part.part.name}
                  className="brick-part-img"
                  draggable={false}
                  loading="lazy"
                  onError={e => { e.target.style.display = 'none'; }}
                  style={{ filter: locked ? 'brightness(0.3) blur(1px)' : 'none' }}
                />
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: 8, background: hex,
                  margin: '0 auto 4px', border: '0.5px solid rgba(0,0,0,0.1)',
                  filter: locked ? 'brightness(0.3) blur(1px)' : 'none',
                }} />
              )}

              <span className="brick-color-dot" style={{ background: hex, display: 'block' }} />
              <div className="brick-name">{part.part.name}</div>
            </div>
          );
        })}
      </div>

      {/* Selected piece bar */}
      {selectedPart && (
        <div className="selected-piece-bar">
          {selectedPart.part.part_img_url && (
            <img src={selectedPart.part.part_img_url} alt={selectedPart.part.name} />
          )}
          <div className="selected-piece-info">
            <div className="selected-piece-name">{selectedPart.part.name}</div>
            <div className="selected-piece-meta">
              #{selectedPart.part.part_num} · {selectedPart.color.name} · ×{selectedPart.quantity}
            </div>
          </div>
          <span style={{
            width: 12, height: 12, borderRadius: '50%',
            background: '#' + selectedPart.color.rgb,
            border: '0.5px solid rgba(0,0,0,0.2)',
            flexShrink: 0, display: 'inline-block',
          }} />
        </div>
      )}

      {/* Not-enough-coins modal */}
      <UnlockErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeErrorModal}
        gameName={errorModal.pieceName}
        gamePrice={errorModal.piecePrice}
        userCoins={userCoins}
        formatPrice={formatPrice}
      />
    </div>
  );
};

export default BrickPalette;