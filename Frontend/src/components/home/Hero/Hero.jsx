import './Hero.css';
import child from '../../../assets/child.png';
import dinosaur from '../../../assets/dinosaur.png';
import brain from '../../../assets/brain.png';
import star_hero from '../../../assets/star.png';

function Hero() {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-text">
          <h1>
            What are you going to be <br/> when you grow up?
          </h1>

          <p>
            Welcome to NeuroSpark where learning meets play! We help children aged <br/> 8-12 strengthen their focus, unleash creativity, and discover new skills through <br/>fun, interactive challenges
          </p>

          <button className="hero-btn">
            Start the Challenges
          </button>
        </div>

        <div className="hero-images">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          
          <img src={child} alt="Child" className="child-img" />
          <img src={dinosaur} alt="Dinosaur" className="dinosaur-img" />
          <img src={brain} alt="Brain" className="brain-img" />
          
          <img src={star_hero} alt="Star" className="star_hero star-1_hero" />
          <img src={star_hero} alt="Star" className="star_hero star-2_hero" />
        </div>
      </div>
    </section>
  );
}

export default Hero;