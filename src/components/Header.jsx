function Header({ title = "NAILONGIFY", children, variant = "default", className = "" }) {
  // For leaderboard variant, render differently
  if (variant === "leaderboard") {
    return (
      <div className={`leaderboard-header ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <header className={`app-header ${variant === "simple" ? "app-header-simple" : ""} ${className}`}>
      <h1>{title}</h1>
      {children && <div className="header-buttons">{children}</div>}
    </header>
  );
}

export default Header;
