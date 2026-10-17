// Tiny inline sparkline — no chart lib needed.
export default function Sparkline({ data, width = 120, height = 32, color = 'hsl(var(--chart-3))' }) {
  if (!data || data.length === 0) return null;
  const vals = data.map((d) => d.pain);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const pts = vals.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {vals.map((v, i) => (
        <circle key={i} cx={i * stepX} cy={height - ((v - min) / span) * (height - 6) - 3} r={2} fill={color} />
      ))}
    </svg>
  );
}