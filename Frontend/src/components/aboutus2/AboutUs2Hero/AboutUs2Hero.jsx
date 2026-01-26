import "./AboutUs2Hero.css";
import headerPaper from "../../../assets/headerpaper.png";
import kidsImage from "../../../assets/Ötletcsomag_negyedikeseknek__1_-removebg-preview 1.png";
import repeatingBg from "../../../assets/download_-_2025-12-30T004145.682-removebg-preview 15.png";

const AboutUs2Hero = () => {
  return (
    <section className="aboutus2-hero">
      <div 
        className="repeating-bg" 
        style={{ backgroundImage: `url(${repeatingBg})` }}
      ></div>

      <div className="hero2-container">
        {/* LEFT COMPONENT */}
        <div className="hero2-left">
          <div className="paper-wrapper">
            <img src={headerPaper} alt="Paper background" className="paper-bg" />
            <div className="paper-content">
              <h1>
                Your Journey,<br />
                Your Strength
              </h1>
              <p>
                At NeuroSpark, we believe ADHD isn't just a challenge—it's a 
                unique way of thinking that can be powerful when understood and 
                supported. Our mission is to provide clear guidance, practical tools, 
                and a supportive community for anyone navigating life with ADHD.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT */}
        <div className="hero2-right">
          <img src={kidsImage} alt="Happy kids" className="kids-img" />
        </div>
      </div>
    </section>
  );
};

export default AboutUs2Hero;
