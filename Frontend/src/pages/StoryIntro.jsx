import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stories } from '../data/storiesData';
import './StoryIntro.css';

import gingerCover from '../assets/ginger-giraffe.png';
import introBg    from '../assets/stories/ginger/background3.png';

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`story_progress_${id}`);
      if (raw) setPrev(JSON.parse(raw));
    } catch (e) {}
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [id]);

  if (!story) return <div>Story not found</div>;

  const totalPages  = story.pages?.length || 0;
  const hasPlayed   = prev && (prev.attempts || 0) > 0;
  const prevPct     = hasPlayed ? Math.round((prev.overallScore || 0) * 100) : 0;
  const msg         = motivationMsg(prevPct, hasPlayed);

  const barColor = (pct) =>
    pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : pct >= 50 ? '#3b82f6' : '#ef4444';

  return (
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
          <button className="si-btn si-btn-start" onClick={() => navigate(`/story/${id}`)}>
            {hasPlayed ? ' Read Again' : ' Start Reading'}
          </button>
          <button className="si-btn si-btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

      </div>
    </div>
  );
};

export default StoryIntro;