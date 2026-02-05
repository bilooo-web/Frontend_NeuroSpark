import "./AboutUs2Team.css";
import ragheedImg from "../../../assets/Gemini_Generated_Image_kqe6g0kqe6g0kqe6-removebg-preview 1.png";
import sondosImg from "../../../assets/Gemini_Generated_Image_jr7yzkjr7yzkjr7y-removebg-preview 1.png";
import bilalImg from "../../../assets/Gemini_Generated_Image_widl0awidl0awidl-removebg-preview 1.png";
import rahmaImg from "../../../assets/Gemini_Generated_Image_siqlnjsiqlnjsiql-removebg-preview (1) 1.png";

function AboutUs2Team() {
  return (
    <section className="team-section">
      <div className="team-stars-bg" />
      
      <div className="team-top-wave-wrapper">
        <svg
          className="team-top-wave"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            fill="#9AD0EE"
            d="M0,10 C200,30 400,10 600,30 S800,10 1200,30 L1200,120 L0,120 Z"
          />
        </svg>
      </div>
      
      <div className="team-content">
        
        <h2 className="team-title">Our Team</h2>
        
        <div className="team-members-container">
          
          <div className="team-row">
            <div className="team-member">
              <div className="member-image-wrapper">
                <img 
                  src={ragheedImg} 
                  alt="Ragheed Hashisho" 
                  className="member-image ragheed-image" 
                />
              </div>
              <div className="member-info">
                <h3 className="member-name ragheed-name">Ragheed Hashisho</h3>
                <div className="member-underline"></div>
              </div>
            </div>

            <div className="team-member">
              <div className="member-image-wrapper">
                <img 
                  src={sondosImg} 
                  alt="Sondos Oueidat" 
                  className="member-image" 
                />
              </div>
              <div className="member-info">
                <h3 className="member-name">Sondos Oueidat</h3>
                <div className="member-underline"></div>
              </div>
            </div>
          </div>

          <div className="team-row">
            <div className="team-member">
              <div className="member-image-wrapper">
                <img 
                  src={bilalImg} 
                  alt="Bilal Al Habta" 
                  className="member-image bilal-image" 
                />
              </div>
              <div className="member-info">
                <h3 className="member-name bilal-name">Bilal Al Habta</h3>
                <div className="member-underline"></div>
              </div>
            </div>

            <div className="team-member">
              <div className="member-image-wrapper">
                <img 
                  src={rahmaImg} 
                  alt="Rahma Fallous" 
                  className="member-image" 
                />
              </div>
              <div className="member-info">
                <h3 className="member-name">Rahma Fallous</h3>
                <div className="member-underline"></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="team-bottom-wave-wrapper">
        <svg
          className="team-bottom-wave"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            fill="#DEF0FF"
            d="M0,110 C200,90 400,120 600,100 S800,90 1200,110 L1200,120 L0,120 Z"
          />
        </svg>
      </div>

    </section>
  );
}

export default AboutUs2Team;