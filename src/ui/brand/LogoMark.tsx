import Image from "next/image";

export type LogoMarkProps = {
  size?: number;
  variant?: "auto" | "light" | "dark";
  animated?: boolean;
  className?: string;
};

export function LogoMark({
  size = 32,
  variant = "auto",
  animated = false,
  className,
}: LogoMarkProps) {
  const height = Math.round(size * (1332 / 1248));

  return (
    <Image
      aria-hidden="true"
      className={`logo-mark${animated ? " logo-mark--animated" : ""}${className ? ` ${className}` : ""}`}
      data-variant={variant}
      height={height}
      alt=""
      loading="eager"
      src="/brand/ScopeSync-Blue-Gradient-Mark.webp"
      style={{ width: size, height, objectFit: "contain" }}
      width={size}
      unoptimized
    />
  );
}
