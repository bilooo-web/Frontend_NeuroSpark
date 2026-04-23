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
  const [weeklyGrowth, setWeeklyGrowth] = useState([]);
  const [perfOverview, setPerfOverview] = useState(null);
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
      setWeeklyGrowth(dashRes.weekly_user_growth || []);
      setPerfOverview(dashRes.performance_overview || null);
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
      <div className="ad-page-section">
        <div className="ad-loading-page">
          <div className="ad-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ad-page-section">
        <div className="ad-glass-card" style={{ textAlign: "center", padding: 40 }}>
          <p className="ad-text-destructive" style={{ marginBottom: 12 }}>Failed to load dashboard</p>
          <p className="ad-text-muted ad-text-sm">{error}</p>
          <button className="ad-btn ad-btn-primary" style={{ marginTop: 16 }} onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const userGrowthData = weeklyGrowth.map((w) => ({
    week: w.week,
    Guardians: parseInt(w.guardians || 0),
    Children: parseInt(w.children || 0),
    Total: parseInt(w.total || 0),
  }));

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
    <div className="ad-page-section">
      <div className="ad-page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Real-time platform analytics and insights</p>
        </div>
        <button className="ad-btn ad-btn-outline" onClick={fetchData}>
          <Activity style={{ height: 16, width: 16 }} />
          Refresh
        </button>
      </div>

      <div className="ad-grid-4">
        <StatCard title="Total Users" value={stats?.total_users || 0} icon={Users} variant="primary" trend={{ value: stats?.user_growth_percent ?? 0, label: "vs last week" }} delay={0} />
        <StatCard title="Children" value={stats?.total_children || 0} icon={Baby} variant="info" trend={{ value: stats?.children_growth_percent ?? 0, label: "vs last week" }} delay={100} />
        <StatCard title="Guardians" value={stats?.total_guardians || 0} icon={ShieldCheck} variant="success" trend={{ value: stats?.guardians_growth_percent ?? 0, label: `${stats?.total_parents || 0} parents, ${stats?.total_therapists || 0} therapists` }} delay={200} />
        <StatCard title="Total Coins" value={(stats?.total_coins_distributed || 0).toLocaleString()} icon={Coins} variant="accent" trend={{ value: stats?.coins_growth_percent ?? 0, label: "vs last week" }} delay={300} />
      </div>

      <div className="ad-grid-4">
        <StatCard title="Total Games" value={stats?.total_games || 0} icon={Gamepad2} trend={{ value: stats?.games_growth_percent ?? 0, label: "vs last week" }} delay={400} />
        <StatCard title="Game Sessions" value={stats?.total_game_sessions || 0} icon={Activity} trend={{ value: stats?.sessions_growth_percent ?? 0, label: "vs last week" }} delay={500} />
        <StatCard title="Voice Instructions" value={stats?.total_voice_instructions || 0} icon={BookOpen} trend={{ value: stats?.vi_growth_percent ?? 0, label: "vs last week" }} delay={600} />
        <StatCard title="Voice Attempts" value={stats?.total_voice_attempts || 0} icon={TrendingUp} trend={{ value: stats?.voice_growth_percent ?? 0, label: "vs last week" }} delay={700} />
      </div>

      <div className="ad-grid-charts">
        <div className="ad-glass-card ad-chart-card">
          <h3>User Growth (Weekly)</h3>
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
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#888" }} />
                <YAxis tick={{ fontSize: 12, fill: "#888" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Legend />
                <Area type="monotone" dataKey="Guardians" stroke="#00a896" strokeWidth={2} fill="url(#colorGuardians)" />
                <Area type="monotone" dataKey="Children" stroke="#3282dc" strokeWidth={2} fill="url(#colorChildren)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="ad-empty-state"><p>No user growth data yet</p></div>
          )}
        </div>

        <div className="ad-glass-card ad-chart-card">
          <h3>Game Sessions (Daily)</h3>
          {gameSessionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gameSessionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} />
                <YAxis tick={{ fontSize: 12, fill: "#888" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Bar dataKey="Sessions" fill="#00a896" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="ad-empty-state"><p>No game session data yet</p></div>
          )}
        </div>

        <div className="ad-glass-card ad-chart-card">
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
                <YAxis tick={{ fontSize: 12, fill: "#888" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <Area type="monotone" dataKey="Attempts" stroke="#e6a014" strokeWidth={2} fill="url(#colorAccuracy)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="ad-empty-state"><p>No voice attempt data available yet</p></div>
          )}
        </div>

        <div className="ad-glass-card ad-chart-card">
          <h3>Distribution</h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <p className="ad-text-sm ad-text-muted" style={{ textAlign: "center", marginBottom: 8 }}>Game Types</p>
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
                  <div className="ad-pie-legend">
                    {gameTypeData.map((entry, i) => (
                      <div key={i} className="ad-pie-legend-item">
                        <div className="ad-pie-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="ad-pie-legend-label">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="ad-text-muted ad-text-sm" style={{ textAlign: "center" }}>No data</p>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <p className="ad-text-sm ad-text-muted" style={{ textAlign: "center", marginBottom: 8 }}>Guardian Types</p>
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
                  <div className="ad-pie-legend">
                    <div className="ad-pie-legend-item"><div className="ad-pie-legend-dot" style={{ background: "#00a896" }} /><span className="ad-pie-legend-label">Parents ({guardianTypeData[0]?.value || 0})</span></div>
                    <div className="ad-pie-legend-item"><div className="ad-pie-legend-dot" style={{ background: "#e6a014" }} /><span className="ad-pie-legend-label">Therapists ({guardianTypeData[1]?.value || 0})</span></div>
                  </div>
                </>
              ) : (
                <p className="ad-text-muted ad-text-sm" style={{ textAlign: "center" }}>No data</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {perfOverview && (
        <div className="ad-glass-card ad-chart-card">
          <h3>Performance Overview</h3>
          <div className="ad-grid-4" style={{ marginTop: 16 }}>
            <div className="ad-report-kpi"><div className="ad-report-kpi-value">{perfOverview.avg_game_score ?? 0}%</div><div className="ad-report-kpi-label">Avg Game Score</div></div>
            <div className="ad-report-kpi"><div className="ad-report-kpi-value">{perfOverview.avg_voice_accuracy ?? 0}%</div><div className="ad-report-kpi-label">Avg Voice Accuracy</div></div>
            <div className="ad-report-kpi"><div className="ad-report-kpi-value">{perfOverview.avg_voice_pronunciation ?? 0}%</div><div className="ad-report-kpi-label">Avg Pronunciation</div></div>
            <div className="ad-report-kpi"><div className="ad-report-kpi-value">{(perfOverview.total_coins_earned || 0).toLocaleString()}</div><div className="ad-report-kpi-label">Total Coins Earned</div></div>
          </div>
        </div>
      )}

      <div className="ad-grid-bottom">
        <div className="ad-glass-card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Game Sessions</h3>
          {recentGameSessions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recentGameSessions.slice(0, 6).map((session) => (
                <div key={session.id} className="ad-activity-item">
                  <div className="ad-activity-avatar" style={{ background: "rgba(0,168,150,0.08)", color: "var(--ad-primary)" }}>
                    {session.child?.user?.full_name?.[0] || "?"}
                  </div>
                  <div className="ad-activity-text">
                    <p>{session.child?.user?.full_name || "Unknown"}</p>
                    <p>{session.game?.name || "Unknown Game"} — Score: {session.score || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ad-empty-state"><p>No recent game sessions</p></div>
          )}
        </div>

        <div className="ad-glass-card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Voice Attempts</h3>
          {recentVoiceAttempts.length > 0 ? (
            <div className="ad-data-table-wrapper">
              <table className="ad-data-table">
                <thead>
                  <tr>
                    <th>Child</th>
                    <th>Instruction</th>
                    <th className="ad-th-hide-md">Accuracy</th>
                    <th className="ad-th-hide-md">Pronunciation</th>
                    <th>Coins</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVoiceAttempts.slice(0, 8).map((attempt) => (
                    <tr key={attempt.id}>
                      <td><span className="ad-font-medium">{attempt.child?.user?.full_name || "Unknown"}</span></td>
                      <td className="ad-text-muted">{attempt.voice_instruction?.title || "—"}</td>
                      <td className="ad-td-hide-md"><span className="ad-badge ad-badge-primary">{attempt.accuracy_score || 0}%</span></td>
                      <td className="ad-td-hide-md"><span className="ad-badge ad-badge-info">{attempt.pronunciation_score || 0}%</span></td>
                      <td><span className="ad-badge ad-badge-accent">{attempt.coins_earned || 0}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ad-empty-state"><p>No recent voice attempts</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;