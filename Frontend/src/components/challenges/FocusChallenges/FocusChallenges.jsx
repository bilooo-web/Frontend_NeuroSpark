import "./FocusChallenges.css";
import { Link } from "react-router-dom";

import game1 from "../../../assets/duck-game1.png";
import game2 from "../../../assets/duck-game1.png";
import game3 from "../../../assets/duck-game1.png";
import game4 from "../../../assets/duck-game1.png";
import game5 from "../../../assets/duck-game1.png";
import game6 from "../../../assets/duck-game1.png";
import game7 from "../../../assets/game4_c.jpg";
import game8 from "../../../assets/game4_c.jpg";
import game9 from "../../../assets/game4_c.jpg";
import game10 from "../../../assets/game4_c.jpg";
import game11 from "../../../assets/game4_c.jpg";
import game12 from "../../../assets/game4_c.jpg";

import tape from "../../../assets/tape.png";     

const allChallenges = [
  {
    slug: "path-change",
    title: "Path Change",
    gameImage: game1,
    note: "Every time you play, your brain gets stronger. Let's start!",
    titleStyle: { marginTop: "35px" }
  },
  {
    slug: "padlocks",
    title: "Padlocks",
    gameImage: game2,
    note: "Mistakes are part of the fun  keep going, you're learning!",
    titleStyle: { marginTop: "35px" }
  },
  {
    slug: "faces-and-names",
    title: "Faces and Names",
    gameImage: game3,
    note: "Play, explore, and discover how awesome you are!",
    titleStyle: { marginTop: "35px" }
  },
  {
    slug: "puzzles",
    title: "Puzzles",
    gameImage: game4,
    note: "This game helps you think smarter  are you ready?",
    titleStyle: { marginTop: "35px" }
  },
  {
    slug: "painting",
    title: "Painting",
    gameImage: game5,
    note: "Try your best and enjoy the adventure!",
    titleStyle: { marginTop: "35px" }
  },
  {
    slug: "colored-words",
    title: "Colored Words",
    gameImage: game6,
    note: "Each level is a new challenge you can conquer!",
    titleStyle: { marginTop: "35px" }
  },
  {
    slug: "word-search",
    title: "Word Search",
    gameImage: game7,
    note: "Believe in yourself  you can do this!",
    titleStyle: { marginTop: "35px" }
  },
  {
    slug: "cars-on-the-road",
    title: "Cars on the Road",
    gameImage: game8,
    note: "Your mind is powerful  let's train it!",
    titleStyle: { marginTop: "35px" }
  },
  {
    slug: "handwriting-enhancement",
    title: "Handwriting Enhancement",
    gameImage: game9,
    note: "Play, focus, and watch yourself improve!"
  },
  {
    slug: "one-line",
    title: "One Line",
    gameImage: game10,
    note: "Great things happen when you don't give up!",
    titleStyle: { marginTop: "35px" }
  },
  {
    slug: "find-the-ball",
    title: "Find the Ball",
    gameImage: game11,
    note: "This game is your chance to shine!",
    titleStyle: { marginTop: "35px" }
  },
  {
    slug: "rearranging-blocks",
    title: "Rearranging Blocks",
    gameImage: game12,
    note: "Have fun while becoming faster, smarter, and stronger!"
  }
];

const FocusChallenges = () => {
  return (
    <div className="focus-challenges-container">
      <section className="focus-challenges">

        <div className="stars-bg" />

        <h1 className="challenges-title">Focus Challenges</h1>

        <div className="challenges-grid">
          {allChallenges.map((challenge) => (
            <Link
              key={challenge.slug}
              to={`/challenges/${challenge.slug}`}
              className="challenge-wrapper"
            >
              <div className="challenge-card">

                <div className="tape-container">
                  <img src={tape} alt="tape" className="tape-image" />
                  <div className="tape-text">
                    <span 
                      className="card-title"
                      style={challenge.titleStyle || {}} 
                    >
                      {challenge.title}
                    </span>
                  </div>
                </div>

                <div className="game-image">
                  <img
                    src={challenge.gameImage}
                    alt={challenge.title}
                  />
                </div>

                <p className="note-text">{challenge.note}</p>

              </div>
            </Link>
          ))}
        </div>

      </section>
    </div>
  );
};

export default FocusChallenges;