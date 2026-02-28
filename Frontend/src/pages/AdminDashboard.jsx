import { useState, useEffect } from "react";
import {
  Users,
  Gamepad2,
  BookOpen,
  Coins,
  Activity,
  TrendingUp,
  Baby,
  ShieldCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import StatCard from "../components/admin/StatCard";
import adminService from "../services/adminService";

const COLORS = ["#00a896", "#e6a014", "#3282dc", "#28a764", "#dc3232"];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, metricsRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getSystemMetrics(),
      ]);
      setStats(dashRes.stats);
      setMetrics(metricsRes);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-section">
        <div className="admin-loading-page">
          <div className="admin-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-section">
        <div className="glass-card" style={{ textAlign: "center", padding: 40 }}>
          <p className="text-destructive" style={{ marginBottom: 12 }}>Failed to load dashboard</p>
          <p className="text-muted text-sm">{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const userGrowthData = metrics?.user_metrics
    ? [...metrics.user_metrics].reverse().map((m) => ({
        month: m.month,
        Guardians: parseInt(m.guardians),
        Children: parseInt(m.children),
        Admins: parseInt(m.admins),
        Total: parseInt(m.total),
      }))
    : [];

  const gameSessionData = metrics?.game_metrics
    ? [...metrics.game_metrics].reverse().map((m) => ({
        day: m.day,
        Sessions: parseInt(m.sessions),
        "Avg Score": parseFloat(m.avg_score || 0).toFixed(1),
        Coins: parseInt(m.total_coins || 0),
      }))
    : [];

  const voiceAttemptData = metrics?.voice_metrics
    ? [...metrics.voice_metrics].reverse().map((m) => ({
        day: m.day,
        Attempts: parseInt(m.attempts),
        "Avg Accuracy": parseFloat(m.avg_accuracy || 0).toFixed(1),
        "Avg Pronunciation": parseFloat(m.avg_pronunciation || 0).toFixed(1),
      }))
    : [];

  const gameTypeData = metrics?.game_type_breakdown
    ? metrics.game_type_breakdown.map((g) => ({
        name: g.type.charAt(0).toUpperCase() + g.type.slice(1),
        value: parseInt(g.total),
      }))
    : [];

  const guardianTypeData = metrics?.guardian_types
    ? [
        { name: "Parents", value: metrics.guardian_types.parents },
        { name: "Therapists", value: metrics.guardian_types.therapists },
      ]
    : [];

  const recentGameSessions = metrics?.recent_activity?.game_sessions || [];
  const recentVoiceAttempts = metrics?.recent_activity?.voice_attempts || [];

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Real-time platform analytics and insights</p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}>
          <Activity style={{ height: 16, width: 16 }} />
          Refresh
        </button>
      </div>

      <div className="grid-4">
        <StatCard title="Total Users" value={stats?.total_users || 0} icon={Users} variant="primary" trend={{ value: stats?.active_users_today || 0, label: "new today" }} delay={0} />
        <StatCard title="Children" value={stats?.total_children || 0} icon={Baby} variant="info" delay={100} />
        <StatCard title="Guardians" value={stats?.total_guardians || 0} icon={ShieldCheck} variant="success" trend={{ value: stats?.total_parents || 0, label: `parents, ${stats?.total_therapists || 0} therapists` }} delay={200} />
        <StatCard title="Total Coins" value={(stats?.total_coins_distributed || 0).toLocaleString()} icon={Coins} variant="accent" delay={300} />
      </div>

      <div className="grid-4">
        <StatCard title="Total Games" value={stats?.total_games || 0} icon={Gamepad2} delay={400} />
        <StatCard title="Game Sessions" value={stats?.total_game_sessions || 0} icon={Activity} delay={500} />
        <StatCard title="Voice Instructions" value={stats?.total_voice_instructions || 0} icon={BookOpen} delay={600} />
        <StatCard title="Voice Attempts" value={stats?.total_voice_attempts || 0} icon={TrendingUp} delay={700} />
      </div>

      <div className="grid-charts">
        <div className="glass-card chart-card">
          <h3>User Growth (Monthly)</h3>
          {userGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorGuardians" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00a896" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00a896" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorChildren" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3282dc" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3282dc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#888" }} />
                <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Legend />
                <Area type="monotone" dataKey="Guardians" stroke="#00a896" strokeWidth={2} fill="url(#colorGuardians)" />
                <Area type="monotone" dataKey="Children" stroke="#3282dc" strokeWidth={2} fill="url(#colorChildren)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No user growth data yet</p></div>
          )}
        </div>

        <div className="glass-card chart-card">
          <h3>Game Sessions (Daily)</h3>
          {gameSessionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gameSessionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} />
                <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Bar dataKey="Sessions" fill="#00a896" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No game session data yet</p></div>
          )}
        </div>

        <div className="glass-card chart-card">
          <h3>Voice Attempts (Daily)</h3>
          {voiceAttemptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={voiceAttemptData}>
                <defs>
                  <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e6a014" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#e6a014" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} />
                <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Area type="monotone" dataKey="Attempts" stroke="#e6a014" strokeWidth={2} fill="url(#colorAccuracy)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No voice attempt data available yet</p></div>
          )}
        </div>

        <div className="glass-card chart-card">
          <h3>Distribution</h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <p className="text-sm text-muted" style={{ textAlign: "center", marginBottom: 8 }}>Game Types</p>
              {gameTypeData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={gameTypeData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                        {gameTypeData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {gameTypeData.map((entry, i) => (
                      <div key={i} className="pie-legend-item">
                        <div className="pie-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="pie-legend-label">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted text-sm" style={{ textAlign: "center" }}>No data</p>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <p className="text-sm text-muted" style={{ textAlign: "center", marginBottom: 8 }}>Guardian Types</p>
              {guardianTypeData.some((d) => d.value > 0) ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={guardianTypeData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                        <Cell fill="#00a896" />
                        <Cell fill="#e6a014" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    <div className="pie-legend-item"><div className="pie-legend-dot" style={{ background: "#00a896" }} /><span className="pie-legend-label">Parents ({guardianTypeData[0]?.value || 0})</span></div>
                    <div className="pie-legend-item"><div className="pie-legend-dot" style={{ background: "#e6a014" }} /><span className="pie-legend-label">Therapists ({guardianTypeData[1]?.value || 0})</span></div>
                  </div>
                </>
              ) : (
                <p className="text-muted text-sm" style={{ textAlign: "center" }}>No data</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {metrics?.performance_stats && (
        <div className="glass-card chart-card">
          <h3>Performance Overview</h3>
          <div className="grid-4" style={{ marginTop: 16 }}>
            <div className="report-kpi"><div className="report-kpi-value">{metrics.performance_stats.avg_game_score}</div><div className="report-kpi-label">Avg Game Score</div></div>
            <div className="report-kpi"><div className="report-kpi-value">{metrics.performance_stats.avg_voice_accuracy}%</div><div className="report-kpi-label">Avg Voice Accuracy</div></div>
            <div className="report-kpi"><div className="report-kpi-value">{metrics.performance_stats.avg_voice_pronunciation}%</div><div className="report-kpi-label">Avg Pronunciation</div></div>
            <div className="report-kpi"><div className="report-kpi-value">{(metrics.performance_stats.total_coins_earned || 0).toLocaleString()}</div><div className="report-kpi-label">Total Coins Earned</div></div>
          </div>
        </div>
      )}

      <div className="grid-bottom">
        <div className="glass-card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Game Sessions</h3>
          {recentGameSessions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recentGameSessions.slice(0, 6).map((session) => (
                <div key={session.id} className="activity-item">
                  <div className="activity-avatar" style={{ background: "rgba(0,168,150,0.08)", color: "var(--primary)" }}>
                    {session.child?.user?.full_name?.[0] || "?"}
                  </div>
                  <div className="activity-text">
                    <p>{session.child?.user?.full_name || "Unknown"}</p>
                    <p>{session.game?.name || "Unknown Game"} — Score: {session.score || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No recent game sessions</p></div>
          )}
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Voice Attempts</h3>
          {recentVoiceAttempts.length > 0 ? (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Child</th>
                    <th>Instruction</th>
                    <th className="th-hide-md">Accuracy</th>
                    <th className="th-hide-md">Pronunciation</th>
                    <th>Coins</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVoiceAttempts.slice(0, 8).map((attempt) => (
                    <tr key={attempt.id}>
                      <td><span className="font-medium">{attempt.child?.user?.full_name || "Unknown"}</span></td>
                      <td className="text-muted">{attempt.voice_instruction?.title || "—"}</td>
                      <td className="td-hide-md"><span className="badge badge-primary">{attempt.accuracy_score || 0}%</span></td>
                      <td className="td-hide-md"><span className="badge badge-info">{attempt.pronunciation_score || 0}%</span></td>
                      <td><span className="badge badge-accent">{attempt.coins_earned || 0}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><p>No recent voice attempts</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;