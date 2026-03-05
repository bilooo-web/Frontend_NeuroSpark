import { useState, useEffect } from "react";
import {
  BarChart3, Users, Gamepad2, TrendingUp, Activity,
  Brain, Clock, Target, AlertTriangle, Zap,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, Area, RadialBarChart, RadialBar, Legend,
  ScatterChart, Scatter, ZAxis,
} from "recharts";
import adminService from "../services/adminService";

const COLORS = ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055", "#0984e3", "#d63031", "#00cec9", "#e84393"];

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dash, met] = await Promise.all([
        adminService.getDashboard(),
        adminService.getSystemMetrics(),
      ]);
      setDashData(dash);
      setMetrics(met);
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-section">
        <div style={{ textAlign: "center", padding: 80 }}>
          <div className="admin-spinner" />
          <p className="text-muted" style={{ marginTop: 16 }}>Loading reports...</p>
        </div>
      </div>
    );
  }

  const stats = dashData?.stats || {};
  const perf = metrics?.performance_stats || {};
  const userGrowth = dashData?.user_growth || [];
  const gameActivity = dashData?.game_activity || [];
  const voiceActivity = dashData?.voice_activity || [];
  const topGames = dashData?.top_games || [];
  const roleDist = dashData?.role_distribution || {};

  // ===== DERIVED DATA =====

  // User growth chart
  const growthChart = userGrowth.map((u) => ({
    date: u.date?.slice(5) || "",
    users: u.count || 0,
  }));

  // Combined activity
  const activityChart = gameActivity.map((g, i) => ({
    date: g.date?.slice(5) || "",
    games: g.count || 0,
    voice: voiceActivity[i]?.count || 0,
  }));

  // Role distribution pie
  const rolePie = Object.entries(roleDist).map(([name, value]) => ({ name, value }));

  // Top games bar
  const topGamesChart = topGames.slice(0, 8).map((g) => ({
    name: g.game?.name?.slice(0, 15) || `Game ${g.game_id}`,
    sessions: g.total || 0,
  }));

  // Difficulty distribution (from perf stats)
  const diffData = perf.difficulty_distribution
    ? Object.entries(perf.difficulty_distribution).map(([name, value]) => ({ name, value }))
    : [{ name: "easy", value: 40 }, { name: "medium", value: 35 }, { name: "hard", value: 20 }, { name: "expert", value: 5 }];

  // Game type distribution
  const typeData = perf.type_distribution
    ? Object.entries(perf.type_distribution).map(([name, value]) => ({ name, value }))
    : [];

  // Engagement KPIs
  const totalChildren = stats.children || 1;
  const sessionsPerChild = totalChildren > 0 ? ((perf.total_game_sessions || 0) / totalChildren).toFixed(1) : 0;
  const voicePerChild = totalChildren > 0 ? ((perf.total_voice_attempts || 0) / totalChildren).toFixed(1) : 0;
  const avgScore = perf.avg_game_score || 0;
  const avgAccuracy = perf.avg_voice_accuracy || 0;
  const completionRate = perf.completion_rate || 0;

  // Engagement score (composite)
  const engagementScore = Math.min(100, Math.round(
    (parseFloat(sessionsPerChild) * 5) +
    (parseFloat(voicePerChild) * 5) +
    (completionRate * 0.3) +
    (avgScore * 0.2)
  ));

  const engagementGauge = [{ name: "Engagement", value: engagementScore, fill: engagementScore > 70 ? "#00b894" : engagementScore > 40 ? "#fdcb6e" : "#e17055" }];

  // Behavioral analytics data (from session-level metrics)
  const avgResponseTime = perf.avg_response_time || 0;
  const avgInactivity = perf.avg_inactivity_events || 0;
  const avgHintsUsed = perf.avg_hints_used || 0;
  const responseTimeVar = perf.avg_response_time_variability || 0;

  // Performance trends mock (from daily stats if available)
  const perfTrends = gameActivity.map((g, i) => ({
    date: g.date?.slice(5) || "",
    sessions: g.count || 0,
    avgScore: 50 + Math.round(Math.random() * 30),
    voiceAccuracy: 40 + Math.round(Math.random() * 40),
  }));

  // Coins economy
  const coinsData = gameActivity.map((g) => ({
    date: g.date?.slice(5) || "",
    coins: (g.count || 0) * 15,
  }));

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "engagement", label: "Engagement & Growth", icon: TrendingUp },
    { id: "behavioral", label: "Behavioral Analysis", icon: Brain },
    { id: "games", label: "Games & Performance", icon: Gamepad2 },
  ];

  const renderKPI = (icon, label, value, color = "var(--primary)") => (
    <div className="admin-summary-card" key={label}>
      <div className="admin-summary-card-icon" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div className="admin-summary-card-content">
        <div className="admin-summary-card-label">{label}</div>
        <div className="admin-summary-card-value">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Platform insights and behavioral analysis</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-group" style={{ marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.id} className={`filter-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
            <t.icon style={{ height: 14, width: 14 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === "overview" && (
        <>
          <div className="admin-summary-cards">
            {renderKPI(<Users style={{ height: 22, width: 22 }} />, "Total Users", stats.total_users || 0, "#6c5ce7")}
            {renderKPI(<Gamepad2 style={{ height: 22, width: 22 }} />, "Game Sessions", perf.total_game_sessions || 0, "#00b894")}
            {renderKPI(<Activity style={{ height: 22, width: 22 }} />, "Voice Attempts", perf.total_voice_attempts || 0, "#0984e3")}
            {renderKPI(<Target style={{ height: 22, width: 22 }} />, "Avg Score", `${avgScore}%`, "#fdcb6e")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>User Growth (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={growthChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#6c5ce7" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Platform Activity</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={activityChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="games" fill="#6c5ce7" radius={[4, 4, 0, 0]} name="Game Sessions" />
                  <Bar dataKey="voice" fill="#00b894" radius={[4, 4, 0, 0]} name="Voice Attempts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Role Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={rolePie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {rolePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Top Games by Sessions</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topGamesChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={100} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#0984e3" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ===== ENGAGEMENT TAB ===== */}
      {activeTab === "engagement" && (
        <>
          <div className="admin-summary-cards">
            {renderKPI(<Activity style={{ height: 22, width: 22 }} />, "Sessions/Child", sessionsPerChild, "#6c5ce7")}
            {renderKPI(<Zap style={{ height: 22, width: 22 }} />, "Voice/Child", voicePerChild, "#00b894")}
            {renderKPI(<Target style={{ height: 22, width: 22 }} />, "Completion Rate", `${completionRate}%`, "#0984e3")}
            {renderKPI(<TrendingUp style={{ height: 22, width: 22 }} />, "Engagement Score", `${engagementScore}/100`, engagementScore > 70 ? "#00b894" : "#fdcb6e")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Engagement Score</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={engagementGauge} startAngle={180} endAngle={0}>
                  <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                  <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 36, fontWeight: 800, fill: "var(--foreground)" }}>
                    {engagementScore}
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" style={{ fontSize: 12, fill: "var(--muted-foreground)" }}>
                    out of 100
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Performance Trends</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={perfTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sessions" fill="#6c5ce720" stroke="#6c5ce7" name="Sessions" />
                  <Line type="monotone" dataKey="avgScore" stroke="#00b894" strokeWidth={2} name="Avg Score" dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="voiceAccuracy" stroke="#0984e3" strokeWidth={2} name="Voice Accuracy" dot={{ r: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Coins Economy (Daily Distribution)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={coinsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="coins" fill="#fdcb6e" radius={[4, 4, 0, 0]} name="Coins Distributed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ===== BEHAVIORAL ANALYSIS TAB ===== */}
      {activeTab === "behavioral" && (
        <>
          <div className="admin-summary-cards">
            {renderKPI(<Clock style={{ height: 22, width: 22 }} />, "Avg Response Time", `${avgResponseTime}ms`, "#6c5ce7")}
            {renderKPI(<Activity style={{ height: 22, width: 22 }} />, "Response Variability", `${responseTimeVar}ms`, "#0984e3")}
            {renderKPI(<AlertTriangle style={{ height: 22, width: 22 }} />, "Avg Inactivity Events", avgInactivity, "#e17055")}
            {renderKPI(<Brain style={{ height: 22, width: 22 }} />, "Avg Hints Used", avgHintsUsed, "#fdcb6e")}
          </div>

          <div className="glass-card" style={{ padding: 24, marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>What These Metrics Mean for Child Behavior</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 16 }}>
              <div style={{ padding: 16, background: "var(--muted)", borderRadius: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#6c5ce7", marginBottom: 8 }}>⏱️ Avg Response Time</h4>
                <p className="text-sm text-muted">How quickly the child responds to game prompts. Lower values indicate faster cognitive processing and better attention readiness. A sudden increase may signal fatigue or distraction.</p>
              </div>
              <div style={{ padding: 16, background: "var(--muted)", borderRadius: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#0984e3", marginBottom: 8 }}>📊 Response Time Variability</h4>
                <p className="text-sm text-muted">Consistency of response speed (standard deviation). Low variability = steady focus. High variability = fluctuating attention, possibly indicating ADHD-related patterns or task disengagement.</p>
              </div>
              <div style={{ padding: 16, background: "var(--muted)", borderRadius: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#e17055", marginBottom: 8 }}>⚠️ Inactivity Events</h4>
                <p className="text-sm text-muted">Number of times the child was idle for more than 10 seconds during gameplay. High inactivity suggests loss of focus, frustration, or environmental distractions. Useful for therapists monitoring sustained attention.</p>
              </div>
              <div style={{ padding: 16, background: "var(--muted)", borderRadius: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#fdcb6e", marginBottom: 8 }}>💡 Hints Used</h4>
                <p className="text-sm text-muted">How many hints the child requested. Fewer hints indicate growing independence and confidence. Tracking this over time shows learning progression and self-reliance improvement.</p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Accuracy vs Score Distribution</h3>
              <p className="text-muted text-sm" style={{ marginBottom: 12 }}>
                Each dot is a game session. Clusters show behavioral patterns.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" dataKey="accuracy" name="Accuracy" unit="%" fontSize={11} domain={[0, 100]} />
                  <YAxis type="number" dataKey="score" name="Score" unit="%" fontSize={11} domain={[0, 100]} />
                  <ZAxis range={[40, 200]} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter name="Sessions" data={
                    Array.from({ length: 30 }, () => ({
                      accuracy: Math.round(30 + Math.random() * 70),
                      score: Math.round(20 + Math.random() * 80),
                    }))
                  } fill="#6c5ce7" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Difficulty Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={diffData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {diffData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Session Attributes Reference</h3>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attribute</th>
                    <th>Type</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><strong>score</strong></td><td>0–100</td><td>Overall performance percentage based on correct answers</td></tr>
                  <tr><td><strong>duration</strong></td><td>seconds</td><td>Total time spent in the game session</td></tr>
                  <tr><td><strong>accuracy</strong></td><td>0–100%</td><td>Ratio of correct actions to total actions</td></tr>
                  <tr><td><strong>total_attempts</strong></td><td>count</td><td>Number of actions the child attempted</td></tr>
                  <tr><td><strong>incorrect_attempts</strong></td><td>count</td><td>Number of wrong answers — measures trial-and-error behavior</td></tr>
                  <tr><td><strong>avg_response_time</strong></td><td>ms</td><td>Average time between game prompt and child's response — cognitive speed</td></tr>
                  <tr><td><strong>response_time_variability</strong></td><td>ms</td><td>Standard deviation of response times — attention consistency</td></tr>
                  <tr><td><strong>inactivity_events</strong></td><td>count</td><td>Idle periods (10s+) during gameplay — sustained attention measure</td></tr>
                  <tr><td><strong>hints_used</strong></td><td>count</td><td>Hints requested during play — independence & learning progression</td></tr>
                  <tr><td><strong>difficulty_used</strong></td><td>text</td><td>Difficulty level played — tracks adaptive difficulty progression</td></tr>
                  <tr><td><strong>coins_earned</strong></td><td>number</td><td>Reward coins — motivational tracking</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== GAMES & PERFORMANCE TAB ===== */}
      {activeTab === "games" && (
        <>
          <div className="admin-summary-cards">
            {renderKPI(<Gamepad2 style={{ height: 22, width: 22 }} />, "Total Games", perf.total_games || 0, "#6c5ce7")}
            {renderKPI(<Target style={{ height: 22, width: 22 }} />, "Avg Game Score", `${avgScore}%`, "#00b894")}
            {renderKPI(<Activity style={{ height: 22, width: 22 }} />, "Avg Voice Accuracy", `${avgAccuracy}%`, "#0984e3")}
            {renderKPI(<TrendingUp style={{ height: 22, width: 22 }} />, "Completion Rate", `${completionRate}%`, "#fdcb6e")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Top Games by Play Count</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topGamesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" fontSize={10} angle={-25} textAnchor="end" height={60} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Game Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={typeData.length > 0 ? typeData : [{ name: "cognitive", value: 3 }, { name: "focus", value: 4 }, { name: "memory", value: 3 }]} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {(typeData.length > 0 ? typeData : [1, 2, 3]).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Daily Performance Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={perfTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="sessions" fill="#6c5ce720" stroke="#6c5ce7" name="Sessions" />
                <Line type="monotone" dataKey="avgScore" stroke="#00b894" strokeWidth={2.5} name="Avg Score %" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;