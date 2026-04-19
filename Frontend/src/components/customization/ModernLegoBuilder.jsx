import React, { useState, useEffect, useCallback } from 'react';
import BlueprintCard from './BlueprintCard';
import BrickPalette from './BrickPalette_MECABRICKS';
import CanvasArea from './CanvasArea_MECABRICKS';
import './ModernLegoBuilder.css';

let _pieceIdCounter = 0;
function nextPieceId() { return ++_pieceIdCounter; }

const STORAGE_PREFIX = 'lego-builder';
const saveKey  = (modelId, field) => `${STORAGE_PREFIX}:${modelId}:${field}`;
const loadJSON = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const saveJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

const ModernLegoBuilder = ({ model, userCoins = 0, onSpendCoins }) => {
  const modelId = model?.id || 'stitch';

  const [currentStep,  setCurrentStep]  = useState(() => loadJSON(saveKey(modelId, 'step'), 1));
  const [placedPieces, setPlacedPieces] = useState(() => {
    const saved = loadJSON(saveKey(modelId, 'placed'), []);
    if (saved.length > 0) {
      const maxId = Math.max(...saved.map(p => p.id || 0));
      _pieceIdCounter = Math.max(_pieceIdCounter, maxId);
    }
    return saved;
  });
  const [showBlueprint, setShowBlueprint] = useState(true);
  const [showPalette,   setShowPalette]   = useState(true);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [usedCounts,    setUsedCounts]    = useState(() => loadJSON(saveKey(modelId, 'used'), {}));

  useEffect(() => { saveJSON(saveKey(modelId, 'placed'), placedPieces); }, [placedPieces, modelId]);
  useEffect(() => { saveJSON(saveKey(modelId, 'used'),   usedCounts);   }, [usedCounts,   modelId]);
  useEffect(() => { saveJSON(saveKey(modelId, 'step'),   currentStep);  }, [currentStep,  modelId]);

  const [totalPiecesInModel,  setTotalPiecesInModel]  = useState(0);

  const [localCoins, setLocalCoins] = useState(userCoins);
  useEffect(() => { setLocalCoins(userCoins); }, [userCoins]);

  const handlePartsLoaded = useCallback((total) => {
    setTotalPiecesInModel(total);
  }, []);

  const progress = totalPiecesInModel > 0
    ? Math.min(100, Math.round((placedPieces.length / totalPiecesInModel) * 100))
    : 0;

  const handlePurchasePiece = useCallback((partNum, price) => {
    setLocalCoins(prev => Math.max(0, prev - price));

    const newTotal = Math.max(0, (parseInt(localStorage.getItem('totalCoins') || '0', 10) || 0) - price);
    localStorage.setItem('totalCoins', String(newTotal));

    window.dispatchEvent(new CustomEvent('coins-updated', { detail: { totalCoins: newTotal } }));

    if (onSpendCoins) onSpendCoins(price);
  }, [onSpendCoins]);

  const updateUsedCount = useCallback((partNum, increment = true) => {
    setUsedCounts(prev => ({
      ...prev,
      [partNum]: (prev[partNum] || 0) + (increment ? 1 : -1),
    }));
  }, []);

  const handlePlacePiece = (piece, x, z) => {
    const currentUsed = usedCounts[piece.partNum] || 0;
    const maxQuantity = piece.quantity || 1;
    if (currentUsed >= maxQuantity) {
      alert(`No more ${piece.name} left! You've used all ${maxQuantity} pieces.`);
      return;
    }
    const newPiece = {
      ...piece,
      id:       nextPieceId(),
      x, z,
      colorHex: piece.colorHex || piece.color,
      color:    piece.color    || 'pink',
      imageUrl: piece.imageUrl,
      name:     piece.name,
      partNum:  piece.partNum,
      quantity: piece.quantity,
    };
    setPlacedPieces(prev => [...prev, newPiece]);
    updateUsedCount(piece.partNum, true);
    playClick();
  };

  const handleDropPiece = (piece, x, z) => {
    const currentUsed = usedCounts[piece.partNum] || 0;
    const maxQuantity = piece.quantity || 1;
    if (currentUsed >= maxQuantity) {
      alert(`No more ${piece.name} left! You've used all ${maxQuantity} pieces.`);
      return;
    }
    handlePlacePiece(piece, x, z);
  };

  const handleRemovePiece = (idx) => {
    const piece = placedPieces[idx];
    if (piece) updateUsedCount(piece.partNum, false);
    setPlacedPieces(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMovePiece = (idx, updatedPiece) => {
    setPlacedPieces(prev => prev.map((p, i) => i === idx ? { ...p, ...updatedPiece } : p));
    playClick();
  };

  const playClick = () => {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 620;
      gain.gain.value = 0.05;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    } catch {} 
  };

  const nextStep = () => {
    const currentStepPieces = model?.steps?.[currentStep - 1]?.pieces || [];
    const placedCount = currentStepPieces.filter(piece =>
      placedPieces.some(p =>
        p.x === piece.x &&
        p.z === piece.z &&
        (piece.yStack == null || p.yStack === piece.yStack)
      )
    ).length;
    if (placedCount === currentStepPieces.length) {
      const totalSteps = model?.totalSteps || model?.steps?.length || 1;
      if (currentStep < totalSteps) setCurrentStep(s => s + 1);
      else alert(`🎉 Congratulations! You completed ${model?.name}! 🎉`);
    } else {
      alert(`Place all ${currentStepPieces.length} pieces for this step first!`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const currentStepPieces = model?.steps?.[currentStep - 1]?.pieces || [];
      setPlacedPieces(prev =>
        prev.filter(p =>
          !currentStepPieces.some(sp =>
            sp.x === p.x &&
            sp.z === p.z &&
            (sp.yStack == null || p.yStack === sp.yStack)
          )
        )
      );
      setCurrentStep(s => s - 1);
    }
  };

  const undoLastPiece = useCallback(() => {
    if (placedPieces.length === 0) return;
    const lastPiece = placedPieces[placedPieces.length - 1];
    setPlacedPieces(prev => prev.slice(0, -1));
    updateUsedCount(lastPiece.partNum, false);
  }, [placedPieces, updateUsedCount]);

  useEffect(() => {
    const onToggleBlueprint = () => setShowBlueprint(b => !b);
    const onTogglePalette   = () => setShowPalette(p => !p);
    const onUndo            = () => undoLastPiece();
    window.addEventListener('toggleBlueprint', onToggleBlueprint);
    window.addEventListener('togglePalette',   onTogglePalette);
    window.addEventListener('undoLastPiece',   onUndo);
    return () => {
      window.removeEventListener('toggleBlueprint', onToggleBlueprint);
      window.removeEventListener('togglePalette',   onTogglePalette);
      window.removeEventListener('undoLastPiece',   onUndo);
    };
  }, [undoLastPiece]);

  const piecesLabel = totalPiecesInModel > 0
    ? `${placedPieces.length} / ${totalPiecesInModel} pieces`
    : placedPieces.length > 0
      ? `${placedPieces.length} pieces placed`
      : 'Loading pieces…';

  return (
    <div className="modern-lego-builder">
      <div className="stars-bg" />
      <div className="builder-bg" />

      <div className="builder-main">
        {showBlueprint && (
          <div className="left-panel">
            <BlueprintCard
              model={model}
              currentStep={currentStep}
              onClose={() => setShowBlueprint(false)}
            />
          </div>
        )}

        <div className="center-panel">
          <CanvasArea
            model={model}
            placedPieces={placedPieces}
            currentStep={currentStep}
            usedCounts={usedCounts}
            onPlacePiece={handlePlacePiece}
            onDropPiece={handleDropPiece}
            onRemovePiece={handleRemovePiece}
            onMovePiece={handleMovePiece}
            selectedPiece={selectedPiece}
            onNextStep={nextStep}
            onPrevStep={prevStep}
          />

          <div className="bottom-progress">
            <div className="building-label">
              BUILDING: {model?.name?.toUpperCase() || 'BUILD'}
              <span className="step-counter">
                &nbsp;&middot;&nbsp;{piecesLabel}
              </span>
            </div>
            <div className="step-progress-bar">
              <div
                className="step-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="step-percentage">{progress}%</div>
          </div>
        </div>

        {showPalette && (
          <div className="right-panel">
            <BrickPalette
              key={modelId}
              modelId={model?.id || 'stitch'}
              onSelectPiece={setSelectedPiece}
              onClose={() => setShowPalette(false)}
              usedCounts={usedCounts}
              userCoins={localCoins}
              onPurchasePiece={handlePurchasePiece}
              onPartsLoaded={handlePartsLoaded}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernLegoBuilder;
