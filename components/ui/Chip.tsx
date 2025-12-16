export function Chip({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full border border-border bg-muted px-4 py-2 text-[12px] font-medium text-foreground transition hover:bg-card ${className}`}
    >
      {children}
    </span>
  );
}
