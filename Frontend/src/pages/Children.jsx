import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ChildCard from '../components/children/ChildCard';
import LinkChildModal from '../components/modals/LinkChildModal';
import { Search, UserPlus, Download, RefreshCw, Trash2 } from 'lucide-react';
import guardianService from '../services/guardianService';

const Children = () => {
  const [search, setSearch] = useState('');
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  // Unlink confirmation state
  const [childToUnlink, setChildToUnlink] = useState(null);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  // Load children on component mount
  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await guardianService.getChildren();
      console.log('Children API response:', response);
      
      // Handle different response structures
      let childrenData = [];
      
      if (response.data?.children) {
        childrenData = response.data.children;
      } else if (response.children) {
        childrenData = response.children;
      } else if (Array.isArray(response.data)) {
        childrenData = response.data;
      } else if (Array.isArray(response)) {
        childrenData = response;
      }
      
      setChildren(childrenData);
    } catch (err) {
      console.error('Failed to load children:', err);
      setError(err.response?.data?.message || 'Failed to load children. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadChildren();
  };

  const handleLinkSuccess = (newChild) => {
    // Add the new child to the list
    setChildren(prev => [newChild, ...prev]);
  };

  const handleUnlinkClick = (child) => {
    setChildToUnlink(child);
    setShowUnlinkConfirm(true);
  };

  const handleUnlinkConfirm = async () => {
    if (!childToUnlink) return;
    
    setUnlinking(true);
    setError('');
    
    try {
      await guardianService.unlinkChild(childToUnlink.id);
      
      // Remove child from list
      setChildren(prev => prev.filter(c => c.id !== childToUnlink.id));
      setShowUnlinkConfirm(false);
      setChildToUnlink(null);
    } catch (err) {
      console.error('Unlink child error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to unlink child');
    } finally {
      setUnlinking(false);
    }
  };

  // Filter children based on search
  const filteredChildren = children.filter(child =>
  child.user?.full_name?.toLowerCase().includes(search.toLowerCase()) 
  );

  // Export to CSV function
  const exportToCSV = () => {
    if (children.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['ID', 'Name', 'Age', 'Coins', 'Games Played', 'Voice Attempts', 'Last Active', 'Avg Score', 'Avg Accuracy'];
    
    const rows = children.map(child => [
      child.id,
      child.user?.full_name || 'Unknown',
      child.age || '',
      child.total_coins || child.coins || 0,
      child.games_played || 0,
      child.voice_attempts || 0,
      child.last_active || 'Unknown',
      child.average_score || 0,
      child.average_accuracy || 0
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `neurotrack_children_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="nt-loading-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="nt-spinner" style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid var(--nt-border)',
            borderTopColor: 'var(--nt-accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: 'var(--nt-text-secondary)' }}>Loading your children...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="nt-page-header">
        <div>
          <div className="nt-page-title">Children</div>
          <div className="nt-page-subtitle">
            {children.length} {children.length === 1 ? 'child' : 'children'} under your care
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="nt-btn nt-btn-outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} className={refreshing ? 'nt-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            className="nt-btn nt-btn-outline" 
            onClick={exportToCSV}
            disabled={children.length === 0}
          >
            <Download size={16} /> Export CSV
          </button>
          <button 
            className="nt-btn nt-btn-primary" 
            onClick={() => setShowLinkModal(true)}
          >
            <UserPlus size={16} /> Link Child
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="nt-error-message" style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '12px 16px', 
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>❌ {error}</span>
          <button 
            onClick={loadChildren}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#c62828', 
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="nt-search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search children by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Children Grid */}
      {filteredChildren.length === 0 ? (
        <div className="nt-empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
          {children.length === 0 ? (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>👶</div>
              <h3 style={{ marginBottom: '8px', color: 'var(--nt-text-primary)' }}>No children yet</h3>
              <p style={{ color: 'var(--nt-text-secondary)', marginBottom: '20px' }}>
                You haven't linked any children to your account yet.
              </p>
              <button className="nt-btn nt-btn-primary" onClick={() => setShowLinkModal(true)}>
                <UserPlus size={16} /> Link Your First Child
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
              <h3 style={{ marginBottom: '8px', color: 'var(--nt-text-primary)' }}>No matches found</h3>
              <p style={{ color: 'var(--nt-text-secondary)' }}>
                No children match your search "{search}".
              </p>
              <button 
                className="nt-btn nt-btn-outline" 
                onClick={() => setSearch('')}
                style={{ marginTop: '16px' }}
              >
                Clear Search
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="nt-children-grid">
          {filteredChildren.map(child => (
            <div key={child.id} style={{ position: 'relative' }}>
              <ChildCard child={child} showActions={true} />
              <button
                onClick={() => handleUnlinkClick(child)}
                className="nt-child-unlink-btn"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  zIndex: 5
                }}
                title="Unlink child"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Link Child Modal */}
      <LinkChildModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSuccess={handleLinkSuccess}
      />

      {/* Unlink Confirmation Modal */}
      {showUnlinkConfirm && childToUnlink && (
        <div className="nt-modal-overlay" onClick={() => !unlinking && setShowUnlinkConfirm(false)}>
          <div className="nt-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="nt-modal-header">
              <h3 className="nt-modal-title">Unlink Child</h3>
              <button 
                className="nt-modal-close" 
                onClick={() => !unlinking && setShowUnlinkConfirm(false)}
                disabled={unlinking}
              >
                <X size={20} />
              </button>
            </div>

            <div className="nt-modal-body">
              <p style={{ marginBottom: '16px' }}>
                Are you sure you want to unlink <strong>{childToUnlink.user?.full_name || 'Unknown child'}</strong>?
                This will remove them from your list. You can link them again later if needed.
              </p>

              {error && (
                <div className="nt-error-message" style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  {error}
                </div>
              )}

              <div className="nt-modal-actions">
                <button
                  className="nt-btn nt-btn-outline"
                  onClick={() => setShowUnlinkConfirm(false)}
                  disabled={unlinking}
                >
                  Cancel
                </button>
                <button
                  className="nt-btn nt-btn-danger"
                  onClick={handleUnlinkConfirm}
                  disabled={unlinking}
                >
                  {unlinking ? 'Unlinking...' : 'Yes, Unlink'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .nt-spin {
          animation: spin 1s linear infinite;
        }
        .nt-child-unlink-btn:hover {
          background: rgba(239, 68, 68, 0.2) !important;
          transform: scale(1.1);
        }
      `}</style>
    </DashboardLayout>
  );
};

export default Children;