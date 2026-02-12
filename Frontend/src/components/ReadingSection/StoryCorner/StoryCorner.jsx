import React from 'react';
import './StoryCorner.css';
import duck_glasses from '../../../assets/duck-glasses.png';
import duck_yellow from '../../../assets/duck-yellow.png';

const StoryCorner = () => {
  return (
    <div className="story-corner">
      <div className="story-bg-shape"></div>

      <div className="content-card">
        <div className="text-section">
          <h1>Welcome to Our Story Corner</h1>
          <p>
            Here, you'll find a collection of stories made especially for curious minds.
            Each story is designed to be easy to follow, comforting to read, and full of
            moments you can recognize from everyday life. Take your time, choose a story
            that feels right, and enjoy reading in a way that's calm, enjoyable, and just
            for you.
          </p>
        </div>
      </div>

      <div className="character duck">
        <img src={duck_glasses} alt="Duck with glasses" />
      </div>
      <div className="character yellow">
        <img src={duck_yellow} alt="Yellow character" />
      </div>
    </div>
  );
};

export default StoryCorner;