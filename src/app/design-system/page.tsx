import Link from "next/link";
import { ArrowLeft, Check, CircleDot } from "lucide-react";
import {
  Aurora,
  DriftGauge,
  EmptyState,
  GlassCard,
  GlowButton,
  IdChip,
  ScopeThread,
  SectionLabel,
  Skeleton,
  StatusStamp,
} from "@/src/ui/primitives";
import { LoaderShowcase } from "@/src/ui/LoaderShowcase";

const tokens = [
  ["Background", "#05070D", "var(--background)"],
  ["Surface", "#0A1020", "var(--surface)"],
  ["Raised", "#0F1A33", "var(--raised)"],
  ["Primary", "#2F6BFF", "var(--brand)"],
  ["Bright", "#5B8CFF", "var(--brand-strong)"],
  ["Ice", "#9DB7FF", "#9DB7FF"],
  ["Text", "#FFFFFF", "var(--foreground)"],
  ["Muted", "68% white", "var(--muted-foreground)"],
  ["Border", "8% white", "var(--border)"],
];

export default function DesignSystemPage() {
  return (
    <main className="design-system-page">
      <Aurora className="design-system-page__aurora" />
      <header>
        <Link href="/" className="design-system-back"><ArrowLeft size={15} /> Back to ScopeSync</Link>
        <SectionLabel>MIDNIGHT BLUEPRINT / 01</SectionLabel>
        <h1>Design system</h1>
        <p>Tokens and components that keep ScopeSync calm, clear, and consistent.</p>
      </header>

      <section aria-labelledby="token-heading">
        <SectionLabel>COLOR TOKENS</SectionLabel>
        <h2 id="token-heading">A focused palette.</h2>
        <div className="design-token-grid">
          {tokens.map(([name, value, color]) => (
            <GlassCard key={name} className="design-token">
              <span className="design-token__swatch" style={{ background: color }} />
              <span><b>{name}</b><code>{value}</code></span>
            </GlassCard>
          ))}
        </div>
        <p className="design-system-note">Light mode uses white (#FFFFFF), surface #F5F8FF, text #05070D, and the same primary blue.</p>
      </section>

      <section>
        <SectionLabel>CORE COMPONENTS</SectionLabel>
        <h2>Built from the same system.</h2>
        <div className="design-component-grid">
          <GlassCard className="design-component">
            <SectionLabel>GLASS CARD</SectionLabel>
            <h3>Surface with a little depth.</h3>
            <p>Gradient edge, restrained blur, and a blue sweep on hover.</p>
          </GlassCard>
          <GlassCard className="design-component">
            <SectionLabel>GLOW BUTTON</SectionLabel>
            <div className="design-component__buttons"><GlowButton>Primary <Check size={15} /></GlowButton><GlowButton variant="secondary">Secondary</GlowButton></div>
          </GlassCard>
          <GlassCard className="design-component">
            <SectionLabel>STATUS STAMPS</SectionLabel>
            <div className="design-component__stamps"><StatusStamp status="approved" /><StatusStamp status="pending" /><StatusStamp status="changed" /><StatusStamp status="blocked" /></div>
          </GlassCard>
          <GlassCard className="design-component">
            <SectionLabel>IDENTIFIERS & THREAD</SectionLabel>
            <div className="design-component__ids"><IdChip>REQ-024</IdChip><IdChip>CHG-008</IdChip><ScopeThread /></div>
          </GlassCard>
          <GlassCard className="design-component">
            <SectionLabel>DRIFT GAUGE</SectionLabel>
            <div className="design-component__gauge"><DriftGauge value={28} /></div>
          </GlassCard>
          <GlassCard className="design-component">
            <SectionLabel>SKELETON</SectionLabel>
            <div className="design-component__skeleton"><Skeleton /><Skeleton className="w-3/4" /><Skeleton className="w-1/2" /></div>
          </GlassCard>
          <GlassCard className="design-component">
            <SectionLabel>EMPTY STATE</SectionLabel>
            <EmptyState title="Nothing here yet">A clear space for the next part of your project.</EmptyState>
          </GlassCard>
          <GlassCard className="design-component design-component--aurora">
            <SectionLabel>AURORA</SectionLabel>
            <CircleDot size={30} aria-hidden="true" />
            <p>Blurred blue light over the blueprint grid.</p>
          </GlassCard>
        </div>
      </section>

      <LoaderShowcase />
    </main>
  );
}
