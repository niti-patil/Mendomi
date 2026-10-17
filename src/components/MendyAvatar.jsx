import React from 'react';
import { Sparkles } from 'lucide-react';

// Mendy's friendly, consistent avatar — used anywhere Mendy speaks (Ask Mendy chat + Wellness Coach messages).
// Background is a simplified miniature of the app's main aura wash; sparkle lineart in solid white.
export default function MendyAvatar({ size = 36, className = '' }) {
  const px = `${size}px`;
  return (
    <div
      className={`shrink-0 grid place-items-center rounded-full shadow-sm overflow-hidden ${className}`}
      style={{
        width: px,
        height: px,
        background:
          'radial-gradient(65% 55% at 8% 6%, hsl(11 31% 65% / 0.55), transparent 68%),' +
          'radial-gradient(60% 50% at 96% 10%, hsl(201 33% 62% / 0.55), transparent 70%),' +
          'radial-gradient(65% 60% at 92% 96%, hsl(71 39% 55% / 0.5), transparent 68%),' +
          'radial-gradient(55% 50% at 4% 94%, hsl(202 46% 29% / 0.45), transparent 70%),' +
          'hsl(20 33% 95%)'
      }}
      aria-label="Mendy"
    >
      <Sparkles className="h-1/2 w-1/2" strokeWidth={2.4} style={{ color: '#C2948A' }} />
    </div>
  );
}