const ProgressBar = ({ progress }) => {
  return (
    <div className="progress-wrapper">
      <div
        className="progress-fill"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
