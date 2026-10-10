import type { ComponentProps } from "react";
import { Logo as BrandLogo } from "@/src/ui/brand/Logo";

export function Logo({ href = "/", ...props }: ComponentProps<typeof BrandLogo>) {
  return <BrandLogo {...props} href={href} />;
}
