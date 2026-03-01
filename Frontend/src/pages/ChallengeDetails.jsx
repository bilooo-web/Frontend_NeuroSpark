import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { challengesData } from "../data/challengesData";

import Header from "../components/common/Header/Header";
import Footer from "../components/common/Footer/Footer";

import "./ChallengeDetails.css";

const ChallengeDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const challenge = challengesData[id];
  const navigate = useNavigate();
  
  const [lastScore, setLastScore] = useState(challenge?.lastScore || 0);
  const [bestScore, setBestScore] = useState(challenge?.bestScore || 0);
  
  const [totalCoins, setTotalCoins] = useState(() => {
    const savedCoins = localStorage.getItem('totalCoins');
    return savedCoins ? parseInt(savedCoins) : 0;
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (challenge) {
      const savedBest = localStorage.getItem(`${challenge.id}-best`);
      if (savedBest) {
        setBestScore(parseInt(savedBest));
      }
    }
  }, [challenge]);

  useEffect(() => {
    if (location.state?.gameResults) {
      const { lastScore: newLastScore, bestScore: newBestScore } = location.state.gameResults;
      
      setLastScore(newLastScore);
      
      if (newBestScore > bestScore) {
        setBestScore(newBestScore);
        if (challenge) {
          localStorage.setItem(`${challenge.id}-best`, newBestScore.toString());
        }
      }

      if (location.state.earnedCoins > 0) {
        console.log(`Earned ${location.state.earnedCoins} coins!`);
      }
    }
  }, [location.state, challenge, bestScore]);

  if (!challenge) {
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
      <Header />
      
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

              

              <div className="section instructions-section">
                <h3 className="section-title">Instructions</h3>
                <p className="section-content">{challenge.instructions}</p>
              </div>

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

              <button className="start-btn" onClick={() => navigate(`/challenges/${id}/play`)}>
                Start Challenge
              </button>
            </div>
          </div>

          <div className="image-side">
            <div className="image-container">
              <div className="character-image-card">
                <img 
                  src={challenge.characterImage} 
                  alt="Challenge Character"
                  className="character-image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <div style={{ height: '20px' }} /> 
      <Footer />
    </>
  );
};

export default ChallengeDetails;