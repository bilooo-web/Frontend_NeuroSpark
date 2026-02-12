import React from 'react';
import './SafeStories.css';

// Book images
import ginger from "../../../assets/ginger-giraffe.png";
import samantha from "../../../assets/samantha-scientist.png";
import frankie from "../../../assets/frankie-fish.png";
import magician from "../../../assets/mark-magician.png";
import superhero from "../../../assets/superhero-secret.png";
import penguin from "../../../assets/positive-penguin.png";
import captain from "../../../assets/captain-bram.png";
import wonder from "../../../assets/wobbly-wonder.png";
import stars from "../../../assets/beyond-stars.png";
import voices from "../../../assets/voices-change.png";
import milo from "../../../assets/milo-gate.png";
import shadows from "../../../assets/light-shadows.png";

import duckLeft from "../../../assets/group-ducks-left.png";   
import duckRight from "../../../assets/group-ducks-right.png"; 

const bookData = [
  { id: 1, title: "Ginger The Giraffe", img: ginger },
  { id: 2, title: "SAMATHA, THE GIRL SCIENIST", img: samantha },
  { id: 3, title: "FRANKIE THE FISH", img: frankie },
  { id: 4, title: "MARK BECOMES A MAGICIAN", img: magician },
  { id: 5, title: "THE SUPERHERO SECRET", img: superhero },
  { id: 6, title: "THE POSITIVE PENGUIN", img: penguin },
  { id: 7, title: "CAPTAIN BRAM WHISTLING KIDS", img: captain },
  { id: 8, title: "Milo and the Whispering Gate", img: milo },
  { id: 9, title: "VOICES or CHANGE", img: voices },
  { id: 10, title: "Wobbly Wonder", img: wonder },
  { id: 11, title: "Beyond the Stars", img: stars },
  { id: 12, title: "Light and Shadows", img: shadows },
];

const SafeStories = () => {
  return (
    <div className="stories-container">
      <div className="safestories-stars-bg" />
      <div className="wave-stories-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path fill="#77BEF0" fillOpacity="1" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
        </svg>
      </div>

      <div className="title-section">
        <h1 className="centered-title">A Safe Place for Stories</h1>
        <img src={duckLeft} alt="ducks left" className="duck-left" />
        <img src={duckRight} alt="ducks right" className="duck-right" />
      </div>

      <div className="books-grid">
        {bookData.map((book) => (
          <div key={book.id} className="book-card">
            <img src={book.img} alt={book.title} className="book-cover" />
            <p className="book-title">{book.title}</p>
          </div>
        ))}
      </div>
      <div className="wave-stories-bottom">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path fill="#DEF0FF" fillOpacity="1" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default SafeStories;