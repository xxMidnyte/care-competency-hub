// components/ui/Icon.tsx
"use client";

export type IconVariant = "line" | "solid";

export type IconName =
  | "dashboard"
  | "facilities"
  | "staff"
  | "competencies"
  | "assignments"
  | "learning-modules"
  | "analytics"
  | "notifications"
  | "settings"
  | "ai-bolt"
  | "profile"
  // solid-only utility icons:
  | "plus"
  | "pencil"
  | "trash"
  | "download"
  | "upload"
  | "check"
  | "x"
  | "filter"
  | "search"
  | "eye";

interface IconProps {
  name: IconName;
  variant?: IconVariant; // "line" for sidebar, "solid" for buttons
  size?: number;         // px
  className?: string;
  title?: string;
}

export function Icon({
  name,
  variant = "line",
  size = 24,
  className = "",
  title,
}: IconProps) {
  const strokeWidth = variant === "solid" ? 1.5 : 1.8;
  const stroke = variant === "solid" ? "none" : "currentColor";
  const fill = variant === "solid" ? "currentColor" : "none";

  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true,
  } as const;

  switch (name) {
    case "dashboard":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      );

    case "facilities":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <rect x="4" y="8" width="16" height="11" rx="2" />
          <path d="M4 11h16" />
          <path d="M9 3v5" />
          <circle cx="9" cy="6" r="1.3" />
          <rect x="8" y="13" width="2" height="3" />
          <rect x="14" y="13" width="2" height="3" />
        </svg>
      );

    case "staff":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <circle cx="9" cy="9" r="3" />
          <path d="M4 19c0-2.8 2.2-5 5-5" />
          <circle cx="17" cy="10" r="2.4" />
          <path d="M14 19c0-2.1 1.4-3.9 3.4-4.6" />
        </svg>
      );

    case "competencies":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 9l2 2 4-4" />
          <path d="M8 14h8" />
          <path d="M8 17h5" />
        </svg>
      );

    case "assignments":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <rect x="6" y="4" width="12" height="16" rx="2" />
          <path d="M10 4.5h4" />
          <circle cx="12" cy="4" r="1.5" />
          <path d="M9 10h6" />
          <path d="M9 13h6" />
          <path d="M9 16h3.5" />
        </svg>
      );

    case "learning-modules":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M4 7l8-3 8 3-8 3-8-3z" />
          <path d="M4 12l8 3 8-3" />
          <path d="M4 17l8 3 8-3" />
        </svg>
      );

    case "analytics":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M4 19h16" />
          <rect x="5" y="10" width="3" height="6" rx="1" />
          <rect x="10.5" y="7" width="3" height="9" rx="1" />
          <rect x="16" y="5" width="3" height="11" rx="1" />
        </svg>
      );

    case "notifications":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M12 4a4 4 0 0 1 4 4v3.5l1.3 2.6c.3.7-.2 1.4-.9 1.4H7.6c-.7 0-1.2-.7-.9-1.4L8 11.5V8a4 4 0 0 1 4-4z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <circle cx="12" cy="12" r="3" />
          <path d="M4.9 9.5l1.4-.8 0-1.6 1.7-1 1 1.7h1.8l1-1.7 1.7 1v1.6l1.4.8-.1 2.1 1.4.8-1 1.7-1.6-.1-1 1.7-2-.1-1-1.7-1.7.1-1-1.7 1.2-.9z" />
        </svg>
      );

    case "ai-bolt":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M13 2L6 13h4l-1 9 7-11h-4z" />
        </svg>
      );

    case "profile":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <circle cx="12" cy="9" r="3" />
          <path d="M5 19c1.5-2.3 3.7-3.5 7-3.5s5.5 1.2 7 3.5" />
        </svg>
      );

    case "plus":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      );

    case "pencil":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M5 17.5L8.5 18l8-8-3.5-3.5-8 8z" />
          <path d="M14 6l2.5-2.5 2 2L16 8" />
        </svg>
      );

    case "trash":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M6 7h12" />
          <path d="M10 4h4" />
          <rect x="7" y="7" width="10" height="12" rx="2" />
        </svg>
      );

    case "download":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M12 4v9" strokeLinecap="round" />
          <path d="M8.5 10.5L12 14l3.5-3.5" strokeLinecap="round" />
          <path d="M5 18h14" />
        </svg>
      );

    case "upload":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M12 20V11" strokeLinecap="round" />
          <path d="M8.5 13.5L12 10l3.5 3.5" strokeLinecap="round" />
          <path d="M5 6h14" />
        </svg>
      );

    case "check":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M5 13l4 4 10-10" strokeLinecap="round" />
        </svg>
      );

    case "x":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
        </svg>
      );

    case "filter":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M4 5h16" />
          <path d="M7 12h10" />
          <path d="M10 19h4" />
        </svg>
      );

    case "search":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <circle cx="11" cy="11" r="4" />
          <path d="M15 15l4 4" strokeLinecap="round" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common} stroke={stroke} fill={fill} strokeWidth={strokeWidth}>
          <path d="M2.5 12s3-5 9.5-5 9.5 5 9.5 5-3 5-9.5 5S2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    default:
      return null;
  }
}
