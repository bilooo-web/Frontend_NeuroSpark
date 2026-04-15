import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Star, Edit3, Trash2, MessageSquare } from 'lucide-react';
import guardianService from '../services/guardianService';
import { useApp } from '../context/AppContext';

const Feedbacks = () => {
  const { user } = useApp();
  const [feedbacks, setFeedbacks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [saving, setSaving] = useState(false);

  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // New feedback state
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentimentResult, setSentimentResult] = useState(null);

  // Load feedbacks on mount — no loading gate, renders immediately
  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setError('');
      const response = await guardianService.getMyFeedback();
      if (Array.isArray(response.feedback)) {
        setFeedbacks(response.feedback);
        setStatistics(response.statistics || null);
      }
    } catch (err) {
      console.error('Failed to load feedbacks:', err);
      setError('Failed to load feedbacks. Please refresh.');
    }
  };

  // ===== EDIT: Start editing — populate fields =====
  const startEdit = (fb) => {
    setEditingId(fb.id);
    setEditText(fb.text);
    setEditRating(fb.rate || fb.rating || 0);
    setError('');
  };

  // ===== EDIT: Save — calls API, updates DB, then updates UI =====
  const saveEdit = async (id) => {
    if (!editText.trim()) {
      setError('Feedback text cannot be empty');
      return;
    }
    if (editRating === 0) {
      setError('Please select a rating');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await guardianService.updateFeedback(id, {
        text: editText,
        rating: editRating
      });

      if (res.success) {
        // Update the local list with the server response
        setFeedbacks(prev => prev.map(f =>
          f.id === id
            ? {
                ...f,
                text: res.feedback?.text || editText,
                rate: res.feedback?.rating || editRating,
                rating: res.feedback?.rating || editRating,
                sentiment: res.feedback?.sentiment || f.sentiment,
                sentiment_score: res.feedback?.sentiment_score || f.sentiment_score,
                time_ago: res.feedback?.created_at || f.time_ago,
              }
            : f
        ));
        setEditingId(null);
        setEditText('');
        setEditRating(0);
      } else {
        setError(res.message || 'Failed to update feedback');
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to update feedback');
    } finally {
      setSaving(false);
    }
  };

  // ===== EDIT: Cancel — just close the form, no API call, no changes =====
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditRating(0);
    setError('');
  };

  // ===== DELETE: Two-step confirm then delete from DB =====
  const handleDelete = async (id) => {
    // First click: show confirmation
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    // Second click: actually delete
    setConfirmDeleteId(null);
    setError('');

    try {
      const res = await guardianService.deleteFeedback(id);
      if (res.success) {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
        setStatistics(prev => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev);
      } else {
        setError(res.message || 'Failed to delete feedback');
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to delete feedback');
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
  };

  // ===== SUBMIT NEW FEEDBACK =====
  const addFeedback = async () => {
    if (newRating === 0) { setError('Please select a rating'); return; }
    if (!newText.trim()) { setError('Please enter your feedback'); return; }

    setSubmitting(true);
    setError('');
    setSentimentResult(null);

    try {
      const response = await guardianService.submitFeedback({
        text: newText,
        rating: newRating
      });

      if (response.success) {
        const sentiment = response.feedback?.sentiment;
        const sentimentLabel = typeof sentiment === 'object' ? sentiment?.result : sentiment;

        setSentimentResult(sentimentLabel);

        // Add to top of list immediately
        setFeedbacks(prev => [{
          id: response.feedback.id,
          text: response.feedback.text,
          rate: response.feedback.rating,
          rating: response.feedback.rating,
          sentiment: sentimentLabel,
          created_at: response.feedback.created_at,
          time_ago: response.feedback.created_at
        }, ...prev]);

        // Update stats
        setStatistics(prev => prev ? { ...prev, total: prev.total + 1 } : prev);

        setNewRating(0);
        setNewText('');
        setTimeout(() => setSentimentResult(null), 4000);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== HELPERS =====
  const getSentimentEmoji = (s) => s === 'positive' ? '😊' : s === 'negative' ? '😞' : s === 'neutral' ? '😐' : '';
  const getSentimentColor = (s) => s === 'positive' ? '#4caf50' : s === 'negative' ? '#f44336' : s === 'neutral' ? '#ff9800' : '#999';

  const renderStars = (count, interactive = false, setter = null) => (
    <div className="ptd-stars" style={{ marginBottom: interactive ? 12 : 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button"
          className={`ptd-star ${star <= count ? 'filled' : 'empty'}`}
          onClick={() => setter && setter(star)}
          style={!interactive ? { cursor: 'default', width: 18, height: 18 } : {}}
          disabled={!interactive}>
          <Star style={!interactive ? { width: 18, height: 18 } : {}} />
        </button>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="ptd-page-header">
        <div>
          <div className="ptd-page-title">Feedbacks</div>
          <div className="ptd-page-subtitle">
            Share your thoughts about therapy sessions and track sentiment analysis
          </div>
        </div>
      </div>

      {/* Sentiment Result Toast */}
      {sentimentResult && (
        <div style={{
          backgroundColor: getSentimentColor(sentimentResult), color: 'white',
          padding: '12px 20px', borderRadius: '8px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: 22 }}>{getSentimentEmoji(sentimentResult)}</span>
          <div>
            <strong>Feedback submitted!</strong>
            <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
              Sentiment: {sentimentResult.charAt(0).toUpperCase() + sentimentResult.slice(1)}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Bar */}
      {statistics && statistics.total > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: statistics.total, color: '#6366f1', emoji: '📊' },
            { label: 'Avg Rating', value: `${statistics.average_rating}★`, color: '#f59e0b', emoji: '⭐' },
            { label: 'Positive', value: statistics.by_sentiment?.positive || 0, color: '#4caf50', emoji: '😊' },
            { label: 'Neutral', value: statistics.by_sentiment?.neutral || 0, color: '#ff9800', emoji: '😐' },
            { label: 'Negative', value: statistics.by_sentiment?.negative || 0, color: '#f44336', emoji: '😞' },
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
        <div style={{ marginBottom: '20px', padding: '10px 16px', background: '#ffebee', color: '#c62828', borderRadius: 8, borderLeft: '4px solid #c62828', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontWeight: 700, fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Add new feedback */}
      <div className="ptd-feedback-card">
        <div className="ptd-feedback-header">📝 New Feedback</div>
        {renderStars(newRating, true, setNewRating)}
        <div className="ptd-feedback-row">
          <textarea className="ptd-textarea"
            placeholder="Write your feedback about a session..."
            value={newText} onChange={e => setNewText(e.target.value)}
            style={{ minHeight: 60 }} disabled={submitting} />
          <button className="ptd-feedback-submit" onClick={addFeedback} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Feedback list */}
      <div className="ptd-card">
        <div className="ptd-card-header">
          <span className="ptd-card-title">
            <MessageSquare style={{ width: 18, height: 18, display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Your Feedback History ({feedbacks.length})
          </span>
        </div>

        {feedbacks.length === 0 ? (
          <div className="ptd-empty-state">No feedbacks yet. Add your first one above!</div>
        ) : (
          feedbacks.map(fb => {
            const sentimentKey = typeof fb.sentiment === 'object' ? fb.sentiment?.result : fb.sentiment;
            const starCount = fb.rate || fb.rating || 0;

            return (
              <div key={fb.id} className="ptd-feedback-item">
                <div style={{ flex: 1 }}>
                  {editingId === fb.id ? (
                    /* ===== EDIT MODE ===== */
                    <>
                      {renderStars(editRating, true, setEditRating)}
                      <textarea className="ptd-textarea"
                        value={editText} onChange={e => setEditText(e.target.value)}
                        style={{ minHeight: 60, marginBottom: 8 }} disabled={saving} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="ptd-btn ptd-btn-primary"
                          style={{ padding: '6px 14px', fontSize: 13 }}
                          onClick={() => saveEdit(fb.id)} disabled={saving}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button className="ptd-btn ptd-btn-outline"
                          style={{ padding: '6px 14px', fontSize: 13 }}
                          onClick={cancelEdit} disabled={saving}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    /* ===== VIEW MODE ===== */
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        {renderStars(starCount)}
                        {sentimentKey && (
                          <span style={{
                            backgroundColor: getSentimentColor(sentimentKey) + '20',
                            color: getSentimentColor(sentimentKey),
                            padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}>
                            {getSentimentEmoji(sentimentKey)} {sentimentKey}
                          </span>
                        )}
                      </div>
                      <div className="ptd-feedback-item-text">{fb.text}</div>
                      <div className="ptd-feedback-item-meta">{fb.time_ago || fb.created_at}</div>
                      <div className="ptd-feedback-item-actions">
                        {/* Edit button */}
                        <button className="ptd-btn ptd-btn-outline"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => startEdit(fb)}>
                          <Edit3 size={14} /> Edit
                        </button>

                        {/* Delete button — two-step confirmation */}
                        {confirmDeleteId === fb.id ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: '#f44336' }}>Sure?</span>
                            <button className="ptd-btn ptd-btn-danger"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => handleDelete(fb.id)}>
                              Yes, delete
                            </button>
                            <button className="ptd-btn ptd-btn-outline"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={cancelDelete}>
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button className="ptd-btn ptd-btn-danger"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => handleDelete(fb.id)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default Feedbacks;