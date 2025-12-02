"use client";

type ProgressRingProps = {
  value: number; // 0–1
  size?: number;
  strokeWidth?: number;
};

export default function ProgressRing({
  value,
  size = 26,
  strokeWidth = 3,
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(1, value || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <svg
      width={size}
      height={size}
      className="shrink-0"
      viewBox={`0 0 ${size} ${size}`}
    >
      {/* background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgb(30,64,75)" // slate-800-ish
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgb(45,212,191)" // emerald-400-ish
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-[stroke-dashoffset] duration-300 ease-out"
      />
    </svg>
  );
}
