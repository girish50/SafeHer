export default function RiskBadge({ level }) {
  const cls = level === 'high' ? 'badge-high' : level === 'moderate' ? 'badge-moderate' : 'badge-low';
  const dotCls = level === 'high' ? 'dot-high' : level === 'moderate' ? 'dot-moderate' : 'dot-low';
  return (
    <span className={`badge ${cls}`}>
      <span className={`dot ${dotCls}`} /> {level} risk
    </span>
  );
}
