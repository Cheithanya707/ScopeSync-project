import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  layout?: "horizontal" | "stacked" | "mark-only";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  eager?: boolean;
  className?: string;
};

const sizes = {
  sm: { width: 148, height: 36, mark: 24 },
  md: { width: 197, height: 48, mark: 32 },
  lg: { width: 247, height: 60, mark: 48 },
  xl: { width: 296, height: 72, mark: 64 },
} as const;

export function Logo({
  layout = "horizontal",
  size = "md",
  href,
  eager = false,
  className,
}: LogoProps) {
  const classes = [
    "brand-logo",
    `brand-logo--${layout}`,
    `brand-logo--${size}`,
    className,
  ].filter(Boolean).join(" ");
  const dimensions = sizes[size];
  const isMarkOnly = layout === "mark-only";

  const image = isMarkOnly ? (
    <Image
      alt=""
      aria-hidden="true"
      className="brand-logo__image brand-logo__image--mark"
      height={dimensions.mark}
      loading={eager ? "eager" : "lazy"}
      src="/brand/ScopeSync-Blue-Gradient-Mark.webp"
      style={{ width: dimensions.mark, height: dimensions.mark, objectFit: "contain" }}
      width={dimensions.mark}
    />
  ) : (
    <>
      <Image
        alt=""
        aria-hidden="true"
        className="brand-logo__image brand-logo__image--dark"
        height={dimensions.height}
        loading={eager ? "eager" : "lazy"}
        src="/brand/ScopeSync-Blue-Gradient-Full.webp"
        width={dimensions.width}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="brand-logo__image brand-logo__image--light"
        height={dimensions.height}
        loading={eager ? "eager" : "lazy"}
        src="/brand/ScopeSync-Blue-Gradient-Full-Light.webp"
        width={dimensions.width}
      />
    </>
  );

  if (href) {
    return (
      <Link aria-label="ScopeSync" className={classes} href={href}>
        {image}
      </Link>
    );
  }

  return (
    <span aria-label="ScopeSync" className={classes} role="img">
      {image}
    </span>
  );
}
