import "./AboutUs2Mission.css";
import threeGuys from "../../../assets/threeguys.png";
import fourLamps from "../../../assets/fourlamps.png";

const AboutUs2Mission = () => {
  return (
    <section className="aboutus2-mission">
      <div className="mission2-container">
        
        {/* Main Content */}
        <div className="mission2-content">
          <h2>Our Mission: Together for Every Child</h2>
          <p>
            Our mission is to bring children, parents, and therapists together in a single, supportive environment where growth, learning,
            and skill development are connected and measurable We believe that every child with ADHD has unique strengths, and our goal
            is to create a platform that nurtures those strengths while addressing challenges in a structured, fun, and engaging way
            By turning therapy into interactive, skillbased experiences, we provide children with tools to build confidence, focus, and
            important life skills through play Parents can track their child's progress in real time and participate in their journey, while
            therapists gain insights to guide interventions more effectively
          </p>
        </div>
      </div>

      {/* Right Image: Three Guys - Moved outside content container to stick to edge */}
      <div className="mission2-right-decor">
        <img src={threeGuys} alt="" className="mission2-threeguys" />
      </div>

      {/* Bottom Left Image: Four Lamps - Moved outside content container to stick to edge */}
      <div className="mission2-bottom-left-decor">
        <img src={fourLamps} alt="" className="mission2-fourlamps" />
      </div>
    </section>
  );
};

export default AboutUs2Mission;
