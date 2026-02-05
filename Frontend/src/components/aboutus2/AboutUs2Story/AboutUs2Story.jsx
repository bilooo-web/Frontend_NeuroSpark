import "./AboutUs2Story.css";
import paperImg from "../../../assets/about_bodypaper.png";
import tapeImg from "../../../assets/blue_tape.png";
import about_characterGreen from "../../../assets/about_green.png";
import about_characterBlue_triangle from "../../../assets/about_blue.png";
import about_characterOrange from "../../../assets/about_orange.png";
import about_characterYellow from "../../../assets/about_yellow.png";
import about_characterPurple from "../../../assets/about_purple.png";
import about_characterBlue_rectangle from "../../../assets/about_rectangleblue.png";
import about_characterYellowOrange from "../../../assets/about_halfyellow.png"; 

function AboutUs2Story() {
  return (
    <section className="story-section">

      <div className="story-wave-wrapper">
        
        <svg
          className="story-wave story-wave-green"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            fill="#9AD0EE"
            d="M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z"
          />
        </svg>

      </div>

      <div className="story-content">

        <div className="story-characters-container">
          <img 
            src={about_characterOrange} 
            alt="Orange character" 
            className="story-character story-character-orange" 
          />
          <img 
            src={about_characterBlue_triangle} 
            alt="Blue character" 
            className="story-character story-character-blue" 
          />
          <img 
            src={about_characterYellow} 
            alt="Yellow character" 
            className="story-character story-character-yellow" 
          />
          <img 
            src={about_characterBlue_rectangle} 
            alt="Pink character" 
            className="story-character story-character-pink" 
          />
          <img 
            src={about_characterGreen} 
            alt="Green character" 
            className="story-character story-character-green" 
          />
          <img 
            src={about_characterPurple} 
            alt="Purple character" 
            className="story-character story-character-purple" 
          />
          <img 
            src={about_characterYellowOrange} 
            alt="Red character" 
            className="story-character story-character-red" 
          />
        </div>

        <div className="story-paper-wrapper">
          <img src={tapeImg} alt="Blue tape" className="story-tape" />
          <img src={paperImg} alt="Paper background" className="story-paper" />

          <div className="story-text">
            <h3>Story Behind NeuroSpark</h3>
            <p>
              Children with ADHD face daily challenges that go far
              beyond attention <br /> they affect skills, confidence, and
              emotional well-being. At the same time,<br/> parents often
              feel overwhelmed, and therapists are limited by time
              and<br/> physical space. This platform was built to bridge
              that gap. By combining<br/> skilled games, progress tracking,
              and shared access for parents and therapists,<br/> we created
              a structured yet playful environment that supports
              children<br/> consistently wherever they are.
            </p>
          </div>
        </div>

      </div>

      <div className="story-bottom-wave-wrapper">
        <svg
          className="story-bottom-wave story-bottom-wave-blue"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            fill="#DEF0FF"
            d="M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z"
          />
        </svg>
      </div>

    </section>
  );
}

export default AboutUs2Story;