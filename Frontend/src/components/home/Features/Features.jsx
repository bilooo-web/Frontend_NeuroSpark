import './Features.css';

import paper from '../../../assets/blue-paper.png';
import cloud from '../../../assets/cloud.png';
import star_blue from '../../../assets/blue-star.png';

function Features() {
  return (
    <section className="features">
      <div className="features-container">
        <h2>Everything You Want on NeuroSpark!</h2>

        <div className="features-visual">
          <img src={paper} alt="Paper" className="paper-img" />

          <div className="cloud cloud-1">
            <img src={cloud} alt="Cloud" />
            <span>Impulse Control</span>
          </div>

          <div className="cloud cloud-2">
            <img src={cloud} alt="Cloud" />
            <span>Fun Learning Games</span>
          </div>

          <div className="cloud cloud-3">
            <img src={cloud} alt="Cloud" />
            <span>Attention & Memory Exercises</span>
          </div>

          <div className="cloud cloud-4">
            <img src={cloud} alt="Cloud" />
            <span>Brain Games & Exercises</span>
          </div>
          <div className="cloud cloud-5">
            <img src={cloud} alt="Cloud" />
            <span> Performance Tracking</span>
          </div>

          <img src={star_blue} alt="Star" className="feature-star star-1_b" />
          <img src={star_blue} alt="Star" className="feature-star star-2_b" />
        </div>

        

        <div className="features-wave">
          <svg 
            className="wave-svg green-wave" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z"
              fill="#71D0B9"
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
          
          <svg 
            className="wave-svg white-wave" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z"
              fill="white"
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
      </div>
    </section>
  );
}

export default Features;