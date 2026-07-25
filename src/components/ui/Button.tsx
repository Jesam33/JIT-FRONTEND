import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-site-primary text-white hover:brightness-110 border-transparent",
  secondary:
    "bg-site-surface-soft text-site-text hover:brightness-105 border-site-border/30",
  outline:
    "bg-transparent text-site-text border-site-border/60 hover:bg-site-text/10",
};

export default function Button({ href, children, variant = "primary" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-3 rounded-[var(--radius-pill)] border px-5 py-2.5 text-sm font-semibold tracking-wide transition md:px-6 md:py-3 ${variantClasses[variant]}`}
    >
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
    </Link>
  );
}
