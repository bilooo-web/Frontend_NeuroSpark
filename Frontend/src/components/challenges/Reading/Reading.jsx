import "./Reading.css";
import ticket from "../../../assets/ticket.png";
import cloud_r from "../../../assets/cloud_r.png";
import star_r from "../../../assets/star.png";
import girl from "../../../assets/girl-flying.png";
import books_r from "../../../assets/books_r.png";
import quote from "../../../assets/quote.png";
import bookChar from "../../../assets/book-character.png";
import stamp from "../../../assets/stamp.png"; // Add this import

const Reading = () => {
  return (
    <section className="reading-section">

      <div className="reading-wave-top"></div>

      <div className="reading-ticket">
        <img src={ticket} alt="" />
        <h2>
          Reading <br /> Adventures
        </h2>
      </div>

      {[...Array(4)].map((_, i) => (
        <img key={i} src={cloud_r} className={`reading-cloud reading-cloud-${i}`} alt="" />
      ))}

      {[...Array(5)].map((_, i) => (
        <img key={i} src={star_r} className={`reading-star reading-star-${i}`} alt="" />
      ))}

      <img src={girl} className="reading-girl" alt="" />
      <img src={books_r} className="reading-books" alt="" />
      <img src={quote} className="reading-quote" alt="" />

      {/* STAMP CONTAINER - REPLACED CLOUD */}
      <div className="reading-big-stamp-container">
        <div className="reading-stamp-shape">
          <img src={stamp} className="reading-stamp-image" alt="How to Play Stamp" />
          
          <div className="stamp-content">
            <h3>How to Play:</h3>
            <p>
              Choose a story you like, listen to the words, and read out loud as the text lights up for you. Take your time and read at your own pace. If you make a mistake, that's okay just try again. Every word you read helps you become a stronger and more confident reader.
            </p>

            <button className="reading-cloud-button">Let's Read!</button>
          </div>
        </div>
      </div>

      <img src={bookChar} className="reading-book-character" alt="" />

      <div className="reading-wave-bottom">
        <svg className="reading-wave-svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
         
        </svg>
      </div>

    </section>
  );
};

export default Reading;