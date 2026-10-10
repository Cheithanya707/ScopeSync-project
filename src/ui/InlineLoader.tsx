import { cn } from "@/lib/utils";
import { LogoMark } from "./brand/LogoMark";

type InlineLoaderProps = {
  className?: string;
  label?: string;
  size?: number;
};

export function InlineLoader({
  className,
  label = "Loading",
  size = 20,
}: InlineLoaderProps) {
  return (
    <span
      aria-label={label}
      aria-busy="true"
      className={cn("inline-loader", className)}
      role="status"
    >
      <LogoMark className="brand-logo--single-arc" size={size} />
    </span>
  );
}
