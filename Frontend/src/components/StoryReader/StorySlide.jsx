import "./StorySlide.css";

const StorySlide = ({ page }) => {
  return (
    <div
      className="slide"
      style={{ backgroundImage: `url(${page.bg})` }}
    >
      <div className={`slide-content ${page.textAlign}`}>
        
        <img
          src={page.character}
          alt="character"
          className="slide-character"
        />

        <div className="slide-text-box">
          <p>{page.text}</p>
        </div>

      </div>
    </div>
  );
};

export default StorySlide;