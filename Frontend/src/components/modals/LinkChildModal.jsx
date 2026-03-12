import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import guardianService from '../../services/guardianService';

const LinkChildModal = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
        setErrors({ child_username: ['Please enter a username'] });
        return;
    }

    setLoading(true);
    setErrors({});

    try {
        const response = await guardianService.linkChild({ child_username: username });
        
        if (response.success) {
        onSuccess(response.child);
        setUsername('');
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
        }
    } catch (err) {
        console.error('Link child error:', err);
        
        // Handle different error types
        if (err.status === 422) {
        // Validation error - username doesn't exist
        setErrors({ 
            child_username: ['This username does not exist. Please check and try again.'] 
        });
        } else if (err.status === 400) {
        // Bad request - already linked
        setErrors({ 
            general: [err.data?.error || 'Child already linked to your account'] 
        });
        } else if (err.status === 500) {
        // Server error
        setErrors({ 
            general: ['Server error. Please try again later.'] 
        });
        } else {
        setErrors({ 
            general: [err.data?.error || err.message || 'Failed to link child'] 
        });
        }
    } finally {
        setLoading(false);
    }
    };

  if (!isOpen) return null;

  return (
    <div className="nt-modal-overlay" onClick={onClose}>
      <div className="nt-modal" onClick={e => e.stopPropagation()}>
        <div className="nt-modal-header">
          <h3 className="nt-modal-title">Link a Child</h3>
          <button className="nt-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="nt-modal-body">
          <p className="nt-modal-description">
            Enter the child's username to link them to your account.
          </p>

          {/* Success message */}
          {success && (
            <div style={{
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              padding: '10px 12px',
              borderRadius: '6px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 500
            }}>
              <CheckCircle size={16} />
              Child linked successfully!
            </div>
          )}

          {/* General error */}
          {errors.general && (
            <div className="nt-error-message" style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '10px 12px',
              borderRadius: '6px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}>
              <AlertCircle size={16} />
              {errors.general[0]}
            </div>
          )}

          <div className="nt-form-group">
            <label htmlFor="child-username" className="nt-label">
              Child's Username
            </label>
            <input
              id="child-username"
              type="text"
              className={`nt-input ${errors.child_username ? 'nt-input-error' : ''}`}
              placeholder="e.g., alex_johnson"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || success}
              autoFocus
            />
            {errors.child_username && (
              <div style={{ 
                color: '#c62828', 
                fontSize: '12px', 
                marginTop: '4px' 
              }}>
                {errors.child_username[0]}
              </div>
            )}
          </div>

          <div className="nt-modal-actions">
            <button
              type="button"
              className="nt-btn nt-btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="nt-btn nt-btn-primary"
              disabled={loading || !username.trim() || success}
            >
              {loading ? 'Linking...' : <><UserPlus size={16} /> Link Child</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkChildModal;