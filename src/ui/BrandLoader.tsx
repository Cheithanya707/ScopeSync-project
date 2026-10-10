"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LogoMark } from "./brand/LogoMark";

type BrandLoaderProps = {
  className?: string;
  exiting?: boolean;
  onExitComplete?: () => void;
  preview?: boolean;
};

export function BrandLoader({
  className,
  exiting = false,
  onExitComplete,
  preview = false,
}: BrandLoaderProps) {
  return (
    <motion.div
      aria-busy="true"
      aria-label="Loading ScopeSync"
      className={cn(
        "brand-loader",
        preview && "brand-loader--preview",
        exiting && "brand-loader--exiting",
        className,
      )}
      animate={preview ? undefined : { opacity: exiting ? 0 : 1 }}
      initial={preview ? undefined : false}
      onAnimationComplete={() => {
        if (exiting) onExitComplete?.();
      }}
      role="status"
      transition={preview ? undefined : { duration: exiting ? 0.4 : 0, ease: "easeInOut" }}
    >
      <div className="brand-loader__grid" aria-hidden="true" />
      <div className="brand-loader__content">
        <LogoMark className="brand-loader__logo" size={preview ? 88 : 112} variant="dark" />
        <div className="brand-loader__caption" aria-hidden="true">
          <span className="brand-loader__progress"><span /></span>
          <span>SYNCING YOUR WORKSPACE</span>
        </div>
        <span className="sr-only" aria-live="polite">Syncing your workspace</span>
      </div>
    </motion.div>
  );
}
