import './Universe.css';
import kid from '../../../assets/kid-universe.png';
import star from '../../../assets/star.png'; 
import attention from '../../../assets/attention-mark.png';
import plane from '../../../assets/plane.png';
import lamp from '../../../assets/lamp.png';

function Universe() {
  return (
    <section className="universe">
      <div className="universe-container">
        <div className="universe-visual">
          <div className="green-circle"></div>
          <img src={kid} alt="Kid" className="universe-kid" />
          <img src={attention} alt="Attention" className="attention-img" />
          <img src={star} alt="Star" className="universe-star star-1_U" />
          <img src={star} alt="Star" className="universe-star star-2_U" />
        </div>

        <div className="universe-content">
          <h2>Clinically validated to improve:</h2>
          
          <div className="universe-grid">
            <div className="universe-column">
              <div className="universe-item">
                <img src={lamp} alt="Bullet" className="bullet-image" />
                <div>
                  <span className="item-title">Executive Function</span>
                </div>
              </div>
              
              <div className="universe-item">
                <img src={lamp} alt="Bullet" className="bullet-image" />
                <div>
                  <span className="item-title">Attention</span>
                </div>
              </div>

              <div className="universe-item">
                <img src={lamp} alt="Bullet" className="bullet-image" />
                <div>
                  <span className="item-title">Emotional Regulation</span>
                </div>
              </div>

              <div className="universe-item">
                <img src={lamp} alt="Bullet" className="bullet-image" />
                <div>
                  <span className="item-title">Impulse Control</span>
                </div>
              </div>
            </div>
            
            <div className="universe-column">
              <div className="universe-item">
                <img src={lamp} alt="Bullet" className="bullet-image" />
                <div>
                  <span className="item-title">Self Confidence</span>
                </div>
              </div>
              
              <div className="universe-item">
                <img src={lamp} alt="Bullet" className="bullet-image" />
                <div>
                  <span className="item-title">Behavior</span>
                </div>
              </div>

              <div className="universe-item">
                <img src={lamp} alt="Bullet" className="bullet-image" />
                <div>
                  <span className="item-title">Organization</span>
                </div>
              </div>
            </div>
          </div>


          <div className="plane-box">
            <img src={plane} alt="Plane" />
            
          </div>
        </div>
        
      </div>
        <div className="universe-features-wave">
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
    </section>
  );
}

export default Universe;