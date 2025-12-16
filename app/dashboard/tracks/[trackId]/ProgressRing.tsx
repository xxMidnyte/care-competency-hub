// app/dashboard/tracks/[trackId]/ProgressRing.tsx
"use client";

type ProgressRingProps = {
  value: number; // 0–1
  size?: number;
  strokeWidth?: number;
  label?: string;
};

export default function ProgressRing({
  value,
  size = 26,
  strokeWidth = 3,
  label = "Progress",
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(1, value || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <span
      className="inline-flex shrink-0 text-primary"
      aria-label={`${label}: ${Math.round(pct * 100)}%`}
      role="img"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* background circle (theme-safe) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(148,163,184,0.35)" // slate-ish, visible in both modes
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* progress circle (inherits text-primary) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
    </span>
  );
}
