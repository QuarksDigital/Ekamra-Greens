// The Ekamra Greens mark: four interlocking rings around a gilded diamond,
// redrawn as vector so it stays crisp at any size and can take any ink.
type Props = {
  className?: string;
  ring?: string;
  diamond?: string;
  strokeWidth?: number;
  title?: string;
};

export default function Emblem({
  className,
  ring = "currentColor",
  diamond = "var(--color-gold)",
  strokeWidth = 9,
  title,
}: Props) {
  const r = 86;
  const o = 92;
  const d = 126;
  return (
    <svg
      viewBox="-190 -190 380 380"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
    >
      <g stroke={ring} strokeWidth={strokeWidth}>
        <circle cx={0} cy={-o} r={r} />
        <circle cx={o} cy={0} r={r} />
        <circle cx={0} cy={o} r={r} />
        <circle cx={-o} cy={0} r={r} />
      </g>
      <path
        d={`M0 ${-d} L${d} 0 L0 ${d} L${-d} 0 Z`}
        stroke={diamond}
        strokeWidth={strokeWidth * 0.8}
        strokeLinejoin="miter"
      />
    </svg>
  );
}
