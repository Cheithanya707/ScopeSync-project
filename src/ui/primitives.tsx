"use client";

import Link from "next/link";
import {
  Check,
  Clock3,
  Copy,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { setLocalDemoMode } from "@/lib/localData";

type ClassNameProps = { className?: string };

export function CountUp({
  value,
  suffix = "",
  className,
}: ClassNameProps & { value: number; suffix?: string }) {
  const reduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(reduceMotion ? value : 0);
  useEffect(() => {
    if (reduceMotion) return;
    const animation = animate(0, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayed(Math.round(latest)),
    });
    return () => animation.stop();
  }, [reduceMotion, value]);

  return <span className={className} aria-label={`${value}${suffix}`}>{reduceMotion ? value : displayed}{suffix}</span>;
}

export function GlassCard({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass-card", className)} {...props}>
      {children}
    </div>
  );
}

type GlowButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ClassNameProps & {
    href?: string;
    variant?: "primary" | "secondary";
    children: ReactNode;
  };

export function GlowButton({
  href,
  variant = "primary",
  className,
  children,
  ...props
}: GlowButtonProps) {
  const classes = cn("glow-button", `glow-button--${variant}`, className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export type StatusKind = "approved" | "pending" | "changed" | "blocked";

const statusPresentation: Record<
  StatusKind,
  { label: string; icon: LucideIcon; className: string }
> = {
  approved: { label: "Approved", icon: Check, className: "status-stamp--approved" },
  pending: { label: "Pending", icon: Clock3, className: "status-stamp--pending" },
  changed: { label: "Changed", icon: TriangleAlert, className: "status-stamp--changed" },
  blocked: { label: "Blocked", icon: X, className: "status-stamp--blocked" },
};

export function StatusStamp({
  status,
  label,
  className,
}: ClassNameProps & { status: StatusKind; label?: string }) {
  const reduceMotion = useReducedMotion();
  const presentation = statusPresentation[status];
  const Icon = presentation.icon;
  return (
    <motion.span
      key={status}
      initial={reduceMotion ? false : { scale: 0.92, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn("status-stamp", presentation.className, className)}
    >
      <Icon aria-hidden="true" size={14} strokeWidth={2.5} />
      {label ?? presentation.label}
    </motion.span>
  );
}

export function IdChip({
  children,
  className,
}: ClassNameProps & { children: ReactNode }) {
  return <span className={cn("id-chip", className)}>{children}</span>;
}

export function ScopeThread({ className }: ClassNameProps) {
  return (
    <div className={cn("scope-thread", className)} aria-label="Connected scope items">
      <span className="scope-thread__node scope-thread__node--active" />
      <span className="scope-thread__link" />
      <span className="scope-thread__node" />
      <span className="scope-thread__link" />
      <span className="scope-thread__node scope-thread__node--small" />
      <span className="scope-thread__link" />
      <span className="scope-thread__node" />
    </div>
  );
}

export function DriftGauge({
  value,
  className,
  label = "Scope drift",
}: ClassNameProps & { value: number | null; label?: string }) {
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      className={cn("drift-gauge", className)}
      role="img"
      aria-label={value === null ? `${label}: not available` : `${label}: ${clamped}%`}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="drift-gauge__track" cx="50" cy="50" r={radius} />
        <circle
          className="drift-gauge__value"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
        />
      </svg>
      <span className="drift-gauge__number">{value === null ? "—" : `${clamped}%`}</span>
      <span className="drift-gauge__label">{label}</span>
    </div>
  );
}

export function SectionLabel({
  className,
  children,
}: ClassNameProps & { children: ReactNode }) {
  return <p className={cn("section-label", className)}>{children}</p>;
}

export function Aurora({ className }: ClassNameProps) {
  return (
    <div className={cn("aurora", className)} aria-hidden="true">
      <span className="aurora__blob aurora__blob--one" />
      <span className="aurora__blob aurora__blob--two" />
      <span className="aurora__grid" />
    </div>
  );
}

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} aria-hidden="true" {...props} />;
}

export function EmptyState({
  title,
  children,
  className,
}: ClassNameProps & { title: string; children: ReactNode }) {
  return (
    <section className={cn("empty-state", className)}>
      <span className="empty-state__mark" aria-hidden="true">—</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}

export function SetupPanel({ className }: ClassNameProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const setupText = "# .env.local (project root)\nNEXT_PUBLIC_API_URL=http://127.0.0.1:5000\nNEXT_PUBLIC_FIREBASE_API_KEY=replace-with-firebase-web-api-key\nNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=replace-with-firebase-auth-domain\nNEXT_PUBLIC_FIREBASE_PROJECT_ID=replace-with-firebase-project-id\nNEXT_PUBLIC_FIREBASE_APP_ID=replace-with-firebase-app-id\n\n# backend/.env\nFIREBASE_PROJECT_ID=replace-with-the-same-firebase-project-id\nMONGODB_URI=mongodb://127.0.0.1:27017";

  const copySteps = async () => {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(setupText);
      setCopied(true);
    } catch {
      setCopyError("Clipboard access was blocked. Select and copy the setting manually.");
    }
  };

  return (
    <section className={cn("setup-panel", className)} aria-labelledby="setup-panel-title">
      <SectionLabel>Connection setup</SectionLabel>
      <h2 id="setup-panel-title">Connect your workspace</h2>
      <p>
        Add the Firebase Web App values to <code>.env.local</code> and the same project ID
        to <code>backend/.env</code>. Start MongoDB Community Server (Compass alone is not
        the server), then run <code>npm run dev:full</code>. See <code>backend/README.md</code>
        for Firebase provider setup.
      </p>
      <div className="setup-panel__steps">
        <pre><code>{setupText}</code></pre>
        <button type="button" onClick={() => void copySteps()} aria-label="Copy environment setting">
          <Copy aria-hidden="true" size={16} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <button
        type="button"
        className="glow-button glow-button--secondary"
        onClick={() => {
          setLocalDemoMode(true);
          router.replace("/dashboard");
        }}
      >
        Use local demo mode
      </button>
      {copyError && <p role="alert" className="setup-panel__notice">{copyError}</p>}
    </section>
  );
}
