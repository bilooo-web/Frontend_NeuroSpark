import React from 'react'; 
import './Superpowers.css';

import mindfulness from '../../../assets/mindfulness.png';
import social from '../../../assets/social.png';
import discriminatory from '../../../assets/discriminatory.png';
import academic from '../../../assets/academic.png';
import spatial from '../../../assets/spatial.png';
import movement from '../../../assets/movement.png';
import planning from '../../../assets/grad_hat.png';
import creativity from '../../../assets/creativity.png';
import focus from '../../../assets/focus.png';
import emotion from '../../../assets/emotion.png';
import flexibility from '../../../assets/flexibility.png';

const powers = [
  { img: mindfulness, text: 'Discriminatory Processing' },
  { img: social, text: 'Social Skills' },
  { img: discriminatory, text: 'Working Memory' },
  { img: academic, text: 'Time on Task' },
  { img: spatial, text: 'Short-term Memory' },
  { img: movement, text: 'Spatial Memory' },
  { img: planning, text: 'Academic Bridge' },
  { img: creativity, text: 'Hand-Eye Coordination' },
  { img: focus, text: 'Visual Tracking' },
  { img: emotion, text: 'Behavior Shaping' },
  { img: flexibility, text: 'Attention Stamina' }
];

const column1 = [...powers, ...powers];
const column2 = [...powers.slice(3), ...powers.slice(0, 3), ...powers.slice(3), ...powers.slice(0, 3)];
const column3 = [...powers.slice(6), ...powers.slice(0, 6), ...powers.slice(6), ...powers.slice(0, 6)];

function ScrollingColumn({ items, reverse }) {
  return (
    <div className={`scroll-column ${reverse ? 'reverse' : ''}`}>
      <div className="scroll-inner">
        {items.map((item, index) => (
          <div className="power-card" key={index}>
            <div className="icon-box">
              <img src={item.img} alt={item.text} />
            </div>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Superpowers() {
  return (
    <section className="superpowers">
      <div className="superpowers-container">
        
        <div className="superpowers-grid">
          <ScrollingColumn items={column1} />
          <ScrollingColumn items={column2} reverse />
          <ScrollingColumn items={column3} />
        </div>
        
        <div className="superpowers-content">
          <h2>Your Child's <span>Superpowers</span> Await!</h2>
          <p>
            Our neuroscience backed games are thoughtfully designed to strengthen cognitive, social, and emotional skills through engaging, play  based experiences. By combining scientific research with interactive challenges, we help children improve focus, memory, problem solving, communication, and emotional regulation in a fun and supportive way.
          </p>
          <button className="superpowers-btn">
            Explore All Games
          </button>
        </div>
      </div>
      
    </section>
  );
}

export default Superpowers;