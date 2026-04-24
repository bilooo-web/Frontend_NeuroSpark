import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stories } from '../data/storiesData';
import api from '../services/api';
import AuthModal from '../components/Auth/AuthModal';
import Header from "../components/common/Header/Header";

import './StoryIntro.css';

import gingerCover from '../assets/ginger-giraffe.png';
import introBg    from '../assets/stories/ginger/background3.png';
import coinIcon from '../assets/coin.png';

const coverImages = {
  1: gingerCover,
};

const formatTime = (s) => {
  if (!s || s <= 0) return '0s';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  if (sec === 0) return `${m}m`;
  return `${m}m ${sec}s`;
};

const scoreEmoji = (pct) => {
  if (pct >= 90) return '🌟';
  if (pct >= 70) return '😊';
  if (pct >= 50) return '🙂';
  return '💪';
};

const motivationMsg = (pct, hasPlayed) => {
  if (!hasPlayed) return { emoji: '🌟', text: 'Ready for your first read?', sub: 'Take your time you got this!' };
  if (pct >= 90)  return { emoji: '🏆', text: 'Amazing last time!',         sub: 'Can you do it again?' };
  if (pct >= 70)  return { emoji: '😊', text: 'Great effort last time!',    sub: "You're getting better every read!" };
  if (pct >= 50)  return { emoji: '💪', text: 'Keep it up!',                sub: 'Every read makes you stronger!' };
  return           { emoji: '🚀', text: "Let's try again!",                  sub: "You'll do even better this time!" };
};

const StoryIntro = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const story = stories[id];
  const [prev, setPrev] = useState(null);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(true);
  // ── Leave modal (shown when user clicks the back button) ──────────────────
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const introActiveRef = useRef(true);

  const isAuthenticated = () => !!localStorage.getItem('token');

  const getCurrentUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  };

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
    introActiveRef.current = false;
    if (pendingNavigation) {
      navigate(pendingNavigation);
    } else {
      navigate('/ReadingPage');
    }
  };

  const handleCancelLeave = () => {
    setShowLeaveModal(false);
    setPendingNavigation(null);
  };

  // Browser tab close / refresh guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (introActiveRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Browser back button guard
  useEffect(() => {
    if (!introActiveRef.current) return;
    window.history.pushState({ introGuard: true }, '');
    const handlePopState = (e) => {
      if (introActiveRef.current) {
        window.history.pushState({ introGuard: true }, '');
        setShowLeaveModal(true);
        setPendingNavigation('/ReadingPage');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intercept all link clicks during active intro
  useEffect(() => {
    const handleLinkClick = (e) => {
      if (!introActiveRef.current) return;
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && !href.includes('/story')) {
        e.preventDefault();
        e.stopPropagation();
        setShowLeaveModal(true);
        setPendingNavigation(href);
      }
    };
    const handleHeaderNavigate = (e) => {
      if (!introActiveRef.current) return;
      e.preventDefault();
      setShowLeaveModal(true);
      setPendingNavigation(e.detail?.path || '/');
    };
    document.addEventListener('click', handleLinkClick, true);
    window.addEventListener('header-navigate', handleHeaderNavigate);
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('header-navigate', handleHeaderNavigate);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      setShowAuthModal(true);
      setLoadingProgress(false);
      return;
    }
    const token = localStorage.getItem('token');
    const user = getCurrentUser();
    if (token && user.role === 'child' && story?.slug) {
      setLoadingProgress(true);
      api.get(`/child/stories/${story.slug}/progress`)
        .then(res => {
          if (res.has_progress && res.progress) {
            const backendProgress = res.progress;
            if (backendProgress.pageSummaries && Array.isArray(backendProgress.pageSummaries)) {
              backendProgress.pageSummaries = backendProgress.pageSummaries.map((p, i) => ({
                pageNumber: p?.pageNumber ?? (i + 1),
                score: p?.score ?? 0,
                totalWords: p?.totalWords ?? 0,
                correctWords: p?.correctWords ?? [],
                incorrectWords: p?.incorrectWords ?? [],
                missingWords: p?.missingWords ?? [],
                speakerClicks: p?.speakerClicks ?? 0,
                wordClicks: p?.wordClicks ?? 0,
                clickedWords: p?.clickedWords ?? [],
              }));
            }
            setPrev({ ...backendProgress, coinsEarned: backendProgress.coinsEarned || 0 });
          } else {
            setPrev(null);
          }
        })
        .catch(() => { setPrev(null); })
        .finally(() => {
          setLoadingProgress(false);
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
    } else {
      setPrev(null);
      setLoadingProgress(false);
    }
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [id]);

  // Scroll to top on component mount (synchronous before paint)
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  if (!story) return <div>Story not found</div>;

  const totalPages = story.pages?.length || 0;
  const hasPlayed  = !loadingProgress && prev && (prev.attempts || 0) > 0;
  const prevPct    = hasPlayed ? Math.round((prev.overallScore || 0) * 100) : 0;
  const msg        = motivationMsg(prevPct, hasPlayed);

  const barColor = (pct) =>
    pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : pct >= 50 ? '#3b82f6' : '#ef4444';

  return (
    <>
      {/* ── Header bar ── */}
      <div className="si-header">
        <Header />
      </div>

      {/* ── Back button — sits below the header, independent ── */}
      <button
        className="si-back-btn"
        onClick={() => setShowLeaveModal(true)}
        aria-label="Back to reading page"
      >
        ← Back
      </button>

      <div className={`si-page ${visible ? 'si-visible' : ''}`} style={{ backgroundImage: `url(${introBg})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
        <div className="si-blob si-blob-1" />
        <div className="si-blob si-blob-2" />
        <div className="si-blob si-blob-3" />

        <div className="si-card">

          <div className="si-top">
            <div className="si-cover-wrapper">
              <img src={coverImages[Number(id)] || story.coverImage} alt={story.title} className="si-cover" />
              <div className="si-cover-shine" />
            </div>
            <div className="si-title-block">
              <h1 className="si-title">{story.title}</h1>
              <span className="si-pages-badge">{totalPages} pages</span>
              {hasPlayed && (
                <span className="si-attempts-badge">Read {prev.attempts}× before</span>
              )}
            </div>
          </div>

          <div className="si-motivation">
            <span className="si-motivation-emoji">{msg.emoji}</span>
            <div className="si-motivation-text">
              <strong>{msg.text}</strong>
              <span>{msg.sub}</span>
            </div>
          </div>

          {loadingProgress && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#6c5ce7',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px',
              }} />
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Loading your progress...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {hasPlayed && (
            <>
              <div className="si-score-block">
                <div className="si-score-row">
                  <span className="si-score-label">Last score</span>
                  <span className="si-score-pct" style={{ color: barColor(prevPct) }}>
                    {scoreEmoji(prevPct)} {prevPct}%
                  </span>
                </div>
                <div className="si-bar-track">
                  <div className="si-bar-fill" style={{ width: `${prevPct}%`, background: barColor(prevPct) }} />
                </div>
              </div>

              <div className="si-stats-grid">
                <div className="si-stat si-stat-green">
                  <span className="si-stat-num">{prev.correctCount || 0}</span>
                  <span className="si-stat-lbl">✅ Correct</span>
                </div>
                <div className="si-stat si-stat-red">
                  <span className="si-stat-num">{prev.incorrectCount || 0}</span>
                  <span className="si-stat-lbl">❌ Incorrect</span>
                </div>
                <div className="si-stat si-stat-orange">
                  <span className="si-stat-num">{prev.missingCount || 0}</span>
                  <span className="si-stat-lbl">⚠️ Missing</span>
                </div>
                <div className="si-stat si-stat-blue">
                  <span className="si-stat-num">{formatTime(prev.totalTime)}</span>
                  <span className="si-stat-lbl">⏱ Time</span>
                </div>
                <div className="si-stat si-stat-purple">
                  <span className="si-stat-num">{prev.totalSpeakerClicks || 0}</span>
                  <span className="si-stat-lbl">🔊 Read Alouds</span>
                </div>
                <div className="si-stat si-stat-teal">
                  <span className="si-stat-num">{prev.totalWordClicks || 0}</span>
                  <span className="si-stat-lbl">👆 Word Taps</span>
                </div>
                <div className="si-stat si-stat-gold">
                  <span className="si-stat-num">{prev.coinsEarned || 0}</span>
                  <span className="si-stat-lbl">🪙 Coins Earned</span>
                </div>
              </div>

              <div className="si-tabs">
                {['overview', 'pages', 'therapist'].map(tab => (
                  <button
                    key={tab}
                    className={`si-tab ${activeTab === tab ? 'si-tab-active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'overview'  && ' Overview'}
                    {tab === 'pages'     && ' Pages'}
                    {tab === 'therapist' && ' Therapist'}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="si-panel">
                  {(prev.pageSummaries || []).map((p, i) => {
                    const pct = Math.round((p?.score || 0) * 100);
                    return (
                      <div key={i} className="si-bar-row">
                        <span className="si-bar-label">Page {i + 1}</span>
                        <div className="si-bar-track si-bar-track-sm">
                          <div className="si-bar-fill" style={{ width: `${pct}%`, background: barColor(pct) }} />
                        </div>
                        <span className="si-bar-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'pages' && (
                <div className="si-panel">
                  {(prev.pageSummaries || []).map((p, i) => {
                    const pct = Math.round((p?.score || 0) * 100);
                    return (
                      <div key={i} className="si-page-card">
                        <div className="si-page-card-header">
                          <span className="si-page-num">Page {i + 1}</span>
                          <span className="si-page-badge" style={{
                            background: pct >= 90 ? '#dcfce7' : pct >= 70 ? '#fef9c3' : '#fee2e2',
                            color:      pct >= 90 ? '#15803d' : pct >= 70 ? '#854d0e' : '#b91c1c',
                          }}>
                            {scoreEmoji(pct)} {pct}%
                          </span>
                        </div>
                        {(p?.incorrectWords || []).length === 0 && (p?.missingWords || []).length === 0 && (
                          <p className="si-perfect">🌟 Perfect page!</p>
                        )}
                        {(p?.incorrectWords || []).length > 0 && (
                          <div className="si-error-block">
                            <span className="si-error-title" style={{ color: '#dc2626' }}>❌ Said wrong</span>
                            <div className="si-badges">
                              {p.incorrectWords.map((w, j) => (
                                <span key={j} className="si-badge si-badge-incorrect">
                                  {typeof w === 'object' ? w.expected : w}
                                  {typeof w === 'object' && w.spoken && <span style={{ opacity: 0.7 }}> → "{w.spoken}"</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(p?.missingWords || []).length > 0 && (
                          <div className="si-error-block">
                            <span className="si-error-title" style={{ color: '#d97706' }}>⚠️ Skipped</span>
                            <div className="si-badges">
                              {p.missingWords.map((w, j) => (
                                <span key={j} className="si-badge si-badge-missing">{w}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'therapist' && (
                <div className="si-panel">
                  <div className="si-therapist-cards">
                    <div className="si-therapist-card si-tc-purple">
                      <span className="si-tc-num">{prev.totalSpeakerClicks || 0}</span>
                      <span className="si-tc-lbl">Times child pressed<br/><strong>Read Aloud</strong></span>
                    </div>
                    <div className="si-therapist-card si-tc-teal">
                      <span className="si-tc-num">{prev.totalWordClicks || 0}</span>
                      <span className="si-tc-lbl">Words tapped for<br/><strong>pronunciation</strong></span>
                    </div>
                  </div>
                  {(prev.topClickedWords || []).length > 0 && (
                    <div className="si-tapped-words">
                      <p className="si-tapped-label">👆 Words child needed help with:</p>
                      <div className="si-badges">
                        {prev.topClickedWords.map(([word, count]) => (
                          <span key={word} className="si-badge si-badge-tapped">
                            {word}{count > 1 && <span style={{ opacity: 0.65 }}> ×{count}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(prev.pageSummaries || []).map((p, i) => (
                    <div key={i} className="si-therapist-page-row">
                      <span className="si-bar-label">Page {i + 1}</span>
                      <div className="si-badges">
                        <span className={`si-badge ${(p?.speakerClicks || 0) === 0 ? 'si-badge-none' : 'si-badge-tapped'}`}>
                          🔊 ×{p?.speakerClicks || 0}
                        </span>
                        <span className={`si-badge ${(p?.wordClicks || 0) === 0 ? 'si-badge-none' : 'si-badge-tapped'}`}>
                          👆 ×{p?.wordClicks || 0}
                        </span>
                        {(p?.clickedWords || []).length > 0 && (
                          <span className="si-badge si-badge-words">
                            {[...new Set(p.clickedWords)].join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="si-actions">
            <button className="si-btn si-btn-start" onClick={() => {
              if (!isAuthenticated()) { setShowAuthModal(true); return; }
              navigate(`/story/${id}`);
            }}>
              {hasPlayed ? ' Read Again' : ' Start Reading'}
            </button>
            {/* Back button now triggers the leave modal instead of navigating directly */}
            <button className="si-btn si-btn-back" onClick={() => setShowLeaveModal(true)}>
              ← Back
            </button>
          </div>

        </div>

        {showAuthModal && (
          <AuthModal
            onClose={() => {
              setShowAuthModal(false);
              if (!isAuthenticated()) navigate(-1);
            }}
            initialMode="signin"
          />
        )}
      </div>

      {/* ── Leave / Back confirmation modal ── */}
      {showLeaveModal && (
        <div className="sb-leave-backdrop" onClick={() => setShowLeaveModal(false)}>
          <div className="sb-leave-modal" onClick={e => e.stopPropagation()}>
            <div className="sb-leave-icon">⚠️</div>
            <h2 className="sb-leave-title">Leave Story?</h2>
            <p className="sb-leave-body">
              Your progress will be lost and this session will be abandoned.<br />
              Are you sure?
            </p>
            <div className="sb-leave-actions">
              <button className="sb-leave-btn sb-leave-stay" onClick={handleCancelLeave}>
                No, Stay
              </button>
              <button className="sb-leave-btn sb-leave-go" onClick={handleConfirmLeave}>
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoryIntro;