const StatCard = ({ title, value, icon: Icon, trend, variant = "default", delay = 0 }) => {
  return (
    <div
      className={`ad-stat-card ${variant !== "default" ? `ad-variant-${variant}` : ""} ad-animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="ad-stat-card-inner">
        <div className="ad-flex-1">
          <p className="ad-stat-card-title">{title}</p>
          <p className="ad-stat-card-value">{value}</p>
          {trend && (
            <div className="ad-stat-card-trend">
              <span className={`ad-stat-card-trend-value ${trend.value >= 0 ? "ad-positive" : "ad-negative"}`}>
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="ad-stat-card-trend-label">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`ad-stat-card-icon ad-${variant}`}>
          <Icon style={{ height: 20, width: 20 }} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;