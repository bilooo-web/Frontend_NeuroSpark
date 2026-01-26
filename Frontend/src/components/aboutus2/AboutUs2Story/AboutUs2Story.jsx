import "./AboutUs2Story.css";
import storyImage from "../../../assets/About_Us___Behind_Our_Design_Thinking_Mission-removebg-preview 1.png";
import paperBg from "../../../assets/Group 3755.png";
import containerBg from "../../../assets/Group 3756hg.png";

const AboutUs2Story = () => {
  return (
    <section className="aboutus2-story">
      {/* Curved Container with Image Background */}
      <div 
        className="story-curved-container"
        style={{ backgroundImage: `url(${containerBg})` }}
      >
        <div className="story-content-wrapper">
          {/* LEFT: Image */}
          <div className="story-left">
            <img src={storyImage} alt="NeuroSpark Elements" className="story-main-img" />
          </div>

          {/* RIGHT: Paper with Text */}
          <div className="story-right">
            <div className="story-paper-wrapper">
              <img src={paperBg} alt="Story Background" className="story-paper-bg" />
              <div className="story-text-overlay">
                <h2>Story Behind NeuroSPark</h2>
                <p>
                  Children with ADHD face daily challenges that go far beyond attention; they affect
                  skills, confidence, and emotional wellbeing. At the same time, parents often feel
                  overwhelmed, and therapists are limited by time and physical spaces. This
                  platform was built to bridge that gap. By combining skill-based games, progress
                  tracking, and shared access for parents and therapists, we created a structured
                  yet playful environment that supports children consistently wherever they are.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default AboutUs2Story;
