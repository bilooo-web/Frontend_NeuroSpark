import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Star, Edit3, Trash2, MessageSquare, Smile, Frown, Meh } from 'lucide-react';
import guardianService from '../services/guardianService';
import { useApp } from '../context/AppContext';

const Feedbacks = () => {
  const { user } = useApp();
  const [feedbacks, setFeedbacks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // New feedback state
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentimentResult, setSentimentResult] = useState(null);

  // Load feedbacks on mount
  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await guardianService.getMyFeedback();
      console.log('Feedback response:', response);
      
      // Response: { success, statistics, feedback: [...] } — flat, no data wrapper
      if (Array.isArray(response.feedback)) {
        setFeedbacks(response.feedback);
        setStatistics(response.statistics || null);
      } else {
        setFeedbacks([]);
      }
    } catch (err) {
      console.error('Failed to load feedbacks:', err);
      setError('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (fb) => {
    setEditingId(fb.id);
    setEditText(fb.text);
    setEditRating(fb.rating);
  };

  const saveEdit = async (id) => {
      try {
          const res = await guardianService.updateFeedback(id, {
              text: editText,
              rating: editRating
          });
          if (res.success) {
              setFeedbacks(prev => prev.map(f =>
                  f.id === id ? { ...f, text: editText, rating: editRating, sentiment: res.feedback.sentiment, sentiment_score: res.feedback.sentiment_score } : f
              ));
              setEditingId(null);
          }
      } catch (err) {
          setError(err.data?.message || err.message || 'Failed to update feedback');
      }
  };

  const deleteFeedback = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    try {
      console.log('Deleting feedback id:', id);
      const res = await guardianService.deleteFeedback(id);
      console.log('Delete response:', res);
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      setStatistics(prev => prev ? {
        ...prev,
        total: prev.total - 1
      } : prev);
    } catch (err) {
      console.log('Delete error:', err);
      setError(err.data?.message || err.message || 'Failed to delete feedback');
    }
  };

  const addFeedback = async () => {
    if (newRating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!newText.trim()) {
      alert('Please enter your feedback');
      return;
    }

    setSubmitting(true);
    setError('');
    setSentimentResult(null);

    try {
      const response = await guardianService.submitFeedback({
        text: newText,
        rating: newRating
      });

      // Response: { success, feedback: { id, text, rating, sentiment: { result, score } } }
      if (response.success) {
        setFeedbacks(prev => [response.feedback, ...prev]);
        setSentimentResult(response.feedback.sentiment);
        setNewRating(0);
        setNewText('');
        setTimeout(() => setSentimentResult(null), 5000);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch(sentiment?.result) {
      case 'positive': return <Smile style={{ color: '#4caf50' }} />;
      case 'negative': return <Frown style={{ color: '#f44336' }} />;
      case 'neutral': return <Meh style={{ color: '#ff9800' }} />;
      default: return null;
    }
  };

  const renderStars = (count, interactive = false, setter = null) => (
    <div className="nt-stars" style={{ marginBottom: interactive ? 12 : 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className={`nt-star ${star <= count ? 'filled' : 'empty'}`}
          onClick={() => setter && setter(star)}
          style={!interactive ? { cursor: 'default', width: 18, height: 18 } : {}}
          disabled={!interactive}
        >
          <Star style={!interactive ? { width: 18, height: 18 } : {}} />
        </button>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="nt-page-header">
        <div>
          <div className="nt-page-title">Feedbacks</div>
          <div className="nt-page-subtitle">
            Share your thoughts about therapy sessions and track sentiment analysis
          </div>
        </div>
      </div>

      {/* Sentiment Result Toast */}
      {sentimentResult && (
        <div 
          className="nt-sentiment-toast"
          style={{
            backgroundColor: sentimentResult.result === 'positive' ? '#4caf50' :
                           sentimentResult.result === 'negative' ? '#f44336' : '#ff9800',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {getSentimentIcon(sentimentResult)}
          <div>
            <strong>Sentiment detected: {sentimentResult.result.toUpperCase()}</strong>
            <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
              Confidence: {(sentimentResult.score * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {/* Statistics Bar */}
      {statistics && statistics.total > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',      value: statistics.total,            color: '#6366f1', emoji: '📊' },
            { label: 'Avg Rating', value: `${statistics.average_rating}★`, color: '#f59e0b', emoji: '⭐' },
            { label: 'Positive',   value: statistics.by_sentiment?.positive || 0, color: '#4caf50', emoji: '😊' },
            { label: 'Neutral',    value: statistics.by_sentiment?.neutral  || 0, color: '#ff9800', emoji: '😐' },
            { label: 'Negative',   value: statistics.by_sentiment?.negative || 0, color: '#f44336', emoji: '😞' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', border: `1.5px solid ${s.color}22`,
              borderRadius: 10, padding: '10px 18px', display: 'flex',
              flexDirection: 'column', alignItems: 'center', minWidth: 80
            }}>
              <span style={{ fontSize: 18 }}>{s.emoji}</span>
              <span style={{ fontWeight: 700, color: s.color, fontSize: 18 }}>{s.value}</span>
              <span style={{ fontSize: 11, color: '#888' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="nt-error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Add new feedback */}
      <div className="nt-feedback-card">
        <div className="nt-feedback-header">📝 New Feedback</div>
        {renderStars(newRating, true, setNewRating)}
        <div className="nt-feedback-row">
          <textarea
            className="nt-textarea"
            placeholder="Write your feedback about a session..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            style={{ minHeight: 60 }}
            disabled={submitting}
          />
          <button 
            className="nt-feedback-submit" 
            onClick={addFeedback}
            disabled={submitting}
          >
            {submitting ? 'Analyzing...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Feedback list */}
      <div className="nt-card">
        <div className="nt-card-header">
          <span className="nt-card-title">
            <MessageSquare style={{ width: 18, height: 18, display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Your Feedback History ({feedbacks.length})
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div className="nt-spinner" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="nt-empty-state">No feedbacks yet. Add your first one above!</div>
        ) : (
          feedbacks.map(fb => (
            <div key={fb.id} className="nt-feedback-item">
              <div style={{ flex: 1 }}>
                {editingId === fb.id ? (
                  <>
                    {renderStars(editRating, true, setEditRating)}
                    <textarea
                      className="nt-textarea"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      style={{ minHeight: 60, marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="nt-btn nt-btn-primary" 
                        style={{ padding: '6px 14px', fontSize: 13 }} 
                        onClick={() => saveEdit(fb.id)}
                      >
                        Save
                      </button>
                      <button 
                        className="nt-btn nt-btn-outline" 
                        style={{ padding: '6px 14px', fontSize: 13 }} 
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      {renderStars(fb.rating)}
                      {fb.sentiment && (() => {
                        // sentiment can be a string ("positive") OR object ({ result, score, details })
                        const s = typeof fb.sentiment === 'object' ? fb.sentiment.result : fb.sentiment;
                        const color = s === 'positive' ? '#4caf50' : s === 'negative' ? '#f44336' : '#ff9800';
                        const bg = color + '20';
                        const emoji = s === 'positive' ? '😊' : s === 'negative' ? '😞' : '😐';
                        return (
                          <span className="nt-sentiment-badge" style={{
                            backgroundColor: bg, color,
                            padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}>
                            {emoji} {s}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="nt-feedback-item-text">{fb.text}</div>
                    <div className="nt-feedback-item-meta">
                      {fb.time_ago || fb.created_at}
                      {/*
                      {fb.sentiment_score && (
                       
                        <span style={{ marginLeft: '10px', opacity: 0.7 }}>
                          Score: {(fb.sentiment_score * 100).toFixed(1)}%
                        </span>
                       
                      )} */}
                    </div>
                    <div className="nt-feedback-item-actions">
                      <button 
                        className="nt-btn nt-btn-outline" 
                        style={{ padding: '4px 10px', fontSize: 12 }} 
                        onClick={() => startEdit(fb)}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      {confirmDeleteId === fb.id ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, color: '#f44336' }}>Sure?</span>
                          <button
                            className="nt-btn nt-btn-danger"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => deleteFeedback(fb.id)}
                          >
                            Yes, delete
                          </button>
                          <button
                            className="nt-btn nt-btn-outline"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button 
                          className="nt-btn nt-btn-danger" 
                          style={{ padding: '4px 10px', fontSize: 12 }} 
                          onClick={() => deleteFeedback(fb.id)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default Feedbacks;