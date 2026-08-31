type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  centered?: boolean;
  gradient?: boolean;
  // Render for legibility OVER a photo/cover: forces solid white (via inline
  // style, so the html.light `.text-white` override can't flip it dark) plus a
  // soft shadow. Used by the storefront hero when a cover image is set.
  onImage?: boolean;
};

export default function SectionHeading({
  title,
  subtitle,
  centered = false,
  gradient = true,
  onImage = false,
}: SectionHeadingProps) {
  return (
    <header className={centered ? "text-center" : "text-left"}>
      {subtitle ? (
        <p
          className="mb-3 text-xs uppercase tracking-[0.24em]"
          style={onImage ? { color: "rgba(255,255,255,0.85)" } : { color: "var(--color-muted)" }}
        >
          {subtitle}
        </p>
      ) : null}
      <h2
        className={`${onImage ? "" : gradient ? "display-gradient" : "text-site-text"} text-3xl font-bold leading-tight md:text-6xl md:leading-[1.1]`}
        style={{
          fontFamily: "var(--font-display)",
          ...(onImage ? { color: "#ffffff", textShadow: "0 2px 14px rgba(0,0,0,0.55)" } : {}),
        }}
      >
        {title}
      </h2>
    </header>
  );
}
