import "./ChallengesHero.css";
import bluePaper from "../../../assets/blue-paper.png";
import direction from "../../../assets/direction.png";
import shine from "../../../assets/shine.png";
import characterOrange from "../../../assets/character-orange.png";
import characterBlue from "../../../assets/character-blue.png";
import characterYellow from "../../../assets/character-yellow.png";
import characterPink from "../../../assets/character-pink.png";

const ChallengesHero = () => {
  return (
    <section className="challenges-hero">
      <img src={bluePaper} alt="" className="hero-paper" />
      
      <img src={direction} alt="" className="hero-direction" />
      
      <div className="hero-content">
        <img src={shine} alt="" className="hero-shine" />
        <h1>
          Let's Learn, Play, and <br />
          <span>Focus Together</span>
        </h1>
        <p>
          This is your space to read, explore fun activities,
          and learn step by step at your own pace.
        </p>
      </div>
      
      <div className="characters-container">
        <img 
          src={characterOrange} 
          alt="Orange character" 
          className="character character-orange" 
        />
        <img 
          src={characterBlue} 
          alt="Blue character" 
          className="character character-blue" 
        />
        <img 
          src={characterYellow} 
          alt="Yellow character" 
          className="character character-yellow" 
        />
        <img 
          src={characterPink} 
          alt="Pink character" 
          className="character character-pink" 
        />
        
      </div>
      
      <div className="challenges-wave">
        <svg 
          className="challenges-wave-svg challenges-wave-primary" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z"
            fill="#6EDDD1"
          >
            <animate
              attributeName="d"
              dur="12s"
              repeatCount="indefinite"
              values="
                M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z;
                M0,40 C150,70 350,10 600,40 S850,70 1200,40 L1200,120 L0,120 Z;
                M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>

        <svg 
          className="challenges-wave-svg challenges-wave-secondary" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z"
            fill="#8BE3D8"
          >
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="
                M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z;
                M0,60 C200,90 400,30 600,60 S800,90 1200,60 L1200,120 L0,120 Z;
                M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>

        <svg 
          className="challenges-wave-svg challenges-wave-tertiary" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 C100,20 300,80 500,50 S700,20 900,50 S1100,80 1200,50 L1200,120 L0,120 Z"
            fill="#A8E9DF"
          >
            <animate
              attributeName="d"
              dur="14s"
              repeatCount="indefinite"
              values="
                M0,50 C100,20 300,80 500,50 S700,20 900,50 S1100,80 1200,50 L1200,120 L0,120 Z;
                M0,50 C100,80 300,20 500,50 S700,80 900,50 S1100,20 1200,50 L1200,120 L0,120 Z;
                M0,50 C100,20 300,80 500,50 S700,20 900,50 S1100,80 1200,50 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>
      </div>
    </section>
  );
};

export default ChallengesHero;