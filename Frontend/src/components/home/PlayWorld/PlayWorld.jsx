import { useState, useEffect } from 'react';
import './PlayWorld.css';

import phoneHand from '../../../assets/phone-hand.png';
import balloon from '../../../assets/balloon.png';

import g1 from '../../../assets/game1.png';
import g2 from '../../../assets/game2.png';
import g3 from '../../../assets/game1.png';
import g4 from '../../../assets/game2.png';
import g5 from '../../../assets/game2.png';

const games = [g1, g2, g3, g4, g5];

function PlayWorld() {
  const [active, setActive] = useState(2); 

  const next = () => {
    setActive((prev) => (prev + 1) % games.length);
  };

  const prev = () => {
    setActive((prev) => (prev - 1 + games.length) % games.length);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <section className="play-world">

      <img src={balloon} className="decor-top-left" alt="" />
      <img src={balloon} className="balloon-top" alt="" />

      <h2 className="play-title">Step into a world of play!</h2>
      <p className="play-para">Discover a space where curiosity leads the way and learning<br/> feels like fun. Through engaging activities and playful challenges,<br/> kids explore, imagine, and grow building skills naturally while enjoying every<br/> moment of the journey.</p>

      <div className="carousel">

        {games.map((img, index) => {
          const offset = index - active;
          const isActive = index === active;

          return (
            <div
              key={index}
              className={`slide ${isActive ? 'active' : ''}`}
              style={{
                transform: `translateX(${offset * 260}px) scale(${isActive ? 1 : 0.85})`,
                opacity: Math.abs(offset) > 2 ? 0 : 1,
                zIndex: 10 - Math.abs(offset)
              }}
              onClick={() => setActive(index)}
            >
              {isActive && (
                <img src={phoneHand} className="phone-hand" alt="" />
              )}

              <img
                src={img}
                className={`game-screen ${isActive ? 'inside-phone' : ''}`}
                alt=""
              />
            </div>
          );
        })}

      </div>

      <p className="hint">Swipe, tap, or press space</p>
    </section>
  );
}

export default PlayWorld;