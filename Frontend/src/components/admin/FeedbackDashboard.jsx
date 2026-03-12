// FeedbackDashboard.jsx - Updated with inline approve/reject buttons
import { useState, useEffect } from "react";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Download,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from "lucide-react"; // Removed Star import
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import Modal from "../../components/admin/Modal";
import feedbackService from "../../services/feedbackService";

const COLORS = {
  positive: "#10b981", // Green
  neutral: "#f59e0b",  // Amber
  negative: "#ef4444"   // Red
};

const FeedbackDashboard = () => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [period, setPeriod] = useState('week');
  const [exportLoading, setExportLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchData();
  }, [currentPage, filterSentiment, filterApproval, period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        sentiment: filterSentiment !== 'all' ? filterSentiment : '',
        approvalStatus: filterApproval !== 'all' ? filterApproval : ''
      };
      
      const [feedbackRes, statsRes, trendsRes] = await Promise.all([
        feedbackService.getAllFeedback(currentPage, 20, filters),
        feedbackService.getFeedbackStats(),
        feedbackService.getFeedbackTrends(period)
      ]);
      
      setFeedback(feedbackRes.feedback || []);
      setTotalPages(feedbackRes.totalPages || 1);
      setStats(statsRes);
      setTrends(trendsRes);
    } catch (err) {
      console.error("Feedback fetch error:", err);
      setError('Failed to load feedback data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = (item) => {
    setSelectedFeedback(item);
    setModalOpen(true);
  };

  const handleApprove = async (id, isFeatured = false) => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: 'approve' }));
      await feedbackService.approveFeedback(id, isFeatured);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error("Approve error:", err);
      alert('Failed to approve feedback');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this feedback? It will not be shown on the homepage.')) {
      return;
    }
    
    try {
      setActionLoading(prev => ({ ...prev, [id]: 'reject' }));
      await feedbackService.rejectFeedback(id);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error("Reject error:", err);
      alert('Failed to reject feedback');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const blob = await feedbackService.exportFeedback('csv');
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert('Failed to export feedback. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch(sentiment) {
      case 'positive': return <ThumbsUp size={14} />;
      case 'negative': return <ThumbsDown size={14} />;
      default: return <Minus size={14} />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive': return COLORS.positive;
      case 'negative': return COLORS.negative;
      default: return COLORS.neutral;
    }
  };

  const getSentimentBg = (sentiment) => {
    switch(sentiment) {
      case 'positive': return 'rgba(16, 185, 129, 0.1)';
      case 'negative': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(245, 158, 11, 0.1)';
    }
  };

  // Filter feedback by search term
  const filteredFeedback = feedback.filter(item => 
    item.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.childName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare chart data
  const pieData = stats ? [
    { name: 'Positive', value: stats.breakdown?.positive || 0, color: COLORS.positive },
    { name: 'Neutral', value: stats.breakdown?.neutral || 0, color: COLORS.neutral },
    { name: 'Negative', value: stats.breakdown?.negative || 0, color: COLORS.negative }
  ].filter(item => item.value > 0) : [];

  if (loading && !feedback.length) {
    return (
      <div className="page-section">
        <div className="admin-loading-page">
          <div className="admin-spinner" />
          <p>Loading feedback data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      {/* Header */}
      <div className="page-header">
        <div >
          <h1>Feedback & Sentiment Analysis</h1>
          <p>Review and manage user feedback. Approved feedback will appear on the homepage.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button 
            className="btn btn-outline" 
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw style={{ height: 16, width: 16, marginRight: 8 }} />
            Refresh
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExport}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <>
                <div className="admin-spinner-sm" style={{ marginRight: 8 }} />
                Exporting...
              </>
            ) : (
              <>
                <Download style={{ height: 16, width: 16, marginRight: 8 }} />
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card" style={{ 
          background: 'rgba(239, 68, 68, 0.05)', 
          borderColor: 'rgba(239, 68, 68, 0.2)',
          padding: 20,
          marginBottom: 24
        }}>
          <p style={{ color: COLORS.negative, marginBottom: 12 }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchData}>
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid-4">
        <div className="admin-summary-card">
          <div className="admin-summary-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: COLORS.positive }}>
            <MessageSquare size={24} />
          </div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Total Feedback</div>
            <div className="admin-summary-card-value">{stats?.total || 0}</div>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: COLORS.positive }}>
            <CheckCircle size={24} />
          </div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Approved</div>
            <div className="admin-summary-card-value">
              {stats?.breakdown ? Object.values(stats.breakdown).reduce((a, b) => a + b, 0) : 0}
            </div>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: COLORS.neutral }}>
            <Clock size={24} />
          </div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Pending Review</div>
            <div className="admin-summary-card-value">0</div>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-card-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: COLORS.negative }}>
            <ThumbsUp size={24} />
          </div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Positive Rate</div>
            <div className="admin-summary-card-value">{stats?.percentages?.positive || 0}%</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-charts">
        {/* Sentiment Distribution Pie Chart */}
        <div className="glass-card chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Filter size={20} />
            Sentiment Distribution
          </h3>
          
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              <ResponsiveContainer width="100%" height={220}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {pieData.map((item, i) => (
                  <div key={i} className="pie-legend-item">
                    <div className="pie-legend-dot" style={{ background: item.color }} />
                    <span className="pie-legend-label">
                      {item.name}: {item.value} ({((item.value / stats.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No feedback data available yet</p>
            </div>
          )}
        </div>

        {/* Sentiment Trends Chart */}
        <div className="glass-card chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} />
              Sentiment Trends
            </h3>
            <div className="filter-group">
              <button 
                className={`filter-btn ${period === 'week' ? 'active' : ''}`}
                onClick={() => setPeriod('week')}
              >
                Week
              </button>
              <button 
                className={`filter-btn ${period === 'month' ? 'active' : ''}`}
                onClick={() => setPeriod('month')}
              >
                Month
              </button>
            </div>
          </div>
          
          {trends && trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.positive} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.positive} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.neutral} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.neutral} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.negative} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.negative} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#888" }} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="positive" 
                  stroke={COLORS.positive} 
                  fill="url(#positiveGradient)" 
                  name="Positive"
                />
                <Area 
                  type="monotone" 
                  dataKey="neutral" 
                  stroke={COLORS.neutral} 
                  fill="url(#neutralGradient)" 
                  name="Neutral"
                />
                <Area 
                  type="monotone" 
                  dataKey="negative" 
                  stroke={COLORS.negative} 
                  fill="url(#negativeGradient)" 
                  name="Negative"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>No trend data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-box" style={{ maxWidth: 350 }}>
          <Search size={16} style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search feedback or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <button 
            className={`filter-btn ${filterSentiment === 'all' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('all')}
          >
            All Sentiments
          </button>
          <button 
            className={`filter-btn ${filterSentiment === 'positive' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('positive')}
          >
            <ThumbsUp size={14} style={{ marginRight: 6 }} />
            Positive
          </button>
          <button 
            className={`filter-btn ${filterSentiment === 'neutral' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('neutral')}
          >
            <Minus size={14} style={{ marginRight: 6 }} />
            Neutral
          </button>
          <button 
            className={`filter-btn ${filterSentiment === 'negative' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('negative')}
          >
            <ThumbsDown size={14} style={{ marginRight: 6 }} />
            Negative
          </button>
        </div>

        <div className="filter-group">
          <button 
            className={`filter-btn ${filterApproval === 'all' ? 'active' : ''}`}
            onClick={() => setFilterApproval('all')}
          >
            All Status
          </button>
          <button 
            className={`filter-btn ${filterApproval === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterApproval('approved')}
          >
            <CheckCircle size={14} style={{ marginRight: 6 }} />
            Approved
          </button>
          <button 
            className={`filter-btn ${filterApproval === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterApproval('pending')}
          >
            <Clock size={14} style={{ marginRight: 6 }} />
            Pending
          </button>
        </div>
      </div>

      {/* Feedback Table with Inline Approve/Reject Buttons */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Feedback</th>
                <th style={{ width: '15%' }}>User</th>
                <th style={{ width: '10%' }}>Sentiment</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '10%' }}>Date</th>
                <th style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedback.length > 0 ? (
                filteredFeedback.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ 
                        maxWidth: 300, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.text}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">{item.userName || 'Anonymous'}</div>
                        <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>
                          {item.userType || 'user'}
                          {item.childName && ` • ${item.childName}`}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          background: getSentimentBg(item.sentiment),
                          color: getSentimentColor(item.sentiment),
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 8px'
                        }}
                      >
                        {getSentimentIcon(item.sentiment)}
                        <span style={{ textTransform: 'capitalize' }}>
                          {item.sentiment}
                        </span>
                      </span>
                    </td>
                    <td>
                      {item.isApproved ? (
                        <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                          <CheckCircle size={12} style={{ marginRight: 4 }} />
                          Approved
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                          <Clock size={12} style={{ marginRight: 4 }} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="text-muted">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button 
                          className="btn-ghost"
                          onClick={() => handleViewFeedback(item)}
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {!item.isApproved ? (
                          <>
                            <button 
                              className="btn-ghost" 
                              style={{ color: '#10b981' }}
                              onClick={() => handleApprove(item.id, false)}
                              disabled={actionLoading[item.id] === 'approve'}
                              title="Approve (will show on homepage)"
                            >
                              {actionLoading[item.id] === 'approve' ? (
                                <div className="admin-spinner-sm" style={{ width: 18, height: 18 }} />
                              ) : (
                                <CheckCircle size={18} />
                              )}
                            </button>
                            <button 
                              className="btn-ghost" 
                              style={{ color: '#ef4444' }}
                              onClick={() => handleReject(item.id)}
                              disabled={actionLoading[item.id] === 'reject'}
                              title="Reject"
                            >
                              {actionLoading[item.id] === 'reject' ? (
                                <div className="admin-spinner-sm" style={{ width: 18, height: 18 }} />
                              ) : (
                                <XCircle size={18} />
                              )}
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn-ghost" 
                            style={{ color: '#ef4444' }}
                            onClick={() => handleReject(item.id)}
                            disabled={actionLoading[item.id] === 'reject'}
                            title="Remove from homepage"
                          >
                            {actionLoading[item.id] === 'reject' ? (
                              <div className="admin-spinner-sm" style={{ width: 18, height: 18 }} />
                            ) : (
                              <XCircle size={18} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 48 }}>
                    <MessageSquare size={32} style={{ margin: '0 auto 12px', color: 'var(--muted-foreground)' }} />
                    <p className="text-muted">No feedback found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="table-pagination">
            <div className="text-muted">
              Page {currentPage} of {totalPages}
            </div>
            <div className="table-pagination-btns">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Feedback Details"
      >
        {selectedFeedback && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Feedback Text */}
            <div className="modal-field">
              <div className="modal-field-label">Feedback</div>
              <div className="modal-field-value" style={{ 
                background: 'var(--muted)',
                padding: 16,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6
              }}>
                {selectedFeedback.text}
              </div>
            </div>

            {/* Status */}
            <div className="modal-field">
              <div className="modal-field-label">Status</div>
              <div>
                {selectedFeedback.isApproved ? (
                  <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                    <CheckCircle size={14} style={{ marginRight: 6 }} />
                    Approved for Homepage
                  </span>
                ) : (
                  <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                    <Clock size={14} style={{ marginRight: 6 }} />
                    Pending Review
                  </span>
                )}
              </div>
            </div>

            {/* Sentiment Badge */}
            <div className="modal-field">
              <div className="modal-field-label">Sentiment Analysis</div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <span 
                  className="badge" 
                  style={{ 
                    background: getSentimentBg(selectedFeedback.sentiment),
                    color: getSentimentColor(selectedFeedback.sentiment),
                    padding: '8px 16px',
                    fontSize: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {getSentimentIcon(selectedFeedback.sentiment)}
                  <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    {selectedFeedback.sentiment}
                  </span>
                </span>
                <span className="text-muted">
                  Confidence: {(selectedFeedback.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Detailed Scores */}
            {selectedFeedback.scores && (
              <div className="modal-field">
                <div className="modal-field-label">Detailed Sentiment Scores</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 12, 
                    background: 'rgba(16, 185, 129, 0.05)',
                    borderRadius: 8
                  }}>
                    <div style={{ color: COLORS.positive, fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
                      Positive
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.positive }}>
                      {(selectedFeedback.scores.positive * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 12, 
                    background: 'rgba(245, 158, 11, 0.05)',
                    borderRadius: 8
                  }}>
                    <div style={{ color: COLORS.neutral, fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
                      Neutral
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.neutral }}>
                      {(selectedFeedback.scores.neutral * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 12, 
                    background: 'rgba(239, 68, 68, 0.05)',
                    borderRadius: 8
                  }}>
                    <div style={{ color: COLORS.negative, fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
                      Negative
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.negative }}>
                      {(selectedFeedback.scores.negative * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="modal-field">
              <div className="modal-field-label">User Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <div className="text-muted text-sm">Name</div>
                  <div className="font-medium">{selectedFeedback.userName || 'Anonymous'}</div>
                </div>
                <div>
                  <div className="text-muted text-sm">Type</div>
                  <div className="font-medium" style={{ textTransform: 'capitalize' }}>
                    {selectedFeedback.userType || 'user'}
                  </div>
                </div>
                {selectedFeedback.childName && (
                  <div>
                    <div className="text-muted text-sm">Child</div>
                    <div className="font-medium">
                      {selectedFeedback.childName}
                      {selectedFeedback.childAge && ` (${selectedFeedback.childAge} years)`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <div className="modal-field">
              <div className="modal-field-label">Submitted</div>
              <div className="modal-field-value">
                {new Date(selectedFeedback.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Quick Actions in Modal */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              {!selectedFeedback.isApproved ? (
                <>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      handleApprove(selectedFeedback.id, false);
                      setModalOpen(false);
                    }}
                  >
                    <CheckCircle size={16} style={{ marginRight: 8 }} />
                    Approve for Homepage
                  </button>
                  <button 
                    className="btn btn-outline"
                    style={{ color: '#ef4444' }}
                    onClick={() => {
                      handleReject(selectedFeedback.id);
                      setModalOpen(false);
                    }}
                  >
                    <XCircle size={16} style={{ marginRight: 8 }} />
                    Reject
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-outline"
                  style={{ color: '#ef4444' }}
                  onClick={() => {
                    handleReject(selectedFeedback.id);
                    setModalOpen(false);
                  }}
                >
                  <XCircle size={16} style={{ marginRight: 8 }} />
                  Remove from Homepage
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeedbackDashboard;