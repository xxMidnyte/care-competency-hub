// components/ui/Button.tsx
import React from "react";
import Link from "next/link";

type Variant = "primary" | "secondary";
type Size = "xs" | "sm" | "md";

const styles: Record<Variant, string> = {
  primary:
    "inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center rounded-full border border-border bg-background text-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
};

const sizes: Record<Size, string> = {
  xs: "px-3 py-1.5 text-xs font-semibold",
  sm: "px-4 py-2 text-sm font-semibold",
  md: "px-4 py-2.5 text-sm font-semibold",
};

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
};

function mergeClassName(a?: string, b?: string) {
  return [a, b].filter(Boolean).join(" ");
}

/**
 * When asChild=true, we clone the only child and apply our className.
 * We intentionally avoid passing button-only props (type, disabled, form, etc.)
 * down to DOM/Link elements to prevent React warnings.
 */
function pickSafeChildProps(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    type,
    disabled,
    form,
    formAction,
    formEncType,
    formMethod,
    formNoValidate,
    formTarget,
    value,
    name,
    autoFocus,
    ...rest
  } = props;

  return rest;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  asChild = false,
  ...props
}: ButtonProps) {
  const classes = mergeClassName(`${styles[variant]} ${sizes[size]}`, className);

  if (asChild) {
    const child = React.Children.only(children);

    if (!React.isValidElement(child)) {
      // Fallback: render a normal button if the child isn't a React element
      return (
        <button {...props} className={classes}>
          {children}
        </button>
      );
    }

    const safeProps = pickSafeChildProps(props);
    const childClassName = (child.props as any)?.className as string | undefined;

    return React.cloneElement(child as React.ReactElement<any>, {
      ...safeProps,
      className: mergeClassName(childClassName, classes),
    });
  }

  return (
    <button {...props} className={classes}>
      {children}
    </button>
  );
}

type ButtonLinkProps = Omit<React.ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonLinkProps) {
  const classes = mergeClassName(`${styles[variant]} ${sizes[size]}`, className);

  return <Link {...props} className={classes} />;
}
