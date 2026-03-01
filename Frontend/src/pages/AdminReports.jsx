import { useState, useEffect } from "react";
import {
  BarChart3,
  Activity,
  Users,
  Gamepad2,
  BookOpen,
  Coins,
  TrendingUp,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import StatCard from "../components/admin/StatCard";
import adminService from "../services/adminService";

const COLORS = ["#00a896", "#e6a014", "#3282dc", "#28a764", "#dc3232"];

const AdminReports = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSystemMetrics();
      setMetrics(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-section">
        <div style={{ textAlign: "center", padding: 60 }}>
          <div className="loading-spinner" />
          <p className="text-muted" style={{ marginTop: 12 }}>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-section">
        <div className="glass-card" style={{ textAlign: "center", padding: 40 }}>
          <p className="text-destructive">{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchMetrics}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const perf = metrics?.performance_stats || {};
  const userGrowth = metrics?.user_metrics
    ? [...metrics.user_metrics].reverse().map((m) => ({
        month: m.month,
        Guardians: parseInt(m.guardians),
        Children: parseInt(m.children),
        Admins: parseInt(m.admins),
        Total: parseInt(m.total),
      }))
    : [];

  const gameSessions = metrics?.game_metrics
    ? [...metrics.game_metrics].reverse().map((m) => ({
        day: m.day?.slice(5),
        Sessions: parseInt(m.sessions),
        AvgScore: parseFloat(m.avg_score || 0).toFixed(1),
        Coins: parseInt(m.total_coins || 0),
      }))
    : [];

  const voiceAttempts = metrics?.voice_metrics
    ? [...metrics.voice_metrics].reverse().map((m) => ({
        day: m.day?.slice(5),
        Attempts: parseInt(m.attempts),
        Accuracy: parseFloat(m.avg_accuracy || 0).toFixed(1),
        Pronunciation: parseFloat(m.avg_pronunciation || 0).toFixed(1),
      }))
    : [];

  const gameTypes = metrics?.game_type_breakdown
    ? metrics.game_type_breakdown.map((g) => ({
        name: g.type?.charAt(0).toUpperCase() + g.type?.slice(1),
        value: parseInt(g.total),
      }))
    : [];

  const guardianTypes = metrics?.guardian_types
    ? [
        { name: "Parents", value: metrics.guardian_types.parents || 0 },
        { name: "Therapists", value: metrics.guardian_types.therapists || 0 },
      ]
    : [];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "games", label: "Game Analytics" },
    { id: "voice", label: "Voice Analytics" },
    { id: "users", label: "User Analytics" },
  ];

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>In-depth platform performance data</p>
        </div>
        <button className="btn btn-outline" onClick={fetchMetrics}>
          <Activity style={{ height: 16, width: 16 }} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <StatCard
          title="Avg Game Score"
          value={perf.avg_game_score || 0}
          icon={Gamepad2}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Avg Voice Accuracy"
          value={`${perf.avg_voice_accuracy || 0}%`}
          icon={BookOpen}
          variant="accent"
          delay={100}
        />
        <StatCard
          title="Total Sessions"
          value={perf.total_game_sessions || 0}
          icon={Activity}
          variant="info"
          delay={200}
        />
        <StatCard
          title="Total Coins Earned"
          value={(perf.total_coins_earned || 0).toLocaleString()}
          icon={Coins}
          variant="success"
          delay={300}
        />
      </div>

      {/* Tab Navigation */}
      <div className="filter-group">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`filter-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          <div className="grid-charts">
            <div className="glass-card chart-card">
              <h3>User Growth (Monthly)</h3>
              {userGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowth}>
                    <defs>
                      <linearGradient id="repGrd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00a896" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#00a896" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="repChild" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3282dc" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3282dc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#888" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Legend />
                    <Area type="monotone" dataKey="Guardians" stroke="#00a896" strokeWidth={2} fill="url(#repGrd)" />
                    <Area type="monotone" dataKey="Children" stroke="#3282dc" strokeWidth={2} fill="url(#repChild)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state"><p>No data available</p></div>
              )}
            </div>

            <div className="glass-card chart-card">
              <h3>Distribution</h3>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p className="text-sm text-muted" style={{ textAlign: "center", marginBottom: 8 }}>
                    Game Types
                  </p>
                  {gameTypes.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={gameTypes} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          {gameTypes.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted text-sm" style={{ textAlign: "center" }}>No data</p>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p className="text-sm text-muted" style={{ textAlign: "center", marginBottom: 8 }}>
                    Guardian Types
                  </p>
                  {guardianTypes.some((d) => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={guardianTypes} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          <Cell fill="#00a896" />
                          <Cell fill="#e6a014" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted text-sm" style={{ textAlign: "center" }}>No data</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Voice instruction stats */}
          {metrics?.voice_instruction_stats && (
            <div className="glass-card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Voice Instruction Stats</h3>
              <div className="grid-4">
                <div className="report-kpi">
                  <div className="report-kpi-value">{metrics.voice_instruction_stats.total}</div>
                  <div className="report-kpi-label">Total Instructions</div>
                </div>
                <div className="report-kpi">
                  <div className="report-kpi-value">{metrics.voice_instruction_stats.active}</div>
                  <div className="report-kpi-label">Active</div>
                </div>
                <div className="report-kpi">
                  <div className="report-kpi-value">{metrics.voice_instruction_stats.inactive}</div>
                  <div className="report-kpi-label">Inactive</div>
                </div>
                <div className="report-kpi">
                  <div className="report-kpi-value">{(metrics.voice_instruction_stats.total_coins_awarded || 0).toLocaleString()}</div>
                  <div className="report-kpi-label">Coins Awarded</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* GAME ANALYTICS TAB */}
      {activeTab === "games" && (
        <div className="grid-charts">
          <div className="glass-card chart-card">
            <h3>Daily Game Sessions (Last 30 Days)</h3>
            {gameSessions.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={gameSessions}>
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
            <h3>Average Score Trend</h3>
            {gameSessions.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={gameSessions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Line type="monotone" dataKey="AvgScore" stroke="#e6a014" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No score data yet</p></div>
            )}
          </div>

          <div className="glass-card chart-card">
            <h3>Coins Distributed Daily</h3>
            {gameSessions.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={gameSessions}>
                  <defs>
                    <linearGradient id="coinGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e6a014" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#e6a014" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Area type="monotone" dataKey="Coins" stroke="#e6a014" strokeWidth={2} fill="url(#coinGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No coin data yet</p></div>
            )}
          </div>
        </div>
      )}

      {/* VOICE ANALYTICS TAB */}
      {activeTab === "voice" && (
        <div className="grid-charts">
          <div className="glass-card chart-card">
            <h3>Daily Voice Attempts (Last 30 Days)</h3>
            {voiceAttempts.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={voiceAttempts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Bar dataKey="Attempts" fill="#3282dc" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No voice attempt data yet</p></div>
            )}
          </div>

          <div className="glass-card chart-card">
            <h3>Accuracy & Pronunciation Trends</h3>
            {voiceAttempts.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={voiceAttempts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#888" }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Legend />
                  <Line type="monotone" dataKey="Accuracy" stroke="#00a896" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Pronunciation" stroke="#e6a014" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No voice metrics data yet</p></div>
            )}
          </div>
        </div>
      )}

      {/* USER ANALYTICS TAB */}
      {activeTab === "users" && (
        <>
          <div className="grid-4">
            <StatCard title="Total Users" value={perf.total_users || 0} icon={Users} variant="primary" />
            <StatCard title="Children" value={perf.total_children || 0} icon={Users} variant="info" />
            <StatCard title="Guardians" value={perf.total_guardians || 0} icon={Users} variant="success" />
            <StatCard title="Voice Attempts" value={perf.total_voice_attempts || 0} icon={BookOpen} variant="accent" />
          </div>

          <div className="grid-charts">
            <div className="glass-card chart-card">
              <h3>Monthly User Registration</h3>
              {userGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#888" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Legend />
                    <Bar dataKey="Guardians" fill="#00a896" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Children" fill="#3282dc" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Admins" fill="#e6a014" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state"><p>No user data yet</p></div>
              )}
            </div>

            <div className="glass-card chart-card">
              <h3>Cumulative User Growth</h3>
              {userGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#888" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
                    <Line type="monotone" dataKey="Total" stroke="#00a896" strokeWidth={2.5} dot={{ r: 4, fill: "#00a896" }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state"><p>No user data yet</p></div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;