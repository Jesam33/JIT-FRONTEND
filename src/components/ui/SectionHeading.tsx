type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  centered?: boolean;
  gradient?: boolean;
};

export default function SectionHeading({
  title,
  subtitle,
  centered = false,
  gradient = true,
}: SectionHeadingProps) {
  return (
    <header className={centered ? "text-center" : "text-left"}>
      {subtitle ? (
        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{subtitle}</p>
      ) : null}
      <h2
        className={`${gradient ? "display-gradient" : "text-site-text"} text-4xl font-bold leading-tight md:text-6xl md:leading-[1.1]`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
    </header>
  );
}
