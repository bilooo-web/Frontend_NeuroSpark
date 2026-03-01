const StatCard = ({ title, value, icon: Icon, trend, variant = "default", delay = 0 }) => {
  return (
    <div
      className={`stat-card ${variant !== "default" ? `variant-${variant}` : ""} animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stat-card-inner">
        <div className="flex-1">
          <p className="stat-card-title">{title}</p>
          <p className="stat-card-value">{value}</p>
          {trend && (
            <div className="stat-card-trend">
              <span className={`stat-card-trend-value ${trend.value >= 0 ? "positive" : "negative"}`}>
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="stat-card-trend-label">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`stat-card-icon ${variant}`}>
          <Icon style={{ height: 20, width: 20 }} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;