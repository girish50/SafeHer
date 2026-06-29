// Signature visual: an arc "risk dial" gauge from 0-100, used throughout the app
// wherever a route or trip's risk score needs a glanceable read.
export default function RiskDial({ score = 0, level = 'low', size = 96 }) {
  const radius = size / 2 - 8;
  const circumference = Math.PI * radius; // half circle
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const dash = circumference * pct;
  const color = level === 'high' ? '#E94B5C' : level === 'moderate' ? '#E8A33D' : '#3FA796';

  const cx = size / 2;
  const cy = size / 2 + 4;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size / 2 + 14} viewBox={`0 0 ${size} ${size / 2 + 14}`}>
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#EEE9E2"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="#1B2A4A" fontFamily="Fraunces, Georgia, serif">
          {Math.round(score)}
        </text>
      </svg>
    </div>
  );
}
