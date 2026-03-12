import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProgressLineChart from '../components/charts/ProgressLineChart';
import PerformanceBarChart from '../components/charts/PerformanceBarChart';
import GaugeChart from '../components/charts/GaugeChart';
import AnomalyList from '../components/therapist/AnomalyList';
import { Coins, ArrowLeft, Gamepad2, Mic, Brain, AlertTriangle, FileText, Clock, Download, CheckCircle } from 'lucide-react';
import guardianService from '../services/guardianService';

const ChildDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [child, setChild] = useState(null);
  const [progress, setProgress] = useState(null);
  const [insights, setInsights] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Export state
  const [therapistNotes, setTherapistNotes] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

  useEffect(() => {
    loadChildData();
  }, [id]);

  const loadChildData = async () => {
    try {
      setLoading(true);

      const progressRes = await guardianService.getChildProgress(id);
      // ✅ Correct: backend returns { success, data: { child, summary, weekly_progress, ... } }
      const progressData = progressRes.data;
      setChild(progressData.child);
      setProgress(progressData);
      console.log('WEEKLY:', JSON.stringify(progressData?.weekly_progress));
      console.log('GAME PERF:', JSON.stringify(progressData?.game_performance));

      try {
        const insightsRes = await guardianService.getChildInsights(id);
        console.log('INSIGHTS:', JSON.stringify(insightsRes));
        setInsights(insightsRes.insights || insightsRes.data?.insights || insightsRes.data);
      } catch {
        console.log('Insights not available');
      }

      try {
        const anomaliesRes = await guardianService.getChildAnomalies(id);
        setAnomalies(anomaliesRes.anomalies || anomaliesRes.data || []);
      } catch {
        console.log('Anomalies not available');
      }

    } catch (err) {
      setError('Failed to load child data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getInterpretation = (metric, val) => {
    if (!val) return 'No data yet';
    if (metric === 'attention') return val >= 75 ? 'Excellent focus' : val >= 50 ? 'Moderate' : 'Needs support';
    if (metric === 'impulsivity') return val <= 30 ? 'Well-controlled' : val <= 60 ? 'Moderate' : 'High';
    return val >= 75 ? 'Stable' : val >= 50 ? 'Some variability' : 'Unstable';
  };

  // ✅ Correct field mapping from backend
  const childName = child?.user?.full_name || 'Unknown';
  const childAge = child?.date_of_birth
    ? new Date().getFullYear() - new Date(child.date_of_birth).getFullYear()
    : '?';
  const childUsername = child?.user?.username || '';
  const totalCoins = child?.total_coins || 0;
  const totalGames = progress?.summary?.total_games || 0;
  const completionRate = Math.round(progress?.summary?.completion_rate || 0);
  const avgDuration = Math.round(progress?.summary?.avg_session_duration || 0);
  const recommendations = progress?.recommendations || [];

  // ✅ CSV Export
  const handleExportCSV = () => {
    setExportingCsv(true);
    try {
      let csv = '';

      csv += 'CHILD INFORMATION\n';
      csv += `Name,${childName}\nUsername,${childUsername}\nAge,${childAge}\n`;
      csv += `Date of Birth,${child?.date_of_birth || 'N/A'}\nTotal Coins,${totalCoins}\n`;
      csv += `Relation Type,${progress?.guardian_relation?.type || 'N/A'}\n\n`;

      csv += 'PERFORMANCE SUMMARY\n';
      csv += `Total Games,${totalGames}\nCompletion Rate,${completionRate}%\n`;
      csv += `Avg Session Duration,${avgDuration}s\n\n`;

      csv += 'WEEKLY PROGRESS\n';
      csv += 'Week,Avg Score,Avg Accuracy,Games Count\n';
      if (progress?.weekly_progress?.length > 0) {
        progress.weekly_progress.forEach(w => {
          csv += `${w.week},${Math.round(w.avg_score || 0)},${Math.round(w.avg_accuracy || 0)},${w.games_count || 0}\n`;
        });
      } else {
        csv += 'No data available\n';
      }
      csv += '\n';

      csv += 'GAME PERFORMANCE\n';
      csv += 'Game,Avg Score,Avg Accuracy,Play Count\n';
      if (progress?.game_performance?.length > 0) {
        progress.game_performance.forEach(g => {
          csv += `${g.game?.name || 'Unknown'},${Math.round(g.avg_score || 0)},${Math.round(g.avg_accuracy || 0)},${g.play_count || 0}\n`;
        });
      } else {
        csv += 'No data available\n';
      }
      csv += '\n';

      csv += 'BEHAVIORAL INSIGHTS\n';
      if (insights) {
        csv += `Attention Score,${insights.attention_score || 0}\n`;
        csv += `Impulsivity Score,${insights.impulsivity_score || 0}\n`;
        csv += `Consistency Score,${insights.consistency_score || 0}\n`;
        csv += `Best Time of Day,${insights.best_time_of_day || 'N/A'}\n`;
      } else {
        csv += 'No insights available yet\n';
      }
      csv += '\n';

      csv += 'RECOMMENDATIONS\n';
      recommendations.forEach((rec, i) => { csv += `${i + 1},${rec}\n`; });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${childName.replace(' ', '_')}_report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      setExportSuccess('CSV exported successfully!');
      setTimeout(() => setExportSuccess(''), 3000);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExportingCsv(false);
    }

  };

  // ✅ PDF Report with therapist notes
  const handleGeneratePDF = () => {
    setGeneratingPdf(true);
    try {
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const initials = childName.split(' ').map(n => n[0]).join('').slice(0, 2);

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Clinical Report - ${childName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff;}
.header{background:linear-gradient(135deg,#1a6b3c,#22c55e);color:white;padding:40px;display:flex;justify-content:space-between;align-items:center;}
.header h1{font-size:28px;font-weight:700;margin-bottom:4px;}
.header p{font-size:14px;opacity:.85;}
.badge{background:rgba(255,255,255,.2);border-radius:20px;padding:6px 16px;font-size:12px;margin-top:8px;display:inline-block;}
.content{padding:40px;}
.profile{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:30px;display:flex;align-items:center;gap:20px;}
.avatar{width:64px;height:64px;background:linear-gradient(135deg,#1a6b3c,#22c55e);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:700;flex-shrink:0;}
.child-info h2{font-size:20px;font-weight:700;}
.child-info p{font-size:13px;color:#6b7280;margin-top:2px;}
.meta{display:flex;gap:20px;margin-top:10px;flex-wrap:wrap;}
.meta-item{font-size:13px;color:#374151;}.meta-item span{font-weight:600;color:#1a6b3c;}
.section{margin-bottom:30px;}
.section-title{font-size:16px;font-weight:700;color:#1a6b3c;border-bottom:2px solid #bbf7d0;padding-bottom:8px;margin-bottom:16px;}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
.stat-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;text-align:center;}
.stat-box .val{font-size:24px;font-weight:700;color:#1a6b3c;}.stat-box .lbl{font-size:11px;color:#9ca3af;margin-top:4px;text-transform:uppercase;}
.insights-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.insight-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;text-align:center;}
.insight-box .score{font-size:32px;font-weight:800;}
.green{color:#22c55e;}.amber{color:#f59e0b;}.teal{color:#14b8a6;}
.insight-box .label{font-size:13px;color:#6b7280;margin-top:4px;}
.insight-box .interp{font-size:11px;color:#9ca3af;margin-top:6px;font-style:italic;}
.rec-item{padding:10px 14px;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 8px 8px 0;margin-bottom:8px;font-size:13px;color:#374151;}
.notes-section{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:24px;margin-bottom:30px;}
.notes-section h3{font-size:15px;font-weight:700;color:#92400e;margin-bottom:12px;}
.notes-content{font-size:13px;color:#374151;line-height:1.8;white-space:pre-wrap;min-height:80px;}
.anomaly-item{padding:10px 14px;background:#fff7ed;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;margin-bottom:8px;font-size:13px;}
.footer{background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#9ca3af;}
.sig{border-top:1px solid #d1d5db;width:200px;margin-top:40px;padding-top:8px;font-size:12px;color:#6b7280;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div class="header">
  <div><h1>NeuroSpark</h1><p>Clinical Progress Report</p></div>
  <div style="text-align:right;font-size:13px;opacity:.9;">
    <div>Report Date: ${today}</div>
    <div class="badge">CONFIDENTIAL — THERAPIST USE ONLY</div>
  </div>
</div>
<div class="content">
  <div class="profile">
    <div class="avatar">${initials}</div>
    <div class="child-info">
      <h2>${childName}</h2>
      <p>@${childUsername}</p>
      <div class="meta">
        <div class="meta-item">Age: <span>${childAge} years</span></div>
        <div class="meta-item">DOB: <span>${child?.date_of_birth || 'N/A'}</span></div>
        <div class="meta-item">Coins: <span>${totalCoins}</span></div>
        <div class="meta-item">Relation: <span>${progress?.guardian_relation?.type || 'N/A'}</span></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📊 Performance Summary</div>
    <div class="stats-grid">
      <div class="stat-box"><div class="val">${totalGames}</div><div class="lbl">Total Games</div></div>
      <div class="stat-box"><div class="val">${completionRate}%</div><div class="lbl">Completion Rate</div></div>
      <div class="stat-box"><div class="val">${avgDuration}s</div><div class="lbl">Avg Duration</div></div>
      <div class="stat-box"><div class="val">${totalCoins}</div><div class="lbl">Total Coins</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🧠 Behavioral Insights</div>
    ${insights ? `
    <div class="insights-grid">
      <div class="insight-box"><div class="score green">${insights.attention_score || 0}</div><div class="label">Attention</div><div class="interp">${getInterpretation('attention', insights.attention_score)}</div></div>
      <div class="insight-box"><div class="score amber">${insights.impulsivity_score || 0}</div><div class="label">Impulsivity</div><div class="interp">${getInterpretation('impulsivity', insights.impulsivity_score)}</div></div>
      <div class="insight-box"><div class="score teal">${insights.consistency_score || 0}</div><div class="label">Consistency</div><div class="interp">${getInterpretation('consistency', insights.consistency_score)}</div></div>
    </div>
    ${insights.best_time_of_day ? `<p style="margin-top:12px;font-size:13px;">📅 Best time: <strong>${insights.best_time_of_day}</strong></p>` : ''}
    ` : '<p style="color:#9ca3af;font-style:italic;font-size:13px;">No behavioral insights available yet.</p>'}
  </div>

  ${recommendations.length > 0 ? `
  <div class="section">
    <div class="section-title">💡 Recommendations</div>
    ${recommendations.map(r => `<div class="rec-item">${r}</div>`).join('')}
  </div>` : ''}

  ${anomalies.length > 0 ? `
  <div class="section">
    <div class="section-title">⚠️ Flagged Sessions</div>
    ${anomalies.slice(0, 5).map(a => `<div class="anomaly-item">${a.reason || a.description || ''}</div>`).join('')}
  </div>` : ''}

  <div class="notes-section">
    <h3>📝 Therapist Clinical Notes</h3>
    <div class="notes-content">${therapistNotes.trim() || '<span style="color:#9ca3af;font-style:italic;">No notes added.</span>'}</div>
  </div>

  <div class="sig">Therapist Signature</div>
</div>
<div class="footer">
  <div>NeuroSpark — Confidential Clinical Report</div>
  <div>Generated: ${today}</div>
  <div>Patient: ${childName}</div>
</div>
</body></html>`;

      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);

      setExportSuccess("PDF opened — use browser's Save as PDF.");
      setTimeout(() => setExportSuccess(''), 4000);
    } catch (err) {
      console.error('PDF failed:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const allTabs = [
    { key: 'overview', label: 'Overview', icon: <Gamepad2 /> },
    { key: 'insights', label: 'Behavioral Insights', icon: <Brain /> },
    { key: 'anomalies', label: 'Anomalies', icon: <AlertTriangle /> },
    { key: 'export', label: 'Export & Reports', icon: <FileText /> },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="nt-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !child) {
    return (
      <DashboardLayout>
        <div className="nt-empty-state">{error || 'Child not found'}</div>
      </DashboardLayout>
    );
  }

  const initials = childName.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <DashboardLayout>
      <button className="nt-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft /> Back
      </button>

      <div className="nt-child-detail-header">
        <div className="nt-child-detail-avatar">{initials}</div>
        <div>
          <div className="nt-child-detail-name">{childName}</div>
          <div className="nt-child-detail-age">Age {childAge} · @{childUsername}</div>
        </div>
        <div className="nt-coins-badge">
          <Coins /> {totalCoins} coins
        </div>
      </div>

      <div className="nt-tabs">
        {allTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`nt-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="nt-space-y-6">
          <div className="nt-stats-grid">
            <div className="nt-stat-card">
              <div className="nt-stat-icon green"><Gamepad2 /></div>
              <div className="nt-stat-content">
                <div className="nt-stat-label">Total Sessions</div>
                <div className="nt-stat-value">{totalGames}</div>
              </div>
            </div>
            <div className="nt-stat-card">
              <div className="nt-stat-icon teal"><Mic /></div>
              <div className="nt-stat-content">
                <div className="nt-stat-label">Completion Rate</div>
                <div className="nt-stat-value">{completionRate}%</div>
              </div>
            </div>
            <div className="nt-stat-card">
              <div className="nt-stat-icon blue"><Clock /></div>
              <div className="nt-stat-content">
                <div className="nt-stat-label">Avg. Duration</div>
                <div className="nt-stat-value">{avgDuration}s</div>
              </div>
            </div>
            <div className="nt-stat-card">
              <div className="nt-stat-icon amber"><Coins /></div>
              <div className="nt-stat-content">
                <div className="nt-stat-label">Total Coins</div>
                <div className="nt-stat-value">{totalCoins}</div>
              </div>
            </div>
          </div>

          <ProgressLineChart
            data={progress?.weekly_progress || []}
            title="Performance Trend (Last 30 Days)"
          />

          <PerformanceBarChart
            data={progress?.game_performance?.map(g => ({
              name: g.game?.name || 'Unknown',
              value: Math.round(g.avg_score || 0)
            })) || []}
            title="Average Score by Game"
          />

          {recommendations.length > 0 && (
            <div className="nt-card">
              <div className="nt-card-header">
                <span className="nt-card-title">💡 Recommendations</span>
              </div>
              {recommendations.map((rec, i) => (
                <div key={i} style={{
                  padding: '10px 14px', background: '#f0fdf4',
                  borderLeft: '3px solid #22c55e', borderRadius: '0 8px 8px 0',
                  marginBottom: 8, fontSize: 13, color: '#374151'
                }}>{rec}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Behavioral Insights */}
      {activeTab === 'insights' && (
        <div className="nt-space-y-6">
          {insights ? (
            <div className="nt-card">
              <div className="nt-card-header">
                <span className="nt-card-title">The Big Three Scores</span>
              </div>
              <div className="nt-insights-row">
                <GaugeChart value={insights.attention_score || 0} label="Attention" color="#22C55E" size={140} interpretation={getInterpretation('attention', insights.attention_score)} />
                <GaugeChart value={insights.impulsivity_score || 0} label="Impulsivity" color="#F59E0B" size={140} interpretation={getInterpretation('impulsivity', insights.impulsivity_score)} />
                <GaugeChart value={insights.consistency_score || 0} label="Consistency" color="#14B8A6" size={140} interpretation={getInterpretation('consistency', insights.consistency_score)} />
              </div>
              {insights.best_time_of_day && (
                <div className="nt-focus-time-card">
                  <Clock />
                  <span className="nt-focus-time-text">
                    📊 Best performance in the <strong>{insights.best_time_of_day}</strong>. Schedule sessions then.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="nt-empty-state" style={{ textAlign: 'center', padding: 40 }}>
              <Brain size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ color: 'var(--nt-text-secondary)' }}>
                No behavioral insights available yet. More game sessions are needed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Anomalies */}
      {activeTab === 'anomalies' && (
        <AnomalyList anomalies={anomalies} />
      )}

      {/* Export & Reports */}
      {activeTab === 'export' && (
        <div className="nt-space-y-4">
          {exportSuccess && (
            <div style={{
              backgroundColor: '#e8f5e9', color: '#2e7d32',
              padding: '12px 16px', borderRadius: 8, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500
            }}>
              <CheckCircle size={18} /> {exportSuccess}
            </div>
          )}

          {/* PDF */}
          <div className="nt-card">
            <div className="nt-card-header">
              <span className="nt-card-title">📄 Clinical PDF Report</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--nt-text-secondary)', marginBottom: 16 }}>
              Generate a professional clinical report for <strong>{childName}</strong> including performance summary, behavioral insights, anomalies, and your personal notes.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                📝 Your Clinical Notes (will appear in the report)
              </label>
              <textarea
                value={therapistNotes}
                onChange={e => setTherapistNotes(e.target.value)}
                placeholder="Add your observations, clinical notes, treatment recommendations..."
                style={{
                  width: '100%', minHeight: 120, padding: 12,
                  borderRadius: 8, border: '1px solid var(--nt-border)',
                  fontSize: 13, background: 'var(--nt-bg-secondary)',
                  resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.6,
                  color: 'var(--nt-text-primary)'
                }}
              />
            </div>
            <button
              className="nt-btn nt-btn-primary"
              onClick={handleGeneratePDF}
              disabled={generatingPdf}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <FileText size={16} />
              {generatingPdf ? 'Generating...' : 'Generate PDF Report'}
            </button>
          </div>

          {/* CSV */}
          <div className="nt-card">
            <div className="nt-card-header">
              <span className="nt-card-title">📊 Export Raw Data (CSV)</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--nt-text-secondary)', marginBottom: 16 }}>
              Export all available data for <strong>{childName}</strong> including performance summary, weekly progress, game performance, behavioral insights, and recommendations.
            </p>
            <button
              className="nt-btn nt-btn-outline"
              onClick={handleExportCSV}
              disabled={exportingCsv}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Download size={16} />
              {exportingCsv ? 'Exporting...' : 'Export Raw Data (CSV)'}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChildDetail;