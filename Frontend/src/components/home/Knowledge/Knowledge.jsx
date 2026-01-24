import './Knowledge.css';

import books from '../../../assets/books.png';
import card from '../../../assets/card.png';

const cardsData = [
  {
    title: 'Child freezes in gadgets',
    text: 'And you think he is addicted and he is not interested in anything else in his life.'
  },
  {
    title: 'Your child is bored with learning',
    text: 'And you are tired of forcing and controlling him.'
  },
  {
    title: 'While playing the child does not learn anything',
    text: 'All you see are aggressive shooters, mindless action games, or online battles.'
  },
  {
    title: 'Your child struggles to learn',
    text: 'No matter what you try, your child loses focus and struggles to stay motivated.'
  }
];

function Knowledge() {
  return (
    <section className="knowledge">
      <div className="knowledge-container">

        <h2>
          We convert time spent in games into <br />
          KNOWLEDGE and SKILLS
        </h2>

        <img src={books} alt="Books" className="books books-left" />
        <img src={books} alt="Books" className="books books-right" />

        <div className="knowledge-cards">
          {cardsData.map((cardItem, index) => (
            <div className="knowledge-card" key={index}>
              <img src={card} alt="Card" />
              <div className="card-content">
                <h3>{cardItem.title}</h3>
                <p>{cardItem.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </section>
    
    
  );
}

export default Knowledge;
