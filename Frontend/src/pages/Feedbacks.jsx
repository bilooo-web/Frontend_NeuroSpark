import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Star, Edit3, Trash2, MessageSquare } from 'lucide-react';
import guardianService from '../services/guardianService';

const Feedbacks = () => {
  // Render immediately — no loading gate
  const [feedbacks,   setFeedbacks]   = useState([]);
  const [statistics,  setStatistics]  = useState(null);
  const [error,       setError]       = useState('');
  const [hydrating,   setHydrating]   = useState(true); // subtle background fetch indicator

  const [editingId,   setEditingId]   = useState(null);
  const [editText,    setEditText]    = useState('');
  const [editRating,  setEditRating]  = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [confirmDeleteId,  setConfirmDeleteId]  = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll,      setDeletingAll]      = useState(false);

  const [newRating,   setNewRating]   = useState(0);
  const [newText,     setNewText]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [sentimentResult, setSentimentResult] = useState(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    loadFeedbacks();
    return () => { mounted.current = false; };
  }, []);

  // Non-blocking background fetch — page is visible immediately
  const loadFeedbacks = async () => {
    try {
      setError('');
      const response = await guardianService.getMyFeedback();
      if (!mounted.current) return;
      if (Array.isArray(response.feedback)) {
        const active = response.feedback.filter(f => !f.is_deleted && f.deleted_at == null);
        setFeedbacks(active);
        const stats = response.statistics || null;
        if (stats) {
          // Cache all ratings so we can recalculate the average locally on new submits
          stats._ratings = active.map(f => parseFloat(f.rate || f.rating || 0)).filter(r => r > 0);
        }
        setStatistics(stats);
      } else if (Array.isArray(response)) {
        setFeedbacks(response.filter(f => !f.is_deleted && f.deleted_at == null));
      }
    } catch (err) {
      if (mounted.current) setError('Failed to load feedbacks. Please refresh.');
    } finally {
      if (mounted.current) setHydrating(false);
    }
  };

  // ── SUBMIT — optimistic: add to top immediately, API call in bg ──────────
  const addFeedback = async () => {
    if (newRating === 0)    { setError('Please select a rating');     return; }
    if (!newText.trim())    { setError('Please enter your feedback'); return; }

    setError('');
    setSubmitting(true);
    setSentimentResult(null);

    // Optimistic entry shown instantly
    const tempId  = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId, text: newText, rate: newRating, rating: newRating,
      sentiment: null, created_at: new Date().toISOString(), time_ago: 'Just now',
    };
    setFeedbacks(prev => [optimistic, ...prev]);
    const savedText   = newText;
    const savedRating = newRating;
    setNewText('');
    setNewRating(0);

    try {
      const response = await guardianService.submitFeedback({ text: savedText, rating: savedRating });
      if (!mounted.current) return;

      if (response.success) {
        const sentiment = response.feedback?.sentiment;
        const label = typeof sentiment === 'object' ? sentiment?.result : sentiment;
        setSentimentResult(label);
        setTimeout(() => { if (mounted.current) setSentimentResult(null); }, 4000);

        // Replace optimistic entry with real server data
        setFeedbacks(prev => prev.map(f =>
          f.id === tempId
            ? { id: response.feedback.id, text: response.feedback.text, rate: response.feedback.rating, rating: response.feedback.rating, sentiment: label, created_at: response.feedback.created_at, time_ago: 'Just now' }
            : f
        ));

        // Update all stat cards immediately — no refresh needed
        setStatistics(prev => {
          if (!prev) return prev;
          const newTotal    = (prev.total || 0) + 1;
          const bySentiment = { ...(prev.by_sentiment || { positive: 0, negative: 0 }) };
          if (label === 'positive')      bySentiment.positive = (bySentiment.positive || 0) + 1;
          else if (label === 'negative') bySentiment.negative = (bySentiment.negative || 0) + 1;
          // neutral is ignored — not tracked in the UI
          const allRatings   = [...(prev._ratings || []), savedRating];
          const avgRating    = (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1);
          return { ...prev, total: newTotal, by_sentiment: bySentiment, average_rating: avgRating, _ratings: allRatings };
        });
      } else {
        // Rollback
        setFeedbacks(prev => prev.filter(f => f.id !== tempId));
        setError(response.message || 'Submission failed. Please try again.');
        setNewText(savedText);
        setNewRating(savedRating);
      }
    } catch (err) {
      if (!mounted.current) return;
      setFeedbacks(prev => prev.filter(f => f.id !== tempId));
      setError(err.data?.message || err.message || 'Failed to submit feedback');
      setNewText(savedText);
      setNewRating(savedRating);
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  const startEdit = (fb) => {
    setEditingId(fb.id);
    setEditText(fb.text);
    setEditRating(fb.rate || fb.rating || 0);
    setError('');
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) { setError('Feedback text cannot be empty'); return; }
    if (editRating === 0) { setError('Please select a rating');        return; }
    setSaving(true); setError('');
    try {
      const res = await guardianService.updateFeedback(id, { text: editText, rating: editRating });
      if (res.success) {
        setFeedbacks(prev => prev.map(f =>
          f.id === id ? { ...f, text: res.feedback?.text || editText, rate: res.feedback?.rating || editRating, rating: res.feedback?.rating || editRating, sentiment: res.feedback?.sentiment || f.sentiment } : f
        ));
        setEditingId(null); setEditText(''); setEditRating(0);
      } else setError(res.message || 'Failed to update');
    } catch (err) { setError(err.data?.message || 'Failed to update feedback'); }
    finally { setSaving(false); }
  };

  const cancelEdit = () => { setEditingId(null); setEditText(''); setEditRating(0); setError(''); };

  const handleDelete = async (id) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    setConfirmDeleteId(null);
    const fbToDelete = feedbacks.find(f => f.id === id);
    setFeedbacks(prev => prev.filter(f => f.id !== id));
    setStatistics(prev => {
      if (!prev || !fbToDelete) return prev;
      const newTotal    = Math.max(0, (prev.total || 1) - 1);
      const bySentiment = { ...(prev.by_sentiment || { positive: 0, negative: 0 }) };
      const deletedSentiment = typeof fbToDelete.sentiment === 'object'
        ? fbToDelete.sentiment?.result : fbToDelete.sentiment;
      if (deletedSentiment === 'positive') bySentiment.positive = Math.max(0, (bySentiment.positive || 1) - 1);
      else if (deletedSentiment === 'negative') bySentiment.negative = Math.max(0, (bySentiment.negative || 1) - 1);
      // neutral: ignored, no counter to update
      return { ...prev, total: newTotal, by_sentiment: bySentiment };
    });
    try {
      await guardianService.softDeleteFeedback(id);
    } catch {
      try { await guardianService.deleteFeedback(id); } catch { loadFeedbacks(); }
    }
  };

  const handleDeleteAll = async () => {
    if (!confirmDeleteAll) { setConfirmDeleteAll(true); return; }
    setConfirmDeleteAll(false);
    setDeletingAll(true);

    const ids = feedbacks.map(fb => fb.id);

    // Remove all from UI instantly
    setFeedbacks([]);
    setStatistics(prev => prev ? {
      ...prev, total: 0,
      by_sentiment: { positive: 0, negative: 0 },
      average_rating: 0, _ratings: [],
    } : prev);

    try {
      // One single request instead of N parallel requests — instant
      await guardianService.bulkSoftDeleteFeedback(ids);
    } catch {
      loadFeedbacks(); // rollback if it failed
    } finally {
      setDeletingAll(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const sentimentEmoji = s => s==='positive'?'😊':s==='negative'?'😞':s==='neutral'?'😐':'';
  const sentimentColor = s => s==='positive'?'#4caf50':s==='negative'?'#f44336':s==='neutral'?'#ff9800':'#999';

  const Stars = ({ count, interactive=false, setter=null }) => (
    <div className="ptd-stars" style={{ marginBottom: interactive ? 12 : 4 }}>
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button"
          className={`ptd-star ${star <= count ? 'filled' : 'empty'}`}
          onClick={() => setter && setter(star)}
          style={!interactive ? { cursor:'default', width:18, height:18 } : {}}
          disabled={!interactive}>
          <Star style={!interactive ? { width:18, height:18 } : {}} />
        </button>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="ptd-page-header">
        <div>
          <div className="ptd-page-title">Feedbacks</div>
          <div className="ptd-page-subtitle">Share your thoughts and track sentiment analysis</div>
        </div>
        {hydrating && (
          <div style={{ fontSize:12, color:'#8B8FA3', display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid #E8EAF0', borderTopColor:'#137a76', animation:'spin 0.8s linear infinite' }} />
            Loading…
          </div>
        )}
      </div>

      {/* Sentiment toast — only for positive / negative */}
      {sentimentResult && sentimentResult !== 'neutral' && (
        <div style={{ backgroundColor:sentimentColor(sentimentResult), color:'white', padding:'12px 20px', borderRadius:8, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>{sentimentEmoji(sentimentResult)}</span>
          <div>
            <strong>Feedback submitted!</strong>
            <div style={{ fontSize:'0.9em', opacity:.9 }}>Sentiment: {sentimentResult.charAt(0).toUpperCase()+sentimentResult.slice(1)}</div>
          </div>
        </div>
      )}

      {/* Stats */}
      {statistics && statistics.total > 0 && (
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          {[
            { label:'Total',      value:statistics.total,                        color:'#6366f1', emoji:'📊' },
            { label:'Avg Rating', value:`${statistics.average_rating}★`,          color:'#f59e0b', emoji:'⭐' },
            { label:'Positive',   value:statistics.by_sentiment?.positive || 0,   color:'#4caf50', emoji:'😊' },
            { label:'Negative',   value:statistics.by_sentiment?.negative || 0,   color:'#f44336', emoji:'😞' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', border:`1.5px solid ${s.color}22`, borderRadius:10, padding:'10px 18px', display:'flex', flexDirection:'column', alignItems:'center', minWidth:80 }}>
              <span style={{ fontSize:18 }}>{s.emoji}</span>
              <span style={{ fontWeight:700, color:s.color, fontSize:18 }}>{s.value}</span>
              <span style={{ fontSize:11, color:'#888' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginBottom:16, padding:'10px 16px', background:'#ffebee', color:'#c62828', borderRadius:8, borderLeft:'4px solid #c62828', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#c62828', fontWeight:700, fontSize:16 }}>✕</button>
        </div>
      )}

      {/* New feedback form */}
      <div className="ptd-feedback-card">
        <div className="ptd-feedback-header">📝 New Feedback</div>
        <Stars count={newRating} interactive setter={setNewRating} />
        <div className="ptd-feedback-row">
          <textarea className="ptd-textarea"
            placeholder="Write your feedback about a session..."
            value={newText} onChange={e => setNewText(e.target.value)}
            style={{ minHeight:60 }} disabled={submitting} />
          <button className="ptd-feedback-submit" onClick={addFeedback} disabled={submitting || (!newText.trim() && newRating === 0)}>
            {submitting ? (
              <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:12, height:12, borderRadius:'50%', border:'2px solid rgba(255,255,255,.4)', borderTopColor:'white', animation:'spin 0.6s linear infinite', display:'inline-block' }} />
                Submitting…
              </span>
            ) : 'Submit'}
          </button>
        </div>
      </div>

      {/* Feedback list */}
      <div className="ptd-card">
        <div className="ptd-card-header">
          <span className="ptd-card-title">
            <MessageSquare style={{ width:18, height:18, display:'inline', marginRight:8, verticalAlign:'middle' }} />
            Your Feedback History ({feedbacks.length})
          </span>
          {feedbacks.length > 0 && (
            confirmDeleteAll ? (
              <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color:'#f44336', fontWeight:600 }}>Delete all {feedbacks.length} feedbacks?</span>
                <button
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  style={{ background:'#f44336', color:'white', border:'none', borderRadius:6, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {deletingAll ? 'Deleting…' : 'Yes, delete all'}
                </button>
                <button
                  onClick={() => setConfirmDeleteAll(false)}
                  style={{ background:'none', border:'1px solid #d0d5dd', borderRadius:6, padding:'5px 10px', fontSize:12, cursor:'pointer', color:'#374151' }}>
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={handleDeleteAll}
                disabled={deletingAll}
                style={{ display:'flex', alignItems:'center', gap:5, background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:6, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                <Trash2 size={13} /> Delete All
              </button>
            )
          )}
        </div>

        {feedbacks.length === 0 && !hydrating ? (
          <div className="ptd-empty-state">No feedbacks yet. Add your first one above!</div>
        ) : (
          feedbacks.map(fb => {
            const sentimentKey = typeof fb.sentiment === 'object' ? fb.sentiment?.result : fb.sentiment;
            const starCount    = fb.rate || fb.rating || 0;
            const isTemp       = String(fb.id).startsWith('temp-');

            return (
              <div key={fb.id} className="ptd-feedback-item" style={{ opacity: isTemp ? .7 : 1, transition:'opacity .3s' }}>
                <div style={{ flex:1 }}>
                  {editingId === fb.id ? (
                    <>
                      <Stars count={editRating} interactive setter={setEditRating} />
                      <textarea className="ptd-textarea" value={editText} onChange={e=>setEditText(e.target.value)} style={{ minHeight:60, marginBottom:8 }} disabled={saving} />
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="ptd-btn ptd-btn-primary" style={{ padding:'6px 14px', fontSize:13 }} onClick={() => saveEdit(fb.id)} disabled={saving}>
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button className="ptd-btn ptd-btn-outline" style={{ padding:'6px 14px', fontSize:13 }} onClick={cancelEdit} disabled={saving}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <Stars count={starCount} />
                        {sentimentKey && (
                          <span style={{ backgroundColor:sentimentColor(sentimentKey)+'20', color:sentimentColor(sentimentKey), padding:'2px 8px', borderRadius:12, fontSize:12, display:'inline-flex', alignItems:'center', gap:4 }}>
                            {sentimentEmoji(sentimentKey)} {sentimentKey}
                          </span>
                        )}
                        {isTemp && <span style={{ fontSize:11, color:'#8B8FA3' }}>Saving…</span>}
                      </div>
                      <div className="ptd-feedback-item-text">{fb.text}</div>
                      <div className="ptd-feedback-item-meta">{fb.time_ago || fb.created_at}</div>
                      {!isTemp && (
                        <div className="ptd-feedback-item-actions">
                          <button className="ptd-btn ptd-btn-outline" style={{ padding:'4px 10px', fontSize:12 }} onClick={() => startEdit(fb)}>
                            <Edit3 size={14} /> Edit
                          </button>
                          {confirmDeleteId === fb.id ? (
                            <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontSize:12, color:'#f44336' }}>Sure?</span>
                              <button className="ptd-btn ptd-btn-danger" style={{ padding:'4px 10px', fontSize:12 }} onClick={() => handleDelete(fb.id)}>Yes, delete</button>
                              <button className="ptd-btn ptd-btn-outline" style={{ padding:'4px 10px', fontSize:12 }} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                            </span>
                          ) : (
                            <button className="ptd-btn ptd-btn-danger" style={{ padding:'4px 10px', fontSize:12 }} onClick={() => handleDelete(fb.id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </DashboardLayout>
  );
};

export default Feedbacks;