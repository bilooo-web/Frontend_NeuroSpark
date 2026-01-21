import './Feedback.css';

import cloud from '../../../assets/cloud-blue.png';
import dinoBlue from '../../../assets/dino-blue.png';
import dinoPink from '../../../assets/dino-pink.png';
import dinoGreen from '../../../assets/dino-green.png';

function Feedback() {
  return (
    <section className="feedback-section">      
      {/* 🌊 TOP WAVES */}
      <div className="feedback-wave feedback-wave-top">
        <svg className="feedback-wave-svg feedback-wave-green" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z"
            fill="#8BE3D8"
          >
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="
                M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z;
                M0,40 C150,70 350,10 600,40 S850,70 1200,40 L1200,120 L0,120 Z;
                M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>

        <svg className="feedback-wave-svg feedback-wave-light" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z"
            fill="#8BE3D8"
          >
            <animate
              attributeName="d"
              dur="8s"
              repeatCount="indefinite"
              values="
                M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z;
                M0,60 C200,90 400,30 600,60 S800,90 1200,60 L1200,120 L0,120 Z;
                M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>
      </div>

      {/* ☁️ CLOUDS */}
      <img src={cloud} className="feedback-cloud feedback-cloud-tl" alt="" />
      <img src={cloud} className="feedback-cloud feedback-cloud-br" alt="" />

      {/* CONTENT */}
      <div className="feedback-content">
        <h2 className="feedback-title">We get a lot of fan mail</h2>

        <div className="feedback-grid">

          <div className="feedback-item feedback-item-blue">
            <img src={dinoBlue} alt="Blue dinosaur" />
            <h4>Fatima Al-Hassan,<br />Mother of Adam (9 years old)</h4>
            <p>
              I used to struggle to keep my son focused for even ten minutes.
              With NeuroSpark, he actually asks to do his challenges every day!
            </p>
          </div>

          <div className="feedback-item feedback-item-pink">
            <img src={dinoPink} alt="Pink dinosaur" />
            <h4>Omar Khaled,<br />Father of Lina (10 years old)</h4>
            <p>
              My daughter used to get frustrated easily.
              Now she's more confident and excited to learn.
              I can see real progress in her focus.
            </p>
          </div>

          <div className="feedback-item feedback-item-green">
            <img src={dinoGreen} alt="Green dinosaur" />
            <h4>Rania Mansour,<br />Mother of Youssef (8 years old)</h4>
            <p>
              Finally something that feels fun and educational at the same time!
              NeuroSpark turned learning into a game my child loves.
            </p>
          </div>

        </div>
      </div>

      

    </section>
  );
}

export default Feedback;