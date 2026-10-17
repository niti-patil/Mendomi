import React from "react";

export default function MicrosoftIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3h8.5v8.5H3V3z" fill="#F25022" />
      <path d="M12.5 3H21v8.5h-8.5V3z" fill="#7FBA00" />
      <path d="M3 12.5h8.5V21H3v-8.5z" fill="#00A4EF" />
      <path d="M12.5 12.5H21V21h-8.5v-8.5z" fill="#FFB900" />
    </svg>
  );
}