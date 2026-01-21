import "./FocusChallenges.css";

import game1 from "../../../assets/game1_c.jpg";
import game2 from "../../../assets/game2_c.jpg";
import game3 from "../../../assets/game3_c.jpg";
import game4 from "../../../assets/game4_c.jpg";
import game5 from "../../../assets/game5_c.jpg";
import game6 from "../../../assets/game4_c.jpg";
import game7 from "../../../assets/game4_c.jpg";
import game8 from "../../../assets/game4_c.jpg";
import game9 from "../../../assets/game4_c.jpg";
import game10 from "../../../assets/game4_c.jpg";
import game11 from "../../../assets/game4_c.jpg";
import game12 from "../../../assets/game4_c.jpg";

import quote1 from "../../../assets/quote1.jpg";
import quote2 from "../../../assets/quote2.jpg";
import quote3 from "../../../assets/quote3.jpg";
import quote4 from "../../../assets/quote4.jpg";
import quote5 from "../../../assets/quote5.jpg";
import quote6 from "../../../assets/quote6.jpg";
import quote7 from "../../../assets/quote7.jpg";
import quote8 from "../../../assets/quote8.jpg";
import quote9 from "../../../assets/quote9.jpg";
import quote10 from "../../../assets/quote10.jpg";
import quote11 from "../../../assets/quote11.jpg";
import quote12 from "../../../assets/quote12.jpg";

import pin from "../../../assets/pin.png";

const allChallenges = [
  { id: 1, title: "Path Change", level: "Beginner", gameImage: game1, quoteImage: quote1 },
  { id: 2, title: "Rearranging Blocks", level: "Beginner", gameImage: game2, quoteImage: quote2 },
  { id: 3, title: "Find the Ball", level: "Beginner", gameImage: game3, quoteImage: quote3 },
  { id: 4, title: "Puzzles", level: "Beginner", gameImage: game4, quoteImage: quote4 },
  { id: 5, title: "Paldocks", level: "Advanced", gameImage: game5, quoteImage: quote5 },
  { id: 6, title: "Colored Words", level: "Beginner", gameImage: game6, quoteImage: quote6 },
  { id: 7, title: "Word Search", level: "Beginner", gameImage: game7, quoteImage: quote7 },
  { id: 8, title: "Faces and Names", level: "Beginner", gameImage: game8, quoteImage: quote8 },
  { id: 9, title: "Cars on the Road", level: "Beginner", gameImage: game9, quoteImage: quote9 },
  { id: 10, title: "Hand Writing Enhancement", level: "Beginner", gameImage: game10, quoteImage: quote10 },
  { id: 11, title: "Memory Match", level: "Intermediate", gameImage: game11, quoteImage: quote11 },
  { id: 12, title: "Pattern Recognition", level: "Advanced", gameImage: game12, quoteImage: quote12 }
];

const FocusChallenges = () => {
  // Remove flip state since we don't need flipping anymore
  return (
    <section className="focus-challenges">
      <div className="stars-bg" />

      <h1 className="challenges-title">Focus Challenges</h1>

      <div className="challenges-grid">
        {allChallenges.map((c) => (
          <div key={c.id} className="challenge-wrapper">
            
            {/* Stacked container for both images */}
            <div className="challenge-stack">
              
              {/* Quote image at the back */}
              <div className="quote-back">
                <img src={c.quoteImage} alt="quote" />
              </div>
              
              {/* Game image on top with pin */}
              <div className="game-front">
                <img src={c.gameImage} alt={c.title} />
                
              </div>
              <img src={pin} className="pin" alt="" />

            </div>

            {/* BUTTON BELOW CARD */}
            <button className="play-btn">
              {c.title}
            </button>

          </div>
        ))}
      </div>
    </section>
  );
};

export default FocusChallenges;