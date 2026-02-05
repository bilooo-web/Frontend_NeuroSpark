import "./AboutUs2Hero.css";
import headerPaper from "../../../assets/headerpaper.png";
import kidsImage from "../../../assets/3kids.png";
import starsBg from "../../../assets/stars_bg.png";

function AboutUs2Hero() {
  return (
    <section className="about-hero">

      <div
        className="about-stars-layer"
        style={{ backgroundImage: `url(${starsBg})` }}
      />

      <div className="about-hero-content">

        <div className="about-paper">
          <img src={headerPaper} alt="Paper background" className="paper-bg" />

          <div className="paper-text">
            <h2>
              Your Journey,<br />
              Your Strength
            </h2>
            <p>
              At NeuroSpark, we believe ADHD isn't just a challenge
              it's a unique way of thinking that can be powerful when
              understood and supported. Our mission is to provide
              clear guidance, practical tools, and a supportive
              community for anyone navigating life with ADHD.
            </p>
          </div>
        </div>

        <div className="about-hero-image">
          <img src={kidsImage} alt="Happy kids illustration" />
        </div>

      </div>

      <div className="about-wave-wrapper">
        
        <svg
          className="about-wave about-wave-green"
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

export default AboutUs2Hero;