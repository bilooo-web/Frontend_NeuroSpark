import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import AnomalyList from '../components/therapist/AnomalyList';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import guardianService from '../services/guardianService';

const Anomalies = () => {
  const { isTherapist } = useApp();
  const navigate = useNavigate();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!isTherapist) {
      navigate('/guardian/dashboard');
      return;
    }
    
    loadAnomalies();
  }, [isTherapist]);

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const response = await guardianService.getAllAnomalies();
      console.log('Anomalies:', JSON.stringify(response));
      setAnomalies(response.data || []);
    } catch (err) {
      setError('Failed to load anomalies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isTherapist) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="nt-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="nt-page-header">
        <div>
          <div className="nt-page-title">Anomalies</div>
          <div className="nt-page-subtitle">All flagged sessions across your patients</div>
        </div>
      </div>

      {error && (
        <div className="nt-error-message" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="nt-card" style={{ marginBottom: 24 }}>
        <div className="nt-card-header">
          <span className="nt-card-title">Flagged Sessions</span>
        </div>
        {anomalies.length === 0 ? (
          <div className="nt-empty-state">No anomalies detected.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="nt-table">
              <thead>
                <tr>
                  <th>Child</th>
                  <th>Date</th>
                  <th>Reason</th>
                  <th>Severity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map(a => (
                  <tr key={a.session_id || a.id}>
                    <td style={{ fontWeight: 600 }}>{a.child_name}</td>
                    <td>{a.played_at || a.date}</td>
                    <td>{a.reason}</td>
                    <td>
                      <span className={`nt-badge ${a.severity || 'medium'}`}>
                        {a.severity || 'medium'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="nt-anomaly-action"
                        onClick={() => navigate(`/guardian/children/${a.child_id}?tab=anomalies`)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnomalyList anomalies={anomalies} />
    </DashboardLayout>
  );
};

export default Anomalies;