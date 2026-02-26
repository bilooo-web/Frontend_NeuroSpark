const GameHUD = ({ score, lives, onPause }) => {
  return (
    <div className="hud">
      <div className="lives">
        {Array.from({ length: lives }).map((_, i) => (
          <span key={i}>❤️</span>
        ))}
      </div>

      <div className="score">{score}</div>

      <button className="pause" onClick={onPause}>⏸</button>
    </div>
  );
};

export default GameHUD;
