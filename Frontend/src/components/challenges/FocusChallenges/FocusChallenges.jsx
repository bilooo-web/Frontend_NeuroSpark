import { useState, useEffect } from "react";
import "./FocusChallenges.css";
import { Link } from "react-router-dom";
import api from "../../../services/api";

import game1 from "../../../assets/duck-game1.png";
import game7 from "../../../assets/game4_c.jpg";
import tape from "../../../assets/tape.png";

// Default images per slug
const defaultImages = {
  "path-change": game1,
  "padlocks": game1,
  "faces-and-names": game1,
  "pair-of-cards": game1,
  "painting": game1,
  "colored-words": game1,
  "puzzles": game1,
  "word-search": game7,
  "cars-on-the-road": game7,
  "handwriting-enhancement": game7,
  "one-line": game7,
  "find-the-ball": game7,
  "rearranging-blocks": game7,
};

const defaultNotes = [
  "Every time you play, your brain gets stronger. Let's start!",
  "Mistakes are part of the fun — keep going, you're learning!",
  "Play, explore, and discover how awesome you are!",
  "This game helps you think smarter — are you ready?",
  "Try your best and enjoy the adventure!",
  "Each level is a new challenge you can conquer!",
  "Believe in yourself — you can do this!",
  "Your mind is powerful — let's train it!",
  "Play, focus, and watch yourself improve!",
  "Great things happen when you don't give up!",
  "This game is your chance to shine!",
  "Have fun while becoming faster, smarter, and stronger!",
];

const FocusChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await api.get("/games");
      const games = Array.isArray(res) ? res : res.data || [];

      const mapped = games.map((game, index) => ({
        slug: game.game_slug || game.name?.toLowerCase().replace(/\s+/g, "-"),
        title: game.name,
        gameImage: defaultImages[game.game_slug] || (index % 2 === 0 ? game1 : game7),
        note: defaultNotes[index % defaultNotes.length],
        titleStyle: { marginTop: "35px" },
      }));

      setChallenges(mapped);
    } catch (err) {
      console.error("Failed to fetch games:", err);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="focus-challenges-container">
      <section className="focus-challenges">
        <div className="stars-bg" />
        <h1 className="challenges-title">Focus Challenges</h1>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="loading-spinner" style={{
              width: 36, height: 36, border: "4px solid rgba(255,255,255,0.3)",
              borderTopColor: "#00a896", borderRadius: "50%",
              animation: "spin 0.7s linear infinite", margin: "0 auto",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : challenges.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "rgba(255,255,255,0.7)", fontSize: "18px",
          }}>
            <p style={{ fontSize: "48px", marginBottom: "16px" }}>🎮</p>
            <p>No games available yet.</p>
            <p style={{ fontSize: "14px", marginTop: "8px", opacity: 0.6 }}>
              Check back soon for new challenges!
            </p>
          </div>
        ) : (
          <div className="challenges-grid">
            {challenges.map((challenge) => (
              <Link
                key={challenge.slug}
                to={`/challenges/${challenge.slug}`}
                className="challenge-wrapper"
              >
                <div className="challenge-card">
                  <div className="tape-container">
                    <img src={tape} alt="tape" className="tape-image" />
                    <div className="tape-text">
                      <span
                        className="card-title"
                        style={challenge.titleStyle || {}}
                      >
                        {challenge.title}
                      </span>
                    </div>
                  </div>
                  <div className="game-image">
                    <img src={challenge.gameImage} alt={challenge.title} />
                  </div>
                  <p className="note-text">{challenge.note}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default FocusChallenges;