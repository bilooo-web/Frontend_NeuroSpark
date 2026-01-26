import "./AboutUs2Team.css";
import teamBg from "../../../assets/Group khguygibui.png";
import ragheedImg from "../../../assets/Gemini_Generated_Image_kqe6g0kqe6g0kqe6-removebg-preview 1.png";
import sondosImg from "../../../assets/Gemini_Generated_Image_jr7yzkjr7yzkjr7y-removebg-preview 1.png";
import bilalImg from "../../../assets/Gemini_Generated_Image_widl0awidl0awidl-removebg-preview 1.png";
import rahmaImg from "../../../assets/Gemini_Generated_Image_siqlnjsiqlnjsiql-removebg-preview (1) 1.png";

const teamMembers = [
  { id: 1, name: "Ragheed Hashisho", image: ragheedImg },
  { id: 2, name: "Sondos Oueidat", image: sondosImg },
  { id: 3, name: "Bilal Al Habta", image: bilalImg },
  { id: 4, name: "Rahma Fallous", image: rahmaImg }
];

const AboutUs2Team = () => {
  return (
    <section className="aboutus2-team">
      {/* Background Container using Group khguygibui */}
      <div 
        className="team2-bg-container"
        style={{ backgroundImage: `url("${teamBg}")` }}
      >
        <div className="team2-content">
          <h2 className="team2-title">Our Team</h2>
          
          <div className="team2-grid">
            {teamMembers.map((member) => (
              <div key={member.id} className="team2-card">
                <div className="team2-img-wrapper">
                  <img src={member.image} alt={member.name} className="team2-penguin" />
                </div>
                <h3 className="team2-name">{member.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs2Team;
