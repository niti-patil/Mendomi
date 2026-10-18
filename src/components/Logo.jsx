export default function Logo({ className = "w-9 h-9", color = "#28536B" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`} aria-label="Mendomi">
      <rect x="11" y="6" width="30" height="50" rx="8" stroke={color} strokeWidth="3.5" />
      <path d="M26 17V31M19 24H33" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M12 41H22L25 35L29 47L32 40H40" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(37,33)">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={color} />
      </g>
    </svg>
  );
}