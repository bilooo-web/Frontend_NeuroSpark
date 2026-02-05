import { useParams } from "react-router-dom";
import { challengesData } from "../data/challengesData";
import { useNavigate } from "react-router-dom";

import Header from "../components/common/Header/Header";
import Footer from "../components/common/Footer/Footer";

import "./ChallengeDetails.css";

const ChallengeDetails = () => {
  const { id } = useParams();
  const challenge = challengesData[id];
  const navigate = useNavigate();



  if (!challenge) {
    return (
      <>
        <Header />
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

              

              {/* Scores */}
              <div className="scores-section">
                <div className="score-box">
                  <span className="score">{challenge.lastScore}</span>
                  <span className="label">Last score</span>
                </div>
                <div className="score-box">
                  <span className="score">{challenge.bestScore}</span>
                  <span className="label">Best score</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="section instructions-section">
                <h3 className="section-title">Instructions</h3>
                <p className="section-content">{challenge.instructions}</p>
              </div>

              {/* Benefits */}
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

              {/* Start Button */}
              <button className="start-btn" onClick={() => navigate(`/challenges/${id}/play`)}>Start Challenge</button>
            </div>
          </div>

          {/* Right side  Character Image */}
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

      <Footer />
    </>
  );
};

export default ChallengeDetails;