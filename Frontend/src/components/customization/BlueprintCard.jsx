import React from 'react';
import './ModernLegoBuilder.css';

const BlueprintCard = ({ model, currentStep, onClose }) => {
  const totalSteps =
    model?.totalSteps ??
    (Array.isArray(model?.steps) ? model.steps.length : 0);

  const safeCurrentStep = typeof currentStep === 'number' ? currentStep : 0;
  const progress = totalSteps > 0 ? Math.round((safeCurrentStep / totalSteps) * 100) : 0;

  if (!model) {
    return (
      <div className="blueprint-card">
        <div className="blueprint-header">
          <span className="blueprint-label">BLUEPRINT</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="blueprint-preview">
          <h3 className="blueprint-title">No model selected</h3>
        </div>
      </div>
    );
  }
  
  return (
    <div className="blueprint-card">
      <div className="blueprint-header">
        <span className="blueprint-label">BLUEPRINT</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      <div className="blueprint-preview">
        <div className="preview-image">
          {model.image ? (
            <img 
              src={model.image} 
              alt={model.name} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                borderRadius: '14px'
              }} 
            />
          ) : (
            <div className="lego-preview-icon">
              {model.icon === "🦌" ? "🦌" : "🏗️"}
            </div>
          )}
        </div>
        <h3 className="blueprint-title">{model.name}</h3>
      </div>
      
    </div>
  );
};

export default BlueprintCard;