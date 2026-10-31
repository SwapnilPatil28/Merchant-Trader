/** Tiny SVG sparkline chart for price history */
export function Sparkline({ data, width = 48, height = 18 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  }).join(' ');

  // Trend color: compare last vs first
  const trend = data[data.length - 1] - data[0];
  const color = trend > 0 ? '#ff8070' : trend < 0 ? '#80d880' : '#c8962a';

  return (
    <svg width={width} height={height} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {/* Current price dot */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 2) - 1}
        r="2"
        fill={color}
      />
    </svg>
  );
}

