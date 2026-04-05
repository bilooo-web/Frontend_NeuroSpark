import { useState, useEffect } from "react";
import {
  BarChart3, Users, Gamepad2, TrendingUp, Activity,
  Clock, Target, Zap, BookOpen, Mic, Award, Volume2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  ComposedChart, RadialBarChart, RadialBar, Legend,
  Line, LineChart, AreaChart, Area,
} from "recharts";
import adminService from "../services/adminService";

const COLORS = ["#6c5ce7", "#00b894", "#fdcb6e", "#e17055", "#0984e3", "#d63031", "#00cec9", "#e84393"];

/* ── Integer-only Y-axis tick formatter ── */
const intTick = (v) => (Number.isInteger(v) ? v : "");
const pctTick = (v) => (Number.isInteger(v) ? `${v}%` : "");

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState("engagement");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getReportsData();
      setReportData(data);
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

  /* ═══ Extract all data from backend ═══ */
  const perf = reportData?.performance_stats || {};
  const userGrowth = reportData?.user_growth || [];
  const gameActivity = reportData?.game_activity || [];
  const voiceActivity = reportData?.voice_activity || [];
  const topGames = reportData?.top_games || [];
  const roleDist = reportData?.role_distribution || {};
  const coinsDaily = reportData?.coins_daily || [];
  const weeklyEngagement = reportData?.weekly_engagement || [];
  const perGamePerf = reportData?.per_game_performance || [];
  const activeChildren7d = reportData?.active_children_7d || 0;
  const avgSessionsPerChild = reportData?.avg_sessions_per_child || 0;
  const sessionStatus = reportData?.session_status_breakdown || {};
  const scoreDistribution = reportData?.game_score_distribution || [];
  const perGameMetrics = reportData?.per_game_avg_metrics || [];
  const dailyStatus = reportData?.daily_session_status || [];
  const voiceStats = reportData?.voice_stats || {};
  const voiceDaily = reportData?.voice_daily || [];
  const perInstruction = reportData?.per_instruction_performance || [];
  const weeklyVoice = reportData?.weekly_voice_trend || [];

  /* ═══ Engagement Tab computations ═══ */
  const totalChildren = perf.total_children || 1;

  /*
   * Sessions/Child = completed_sessions / total_children
   * Already computed server-side as avg_sessions_per_child
   */

  /*
   * Completion Rate = (completed_sessions / total_sessions) × 100
   * Already computed server-side as completion_rate
   */
  const completionRate = perf.completion_rate || 0;

  /*
   * Engagement Score (composite 0-100):
   *   - 30% from avg_sessions_per_child (capped at 10 → 30pts)
   *   - 20% from completion_rate (out of 100 → 20pts)
   *   - 25% from avg_game_score (out of 100 → 25pts)
   *   - 15% from active_children_7d / total_children ratio (→ 15pts)
   *   - 10% from voice engagement ratio (→ 10pts)
   */
  const sessionsScore = Math.min(30, (parseFloat(avgSessionsPerChild) / 10) * 30);
  const completionScore = (completionRate / 100) * 20;
  const gameScoreContrib = ((perf.avg_game_score || 0) / 100) * 25;
  const activeRatio = totalChildren > 0 ? (activeChildren7d / totalChildren) * 15 : 0;
  const voiceRatio = totalChildren > 0 ? Math.min(10, ((perf.total_voice_attempts || 0) / totalChildren / 5) * 10) : 0;
  const engagementScore = Math.min(100, Math.round(sessionsScore + completionScore + gameScoreContrib + activeRatio + voiceRatio));

  const engagementGauge = [{ name: "Engagement", value: engagementScore, fill: engagementScore > 70 ? "#00b894" : engagementScore > 40 ? "#fdcb6e" : "#e17055" }];

  /* ═══ Chart data transforms ═══ */
  const growthChart = userGrowth.map(u => ({ date: u.date?.slice(5) || "", users: u.count || 0 }));

  const perfTrends = gameActivity.map(g => {
    const mv = voiceActivity.find(v => v.date === g.date);
    return {
      date: g.date?.slice(5) || "",
      sessions: parseInt(g.count || 0),
      avgScore: Math.round(parseFloat(g.avg_score || 0)),
      voiceAccuracy: Math.round(parseFloat(mv?.avg_accuracy || 0)),
    };
  });

  const coinsChart = coinsDaily.map(c => ({ date: c.date?.slice(5) || "", coins: parseInt(c.coins || 0) }));

  const rolePie = Object.entries(roleDist).map(([name, value]) => ({ name, value }));

  const topGamesChart = topGames.slice(0, 8).map(g => ({
    name: g.game?.name?.slice(0, 15) || `Game ${g.game_id}`,
    sessions: g.total || 0,
  }));

  const typeData = perf.type_distribution
    ? Object.entries(perf.type_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const statusPie = Object.entries(sessionStatus).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  const scoreDistChart = scoreDistribution.filter(d => d.count > 0);

  const gameCompare = perGameMetrics.map(g => ({
    name: g.game?.name?.slice(0, 12) || `#${g.game_id}`,
    score: Math.round(parseFloat(g.avg_score || 0)),
    accuracy: Math.round(parseFloat(g.avg_accuracy || 0)),
    duration: Math.round(parseFloat(g.avg_duration || 0)),
    sessions: g.sessions || 0,
  }));

  const dailyStatusChart = dailyStatus.map(d => ({
    date: d.date?.slice(5) || "",
    completed: d.completed || 0,
    abandoned: d.abandoned || 0,
  }));

  const voiceDailyChart = voiceDaily.map(v => ({
    date: v.date?.slice(5) || "",
    attempts: parseInt(v.attempts || 0),
    accuracy: Math.round(parseFloat(v.avg_accuracy || 0)),
    pronunciation: Math.round(parseFloat(v.avg_pronunciation || 0)),
    coins: parseInt(v.coins || 0),
  }));

  /* ═══ Tabs ═══ */
  const tabs = [
    { id: "engagement", label: "Engagement & Growth", icon: TrendingUp },
    { id: "games", label: "Games & Performance", icon: Gamepad2 },
    { id: "reading", label: "Reading & Voice", icon: BookOpen },
  ];

  const renderKPI = (icon, label, value, color = "var(--primary)", tooltip) => (
    <div className="admin-summary-card" key={label} title={tooltip || ""}>
      <div className="admin-summary-card-icon" style={{ background: `${color}20`, color }}>{icon}</div>
      <div className="admin-summary-card-content">
        <div className="admin-summary-card-label">{label}</div>
        <div className="admin-summary-card-value">{value}</div>
      </div>
    </div>
  );

  /* Common YAxis props — integer-only ticks, no decimals */
  const yInt = { fontSize: 11, tickFormatter: intTick, allowDecimals: false };
  const yPct = { fontSize: 11, tickFormatter: pctTick, allowDecimals: false };

  /* ═══ Custom tooltip for ComposedChart clarity ═══ */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <p style={{ fontWeight: 700, fontSize: 12, color: "#334155", marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 12, color: p.color, margin: "2px 0" }}>
            {p.name}: <strong>{typeof p.value === "number" ? Math.round(p.value) : p.value}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Platform insights and performance analysis</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-group" style={{ marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} className={`filter-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
            <t.icon style={{ height: 14, width: 14 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          ENGAGEMENT & GROWTH TAB
          ════════════════════════════════════════════ */}
      {activeTab === "engagement" && (
        <>
          {/* KPI Cards with explanations */}
          <div className="admin-summary-cards responsive-summary">
            {renderKPI(<Activity style={{ height: 22, width: 22 }} />, "Sessions / Child", avgSessionsPerChild, "#6c5ce7",
              "Completed game sessions ÷ total children")}
            {renderKPI(<Target style={{ height: 22, width: 22 }} />, "Completion Rate", `${completionRate}%`, "#0984e3",
              "Completed sessions ÷ total sessions × 100")}
            {renderKPI(<TrendingUp style={{ height: 22, width: 22 }} />, "Engagement Score", `${engagementScore}/100`, engagementScore > 70 ? "#00b894" : "#fdcb6e",
              "Composite: 30% sessions/child + 20% completion + 25% avg score + 15% active ratio + 10% voice engagement")}
            {renderKPI(<Users style={{ height: 22, width: 22 }} />, "Active Children (7d)", activeChildren7d, "#e84393",
              "Distinct children who played at least 1 game in last 7 days")}
          </div>

          <div className="reports-grid-2">
            {/* Engagement Score Gauge */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>Engagement Score</h3>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 12 }}>
                Composite: sessions/child (30%) + completion rate (20%) + avg score (25%) + active ratio (15%) + voice (10%)
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={engagementGauge} startAngle={180} endAngle={0}>
                  <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                  <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 36, fontWeight: 800, fill: "var(--foreground)" }}>{engagementScore}</text>
                  <text x="50%" y="58%" textAnchor="middle" style={{ fontSize: 12, fill: "var(--muted-foreground)" }}>out of 100</text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Engagement Trend — FIXED: solid bar fills, no transparency */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>Weekly Engagement Trend</h3>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 12 }}>
                Game sessions + voice attempts per week with active children trend line
              </p>
              {weeklyEngagement.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={weeklyEngagement}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="week" fontSize={11} />
                    <YAxis {...yInt} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="game_sessions" fill="#6c5ce7" name="Game Sessions" radius={[4,4,0,0]} />
                    <Bar dataKey="voice_attempts" fill="#00b894" name="Voice Attempts" radius={[4,4,0,0]} />
                    <Line type="monotone" dataKey="active_children" stroke="#e84393" strokeWidth={2.5} name="Active Children" dot={{ r: 3, fill: "#e84393" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No weekly data yet</p></div>}
            </div>
          </div>

          <div className="reports-grid-2" style={{ marginTop: 20 }}>
            {/* Performance Trends — Bars for sessions, Lines for scores (appropriate for mixed scales) */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>Performance Trends (Daily)</h3>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 12 }}>
                Bars = session count (left axis) · Lines = avg score &amp; voice accuracy % (0-100 scale)
              </p>
              {perfTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={perfTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis yAxisId="left" {...yInt} />
                    <YAxis yAxisId="right" orientation="right" {...yPct} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="sessions" fill="#6c5ce7" name="Sessions" radius={[4,4,0,0]} />
                    <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#00b894" strokeWidth={2} name="Avg Score %" dot={{ r: 2, fill: "#00b894" }} />
                    <Line yAxisId="right" type="monotone" dataKey="voiceAccuracy" stroke="#0984e3" strokeWidth={2} name="Voice Accuracy %" dot={{ r: 2, fill: "#0984e3" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No performance data yet</p></div>}
            </div>

            {/* Role Distribution */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>User Role Distribution</h3>
              {rolePie.length > 0 && rolePie.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={rolePie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {rolePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: 60 }}><p>No user data</p></div>}
            </div>
          </div>

          <div className="reports-grid-2" style={{ marginTop: 20 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>User Growth (Daily)</h3>
              {growthChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={growthChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis {...yInt} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="users" fill="#6c5ce7" radius={[4,4,0,0]} name="New Users" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No growth data</p></div>}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Coins Economy (Daily)</h3>
              {coinsChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={coinsChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis {...yInt} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="coins" fill="#fdcb6e" radius={[4,4,0,0]} name="Coins Distributed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No coins data</p></div>}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════
          GAMES & PERFORMANCE TAB
          ════════════════════════════════════════════ */}
      {activeTab === "games" && (
        <>
          <div className="admin-summary-cards responsive-summary">
            {renderKPI(<Gamepad2 style={{ height: 22, width: 22 }} />, "Total Games", perf.total_games || 0, "#6c5ce7")}
            {renderKPI(<Target style={{ height: 22, width: 22 }} />, "Avg Score", `${Math.round(perf.avg_game_score || 0)}%`, "#00b894")}
            {renderKPI(<Activity style={{ height: 22, width: 22 }} />, "Avg Accuracy", `${Math.round(perf.avg_game_accuracy || 0)}%`, "#0984e3")}
            {renderKPI(<TrendingUp style={{ height: 22, width: 22 }} />, "Completion Rate", `${completionRate}%`, "#fdcb6e")}
            {renderKPI(<Clock style={{ height: 22, width: 22 }} />, "Avg Duration", `${Math.round(perf.avg_duration || 0)}s`, "#e84393")}
          </div>

          <div className="reports-grid-2" style={{ marginTop: 20 }}>
            {/* Top Games by Play Count */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Top Games by Play Count</h3>
              {topGamesChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topGamesChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={55} />
                    <YAxis {...yInt} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sessions" fill="#6c5ce7" radius={[4,4,0,0]} name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: 60 }}><p>No game data yet</p></div>}
            </div>

            {/* Score Distribution Pie */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Score Distribution</h3>
              {scoreDistChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={scoreDistChart} cx="50%" cy="50%" outerRadius={95} dataKey="count" nameKey="bracket"
                      label={({ bracket, percent }) => `${bracket?.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}>
                      {scoreDistChart.map((_, i) => <Cell key={i} fill={["#00b894", "#0984e3", "#fdcb6e", "#e17055"][i] || COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: 60 }}><p>No score data yet</p></div>}
            </div>
          </div>

          <div className="reports-grid-2" style={{ marginTop: 20 }}>
            {/* Per-Game Score vs Accuracy Comparison */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Per-Game Score vs Accuracy</h3>
              {gameCompare.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={gameCompare}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={50} />
                    <YAxis {...yPct} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="score" fill="#6c5ce7" name="Avg Score %" radius={[4,4,0,0]} />
                    <Bar dataKey="accuracy" fill="#00b894" name="Avg Accuracy %" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No per-game data yet</p></div>}
            </div>

            {/* Session Status Pie */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Session Status Breakdown</h3>
              {statusPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" outerRadius={95} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusPie.map((_, i) => <Cell key={i} fill={["#00b894", "#fdcb6e", "#e17055"][i] || COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: 60 }}><p>No session data</p></div>}
            </div>
          </div>

          <div className="reports-grid-2" style={{ marginTop: 20 }}>
            {/* Game Type Distribution */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Game Type Distribution</h3>
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: 60 }}><p>No type data</p></div>}
            </div>

            {/* Daily Completed vs Abandoned */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Daily Completed vs Abandoned</h3>
              {dailyStatusChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dailyStatusChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis {...yInt} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="completed" stackId="a" fill="#00b894" name="Completed" radius={[4,4,0,0]} />
                    <Bar dataKey="abandoned" stackId="a" fill="#e17055" name="Abandoned" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No daily data</p></div>}
            </div>
          </div>

          {/* Per-Game Performance Table */}
          {perGamePerf.length > 0 && (
            <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Per-Game Performance Breakdown</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Game</th><th>Type</th><th>Sessions</th><th>Avg Score</th><th>Avg Accuracy</th><th>Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perGamePerf.map(pg => (
                      <tr key={pg.game_id}>
                        <td><strong>{pg.game?.name || `Game #${pg.game_id}`}</strong></td>
                        <td><span className="badge badge-primary">{pg.game?.type || "—"}</span></td>
                        <td>{pg.sessions}</td>
                        <td><span className="badge badge-success">{Math.round(parseFloat(pg.avg_score || 0))}%</span></td>
                        <td><span className="badge badge-info">{Math.round(parseFloat(pg.avg_accuracy || 0))}%</span></td>
                        <td>{Math.round(parseFloat(pg.avg_duration || 0))}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Per-Game Avg Duration Bar */}
          {gameCompare.length > 0 && (
            <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Avg Duration per Game (seconds)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={gameCompare}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis {...yInt} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="duration" fill="#e84393" radius={[4,4,0,0]} name="Avg Duration (s)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════
          READING & VOICE TAB
          ════════════════════════════════════════════ */}
      {activeTab === "reading" && (
        <>
          <div className="admin-summary-cards responsive-summary">
            {renderKPI(<BookOpen style={{ height: 22, width: 22 }} />, "Instructions", `${voiceStats.active_instructions || 0} active`, "#6c5ce7")}
            {renderKPI(<Mic style={{ height: 22, width: 22 }} />, "Total Attempts", voiceStats.total_attempts || 0, "#00b894")}
            {renderKPI(<Target style={{ height: 22, width: 22 }} />, "Avg Accuracy", `${Math.round(voiceStats.avg_accuracy || 0)}%`, "#0984e3")}
            {renderKPI(<Volume2 style={{ height: 22, width: 22 }} />, "Avg Pronunciation", `${Math.round(voiceStats.avg_pronunciation || 0)}%`, "#fdcb6e")}
            {renderKPI(<Users style={{ height: 22, width: 22 }} />, "Active Readers (7d)", voiceStats.active_readers_7d || 0, "#e84393")}
          </div>

          <div className="reports-grid-2" style={{ marginTop: 20 }}>
            {/* Daily Voice Attempts with Accuracy Line */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>Daily Voice Activity</h3>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 12 }}>
                Bars = attempt count · Lines = accuracy &amp; pronunciation %
              </p>
              {voiceDailyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={voiceDailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis yAxisId="left" {...yInt} />
                    <YAxis yAxisId="right" orientation="right" {...yPct} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="attempts" fill="#6c5ce7" name="Attempts" radius={[4,4,0,0]} />
                    <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#00b894" strokeWidth={2} name="Accuracy %" dot={{ r: 2, fill: "#00b894" }} />
                    <Line yAxisId="right" type="monotone" dataKey="pronunciation" stroke="#fdcb6e" strokeWidth={2} name="Pronunciation %" dot={{ r: 2, fill: "#fdcb6e" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No voice data yet</p></div>}
            </div>

            {/* Weekly Voice Trend */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Weekly Reading Trend</h3>
              {weeklyVoice.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={weeklyVoice}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="week" fontSize={11} />
                    <YAxis yAxisId="left" {...yInt} />
                    <YAxis yAxisId="right" orientation="right" {...yPct} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="attempts" fill="#0984e3" name="Attempts" radius={[4,4,0,0]} />
                    <Line yAxisId="right" type="monotone" dataKey="avg_accuracy" stroke="#00b894" strokeWidth={2} name="Accuracy %" dot={{ r: 3, fill: "#00b894" }} />
                    <Line yAxisId="right" type="monotone" dataKey="avg_pronunciation" stroke="#fdcb6e" strokeWidth={2} name="Pronunciation %" dot={{ r: 3, fill: "#fdcb6e" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No weekly voice data yet</p></div>}
            </div>
          </div>

          {/* Per-Instruction Performance Table */}
          {perInstruction.length > 0 && (
            <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Per-Instruction Performance</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Instruction</th><th>Attempts</th><th>Avg Accuracy</th><th>Avg Pronunciation</th><th>Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perInstruction.map(pi => (
                      <tr key={pi.voice_instruction_id}>
                        <td><strong>{pi.voice_instruction?.title || `#${pi.voice_instruction_id}`}</strong></td>
                        <td>{pi.attempts}</td>
                        <td><span className="badge badge-success">{Math.round(parseFloat(pi.avg_accuracy || 0))}%</span></td>
                        <td><span className="badge badge-info">{Math.round(parseFloat(pi.avg_pronunciation || 0))}%</span></td>
                        <td>{Math.round(parseFloat(pi.avg_duration || 0))}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Per-Instruction Bar Chart Comparison */}
          {perInstruction.length > 0 && (
            <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Instruction Accuracy vs Pronunciation</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={perInstruction.map(pi => ({
                  name: (pi.voice_instruction?.title || `#${pi.voice_instruction_id}`).slice(0, 15),
                  accuracy: Math.round(parseFloat(pi.avg_accuracy || 0)),
                  pronunciation: Math.round(parseFloat(pi.avg_pronunciation || 0)),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={50} />
                  <YAxis {...yPct} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#00b894" name="Accuracy %" radius={[4,4,0,0]} />
                  <Bar dataKey="pronunciation" fill="#fdcb6e" name="Pronunciation %" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="reports-grid-2" style={{ marginTop: 20 }}>
            {/* Voice Coins Daily */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Voice Coins Earned (Daily)</h3>
              {voiceDailyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={voiceDailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis {...yInt} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="coins" fill="#fdcb6e" radius={[4,4,0,0]} name="Coins Earned" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No coins data</p></div>}
            </div>

            {/* Summary Stats */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Reading Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 10 }}>
                {[
                  { label: "Total Words Practiced", value: voiceStats.total_words_practiced || 0, icon: "📖" },
                  { label: "Total Incorrect Words", value: voiceStats.total_incorrect_words || 0, icon: "❌" },
                  { label: "Attempts / Child", value: voiceStats.attempts_per_child || 0, icon: "📊" },
                  { label: "Total Coins (Voice)", value: voiceStats.total_coins || 0, icon: "🪙" },
                  { label: "Avg Duration", value: `${Math.round(voiceStats.avg_duration || 0)}s`, icon: "⏱️" },
                  { label: "Word Accuracy", value: voiceStats.total_words_practiced > 0 ? `${Math.round(((voiceStats.total_words_practiced - voiceStats.total_incorrect_words) / voiceStats.total_words_practiced) * 100)}%` : "—", icon: "🎯" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "var(--card-hover)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600 }}>{s.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--foreground)" }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;