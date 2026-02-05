import "./AboutUs2Mission.css";
import threeGuys from "../../../assets/threeguys.png";
import fourLamps from "../../../assets/fourlamps.png";

function AboutUs2Mission() {
  return (
    <section className="mission-section">
      <div className="mission-content">
        
        <div className="mission-text-container">
          <h2>Our Mission: Together for Every Child</h2>
          <div className="mission-text-with-shine">
            <div className="mission-shine">
            </div>
            <div className="mission-paragraph">
              <p>
                Our mission is to bring children, parents, and therapists together in a single, supportive environment where growth, learning, and skill development are connected and measurable. We believe that every child with ADHD has unique strengths, and our goal is to create a platform that nurtures those strengths while addressing challenges in a structured, fun, and engaging way.
                By turning therapy into interactive, skill-based experiences, we provide children with tools to build confidence, focus, and important life skills through play. Parents can track their child’s progress in real time and participate in their journey, while therapists gain insights to guide interventions more effectively.
              </p>
            </div>
          </div>
        </div>

        <div className="mission-three-guys">
          <img src={threeGuys} alt="Three characters" />
        </div>

        <div className="mission-four-lamps">
          <img src={fourLamps} alt="Four lamps" />
        </div>

      </div>
    </section>
  );
}

export default AboutUs2Mission;