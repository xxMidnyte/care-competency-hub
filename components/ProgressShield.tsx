// components/ProgressShield.tsx
"use client";

type ProgressShieldProps = {
  /** 0–1 ratio of completion */
  value: number;
  /** Optional label under the shield, e.g. "My competencies" */
  label?: string;
  /** Optional size in px (width/height), default 160 */
  size?: number;
};

export default function ProgressShield({
  value,
  label,
  size = 160,
}: ProgressShieldProps) {
  // Clamp between 0 and 1
  const ratio = Math.max(0, Math.min(1, value ?? 0));
  const percentage = Math.round(ratio * 100);

  const strokeWidth = 10;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  // Color logic: red < yellow < green
  let strokeColor = "#f97373"; // red-400
  if (ratio >= 0.34 && ratio < 0.67) strokeColor = "#facc15"; // yellow-400
  if (ratio >= 0.67) strokeColor = "#34d399"; // emerald-400

  // Soft glow-ish shadow color
  const shadowColor = "rgba(16, 185, 129, 0.4)"; // emerald glow

  return (
    <div
      className="inline-flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-[0_0_30px_rgba(15,23,42,0.8)]"
      style={{ width: size + 40 }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Soft glow behind */}
        <div
          className="absolute rounded-full blur-2xl"
          style={{
            width: size * 0.9,
            height: size * 0.9,
            background: shadowColor,
            opacity: ratio > 0 ? 0.3 : 0.1,
          }}
        />

        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          className="relative"
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(51,65,85,0.7)" // slate-700
            strokeWidth={strokeWidth}
          />

          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{
              transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease",
            }}
          />

          {/* Inner shield-ish shape */}
          <path
            d="M60 30 L82 40 L78 68 L60 84 L42 68 L38 40 Z"
            fill="rgba(15,23,42,0.95)" // slate-900
            stroke="rgba(148,163,184,0.6)" // slate-400
            strokeWidth="1.5"
          />
        </svg>

        {/* Center text */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-slate-50">
            {percentage}%
          </span>
          <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Complete
          </span>
        </div>
      </div>

      {label && (
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
      )}
    </div>
  );
}
