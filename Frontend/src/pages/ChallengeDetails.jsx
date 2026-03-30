import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { challengesData } from "../data/challengesData";
import api from "../services/api";

import Header from "../components/common/Header/Header";
import Footer from "../components/common/Footer/Footer";

import "./ChallengeDetails.css";

const ChallengeDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Static data for character images / benefits (fallback)
  const staticChallenge = challengesData[id];

  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastScore, setLastScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const [totalCoins, setTotalCoins] = useState(() => {
    const saved = localStorage.getItem("totalCoins");
    return saved ? parseInt(saved) : 0;
  });

  // Fetch game from API by slug
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchGameBySlug();
    loadScores();
  }, [id]);

  const fetchGameBySlug = async () => {
    try {
      const res = await api.get("/games");
      const games = Array.isArray(res) ? res : res.data || [];
      const found = games.find(
        (g) => g.game_slug === id || g.name?.toLowerCase().replace(/\s+/g, "-") === id
      );
      if (found) { 
        setGameData(found);
      }
    } catch (err) {
      console.error("Failed to fetch game:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadScores = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    // For child users, fetch from backend
    if (token && user.role === "child") {
      try {
        const res = await api.get(`/child/games/${id}/scores`);
        setBestScore(res.best_score || 0);
        setLastScore(res.last_score || 0);
        // Sync to localStorage as cache
        localStorage.setItem(`${id}-best`, String(res.best_score || 0));
        localStorage.setItem(`${id}-last`, String(res.last_score || 0));
        return;
      } catch (err) {
        console.warn("Could not fetch scores from backend, using localStorage:", err.message);
      }
    }

    // Fallback to localStorage
    const savedBest = localStorage.getItem(`${id}-best`);
    const savedLast = localStorage.getItem(`${id}-last`);
    if (savedBest) setBestScore(parseInt(savedBest));
    if (savedLast) setLastScore(parseInt(savedLast));
  };

  // Handle returning from game with results
  useEffect(() => {
    if (location.state?.gameResults) {
      // Re-fetch scores from backend to get the accurate best/last
      loadScores();

      // Read coins from localStorage (already synced by GameSwitcher from server)
      const serverCoins = parseInt(localStorage.getItem("totalCoins") || "0");
      setTotalCoins(serverCoins);
    }
  }, [location.state]);

  // Auth-gated start
  const handleStartChallenge = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: "signin" }));
      return;
    }
    navigate(`/challenges/${id}/play`);
  };

  if (loading) {
    return (
      <>
        <Header totalCoins={totalCoins} />
        <div style={{ textAlign: "center", padding: "120px 0" }}>
          <div style={{
            width: 36, height: 36, border: "4px solid rgba(0,0,0,0.1)",
            borderTopColor: "#00a896", borderRadius: "50%",
            animation: "spin 0.7s linear infinite", margin: "0 auto",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
        <Footer />
      </>
    );
  }

  // Build merged challenge object: API data takes priority for name/type
  const challenge = {
    // From API (authoritative for name, type)
    title: gameData?.name || staticChallenge?.title || id,
    category: gameData?.type
      ? gameData.type.charAt(0).toUpperCase() + gameData.type.slice(1)
      : staticChallenge?.category || "Game",
    // Instructions = gameplay instructions from challengesData.js
    instructions: staticChallenge?.instructions || "",
    // Description = admin-written description from API/DB
    description: gameData?.description || "",
    avgDuration: gameData?.avg_duration || null,
    rewardCoins: gameData?.reward_coins || null,
    difficulty: gameData?.difficulty_level || null,
    // From static data (character images, benefits)
    benefits: staticChallenge?.benefits || [],
    characterImage: staticChallenge?.characterImage || null,
  };

  if (!gameData && !staticChallenge) {
    return (
      <>
        <Header totalCoins={totalCoins} />
        <h2 style={{ textAlign: "center", margin: "100px 0" }}>
          Challenge not found
        </h2>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header totalCoins={totalCoins} />

      <section className="challenge-details">
        <div className="stars-bg"></div>
        <div className="container">
          <div className="content-side">
            <div className="challenge-card_details">
              <div className="header-section">
                <h1 className="title">{challenge.title}</h1>
                <p className="category">{challenge.category}</p>
              </div>

              <div className="scores-section">
                <div className="score-box">
                  <span className="score">{lastScore}</span>
                  <span className="label">Last score</span>
                </div>
                <div className="score-box">
                  <span className="score">{bestScore}</span>
                  <span className="label">Best score</span>
                </div>
              </div>

              {/* Game attributes from DB */}
              {/* {(challenge.avgDuration || challenge.rewardCoins || challenge.difficulty) && (
                <div className="scores-section" style={{ marginTop: 0 }}>
                  {challenge.difficulty && (
                    <div className="score-box">
                      <span className="score" style={{ fontSize: "16px", textTransform: "capitalize" }}>
                        {challenge.difficulty}
                      </span>
                      <span className="label">Difficulty</span>
                    </div>
                  )}
                  {challenge.avgDuration && (
                    <div className="score-box">
                      <span className="score" style={{ fontSize: "16px" }}>
                        {challenge.avgDuration}s
                      </span>
                      <span className="label">Avg Duration</span>
                    </div>
                  )}
                  {challenge.rewardCoins != null && (
                    <div className="score-box">
                      <span className="score" style={{ fontSize: "16px" }}>
                        🪙 {challenge.rewardCoins}
                      </span>
                      <span className="label">Reward Coins</span>
                    </div>
                  )}
                </div>
              )} */}

              {challenge.instructions && (
                <div className="section instructions-section">
                  <h3 className="section-title">Instructions</h3>
                  <p className="section-content">{challenge.instructions}</p>
                </div>
              )}

              {/* {challenge.description && (
                <div className="section instructions-section">
                  <h3 className="section-title">Description</h3>
                  <p className="section-content">{challenge.description}</p>
                </div>
              )} */}

              {challenge.benefits.length > 0 && (
                <div className="section benefits-section">
                  <h3 className="section-title">Benefits</h3>
                  <div className="benefits-grid">
                    {challenge.benefits.map((b, i) => (
                      <div key={i} className="benefit-item">
                        <span className="bullet">•</span>
                        <span className="benefit-text">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="start-btn" onClick={handleStartChallenge}>
                Start Challenge
              </button>
            </div>
          </div>

          <div className="image-side">
            <div className="image-container">
              <div className="character-image-card">
                {challenge.characterImage ? (
                  <img
                    src={challenge.characterImage}
                    alt="Challenge Character"
                    className="character-image"
                  />
                ) : (
                  <div style={{
                    fontSize: "120px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    height: "100%", minHeight: "250px",
                  }}>
                    🎮
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: "20px" }} />
      <Footer />
    </>
  );
};

export default ChallengeDetails;