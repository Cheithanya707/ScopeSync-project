"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  CircleDot,
  FileCheck2,
  GitBranch,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import {
  Aurora,
  CountUp,
  GlowButton,
  GlassCard,
  IdChip,
  SectionLabel,
  StatusStamp,
} from "@/src/ui/primitives";
import { Logo } from "@/src/ui/brand/Logo";
import { LogoMark } from "@/src/ui/brand/LogoMark";

const features = [
  {
    number: "01",
    icon: GitBranch,
    title: "A living scope baseline",
    detail: "Keep requirements, tasks, decisions, and delivery connected from day one.",
    className: "feature-card--wide",
  },
  {
    number: "02",
    icon: CircleDot,
    title: "Every change has a trail",
    detail: "See what moved, who approved it, and what it affects.",
    className: "",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Decisions with context",
    detail: "Review impact before a new ask becomes unplanned work.",
    className: "",
  },
  {
    number: "04",
    icon: FileCheck2,
    title: "One clear record",
    detail: "A shared source of truth for teams, clients, and collaborators.",
    className: "feature-card--wide",
  },
];

const story = [
  {
    step: "01 / BASELINE",
    title: "Agree on what’s in scope.",
    detail: "Capture the requirements and outcomes that define a successful delivery.",
    status: "approved" as const,
    icon: FileCheck2,
  },
  {
    step: "02 / CHANGE",
    title: "See what changed.",
    detail: "A new request is connected to the work, timeline, and people it may affect.",
    status: "changed" as const,
    icon: GitBranch,
  },
  {
    step: "03 / APPROVE",
    title: "Make the call together.",
    detail: "Record the decision and carry its context forward with the project.",
    status: "pending" as const,
    icon: ShieldCheck,
  },
];

const paperTrailSteps = [
  {
    label: "01 / BASELINE",
    title: "Start with a shared baseline.",
    detail: "Give everyone a clear view of what the project set out to deliver.",
    icon: FileCheck2,
  },
  {
    label: "02 / CHANGE",
    title: "Make every change visible.",
    detail: "Connect new requests to the work, timing, and people they may affect.",
    icon: GitBranch,
  },
  {
    label: "03 / REVIEW",
    title: "Understand the impact.",
    detail: "Review what shifts before a new ask becomes unplanned work.",
    icon: ShieldCheck,
  },
  {
    label: "04 / RECORD",
    title: "Keep the decision on record.",
    detail: "Carry the reason forward so the full project story stays clear.",
    icon: Sparkles,
  },
];

export function LandingExperience() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedUseCase, setExpandedUseCase] = useState<string | null>(null);
  const [activePaperTrailStep, setActivePaperTrailStep] = useState(0);
  const paperTrailRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: paperTrailRef,
    offset: ["start start", "end end"],
  });
  const ActivePaperTrailIcon = paperTrailSteps[activePaperTrailStep].icon;
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const nextStep = Math.min(paperTrailSteps.length - 1, Math.floor(progress * paperTrailSteps.length));
    setActivePaperTrailStep((currentStep) => currentStep === nextStep ? currentStep : nextStep);
  });
  const fadeUp = reduceMotion
    ? {}
    : { initial: { y: 24, opacity: 0 }, whileInView: { y: 0, opacity: 1 }, viewport: { once: true, amount: 0.18 } };

  return (
    <>
      <header className="landing-nav-wrap">
        <nav className="landing-nav" aria-label="Main navigation">
          <Logo className="landing-brand" eager href="/" size="sm" />
          <div className={`landing-nav__links${mobileMenuOpen ? " is-open" : ""}`}>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Platform</a>
            <a href="#use-cases" onClick={() => setMobileMenuOpen(false)}>Who it’s for</a>
            <Link href="/login">Log in</Link>
            <GlowButton href="/signup">Get started <ArrowRight size={15} /></GlowButton>
          </div>
          <button
            type="button"
            className="landing-nav__menu"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </header>

      <main id="top" className="landing-experience">
      <section className="landing-hero">
        <Aurora className="landing-hero__aurora" />
        <motion.div className="landing-hero__copy" {...fadeUp}>
          <span className="landing-eyebrow"><span /> SCOPE, MADE VISIBLE</span>
          <h1>Every change,<br /><em>traced.</em></h1>
          <p>Know what was agreed, what shifted, and what happens next. ScopeSync keeps the full story of your project in view.</p>
          <div className="landing-hero__actions">
            <GlowButton href="/signup">Bring your work into focus <ArrowRight size={16} /></GlowButton>
            <a className="landing-text-link" href="#paper-trail">Explore the approach <ArrowDown size={15} /></a>
          </div>
          <p className="landing-hero__note"><Check size={14} /> Built for clear decisions, not more noise.</p>
        </motion.div>

        <motion.div
          className="product-frame"
          {...(reduceMotion ? {} : { initial: { opacity: 0, y: 24, rotate: 2 }, animate: { opacity: 1, y: 0, rotate: -2 }, transition: { duration: 0.8, delay: 0.15 } })}
        >
          <div className="product-frame__top">
            <div className="product-frame__dots"><i /><i /><i /></div>
            <span>SCOPESYNC / PROJECT OVERVIEW</span>
            <IdChip>PRJ-024</IdChip>
          </div>
          <div className="product-frame__body">
            <div className="product-frame__sidebar">
              <div className="product-frame__mark"><LogoMark size={18} variant="dark" /></div>
              <i /><i /><i /><i />
            </div>
            <div className="product-frame__content">
              <div className="product-frame__heading">
                <div><span>WORKSPACE / NORTHSTAR</span><h2>Product launch</h2></div>
                <StatusStamp status="approved" />
              </div>
              <div className="product-frame__stats">
                <div><span>BASELINE ITEMS</span><b><CountUp value={24} /></b></div>
                <div><span>DECISIONS</span><b><CountUp value={8} /></b></div>
                <div><span>CHANGE LOG</span><b><CountUp value={12} /></b></div>
              </div>
              <div className="product-frame__change">
                <div className="product-frame__change-head"><StatusStamp status="changed" /><time>2h ago</time></div>
                <h3>Checkout flow refinement</h3>
                <p>New payment option requested</p>
                <div className="product-frame__impact"><span>IMPACT REVIEW</span><span className="product-frame__meter"><i /></span><b>Needs review</b></div>
              </div>
              <div className="product-frame__row"><span><Check size={14} /> Initial scope approved</span><IdChip>DEC-008</IdChip></div>
            </div>
          </div>
          <div className="product-frame__float"><span className="product-frame__float-icon"><Check size={15} /></span><span><b>Decision recorded</b><small>Scope history is up to date</small></span></div>
        </motion.div>
      </section>

      <section id="paper-trail" className="landing-intro" ref={paperTrailRef}>
        <div className="landing-intro__sticky">
          <div
            className="landing-intro__progress"
            role="progressbar"
            aria-label="Paper trail story progress"
            aria-valuemin={1}
            aria-valuemax={paperTrailSteps.length}
            aria-valuenow={activePaperTrailStep + 1}
            aria-valuetext={`Step ${activePaperTrailStep + 1} of ${paperTrailSteps.length}`}
          >
            <span aria-hidden="true">{String(activePaperTrailStep + 1).padStart(2, "0")}</span>
            <span className="landing-intro__track" aria-hidden="true">
              <motion.span className="landing-intro__fill" style={{ scaleX: scrollYProgress }} />
            </span>
            <span aria-hidden="true">{String(paperTrailSteps.length).padStart(2, "0")}</span>
          </div>
          <div className="landing-intro__copy">
            <SectionLabel>THE WORK DESERVES A PAPER TRAIL</SectionLabel>
            <motion.div
              className="landing-intro__milestone"
              key={activePaperTrailStep}
              aria-live="polite"
              initial={reduceMotion ? false : { y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
            >
              <motion.span
                className="landing-intro__sticker"
                aria-hidden="true"
                animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], rotate: [0, 3, 0] }}
                transition={reduceMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <ActivePaperTrailIcon size={22} />
              </motion.span>
              <span className="landing-intro__milestone-label">{paperTrailSteps[activePaperTrailStep].label}</span>
              <h2 aria-live="polite">{paperTrailSteps[activePaperTrailStep].title}</h2>
              <p>{paperTrailSteps[activePaperTrailStep].detail}</p>
            </motion.div>
          </div>
          <div className="landing-intro__timeline-wrap">
            <motion.span className="landing-intro__timeline-fill" aria-hidden="true" style={{ scaleX: scrollYProgress }} />
            <ol className="landing-intro__timeline" aria-label="Project paper trail milestones">
              {paperTrailSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === activePaperTrailStep;
                return (
                  <li key={step.label} className={isActive ? "is-active" : index < activePaperTrailStep ? "is-complete" : ""}>
                    <span className="landing-intro__timeline-node" aria-current={isActive ? "step" : undefined}>
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span className="landing-intro__timeline-label">{step.label.split(" / ")[1]}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-story">
        <div className="landing-story__intro">
          <div className="landing-story__sticky">
            <SectionLabel>A SIMPLE THREAD</SectionLabel>
            <h2>From first brief<br />to final sign-off.</h2>
            <p>One connected history keeps the whole team grounded in the same decisions.</p>
          </div>
        </div>
        <div className="landing-story__steps">
          {story.map((item, index) => {
            const StoryIcon = item.icon;
            return (
              <motion.article key={item.step} className="story-card" {...fadeUp}>
                <div className="story-card__top">
                  <SectionLabel>{item.step}</SectionLabel>
                  <motion.span
                    className="story-card__sticker"
                    aria-hidden="true"
                    animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, 4, 0] }}
                    transition={reduceMotion ? undefined : { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.25 }}
                  >
                    <StoryIcon size={20} />
                  </motion.span>
                  <span>0{index + 1}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <div className="story-card__trail"><StatusStamp status={item.status} /><span className="story-card__connector" /><IdChip>{index === 0 ? "BASE-024" : index === 1 ? "CHG-012" : "DEC-009"}</IdChip></div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section id="features" className="landing-features">
        <motion.div className="landing-section-heading" {...fadeUp}>
          <SectionLabel>THE SCOPE SYNC SYSTEM</SectionLabel>
          <h2>Clarity that compounds.</h2>
          <p>Every part of the project stays connected to the intent behind it.</p>
        </motion.div>
        <div className="feature-grid">
          {features.map(({ number, icon: Icon, title, detail, className }, index) => (
            <motion.div
              key={number}
              className={className}
              {...(reduceMotion ? {} : {
                initial: { y: 20, opacity: 0 },
                whileInView: { y: 0, opacity: 1 },
                viewport: { once: true, amount: 0.15 },
                transition: { duration: 0.5, delay: index * 0.08 },
              })}
            >
              <GlassCard className={`feature-card ${className}`}>
                <div className="feature-card__top"><span className="feature-card__icon"><Icon size={18} /></span><IdChip>{number}</IdChip></div>
                <h3>{title}</h3><p>{detail}</p>
                {className.includes("wide") && <div className="feature-card__diagram"><span>BRIEF</span><span /><span>REQUIREMENTS</span><span /><span>DECISION</span><span /><span>DELIVERY</span></div>}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="use-cases" className="landing-use-cases">
        <motion.div {...fadeUp}><SectionLabel>MADE FOR REAL PROJECT WORK</SectionLabel><h2>Good work has a lot of moving parts.</h2></motion.div>
        <div className="use-case-list">
          {[
            {
              number: "01",
              title: "Independent teams",
              detail: "Set a clear baseline with clients and keep every later decision in context.",
              expanded: "Keep agreements, feedback, and approvals connected so everyone can see what changed and why.",
            },
            {
              number: "02",
              title: "Growing businesses",
              detail: "Give distributed teams a reliable view of scope, changes, and ownership.",
              expanded: "Give each contributor a shared view of responsibilities, decisions, and the latest project direction.",
            },
            {
              number: "03",
              title: "Complex delivery",
              detail: "Make dependencies and approvals easier to trace across long-running work.",
              expanded: "Follow requirements and change requests through reviews, dependencies, and delivery milestones.",
            },
          ].map(({ number, title, detail, expanded }) => {
            const isExpanded = expandedUseCase === number;
            return (
              <motion.article key={number} {...fadeUp}>
                <IdChip>{number}</IdChip>
                <div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                  <p id={`use-case-detail-${number}`} className="use-case-list__detail" hidden={!isExpanded}>{expanded}</p>
                </div>
                <button
                  type="button"
                  className="use-case-list__toggle"
                  aria-label={`${isExpanded ? "Hide" : "Show"} more about ${title}`}
                  aria-expanded={isExpanded}
                  aria-controls={`use-case-detail-${number}`}
                  onClick={() => setExpandedUseCase(isExpanded ? null : number)}
                >
                  <ChevronDown size={17} aria-hidden="true" />
                </button>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="landing-final-cta">
        <Aurora className="landing-final-cta__aurora" />
        <motion.div className="landing-final-cta__content" {...fadeUp}>
          <SectionLabel>MAKE THE NEXT DECISION CLEAR</SectionLabel>
          <h2>Keep the story<br />with the work.</h2>
          <p>Start with a shared baseline. Keep every change connected.</p>
          <GlowButton href="/signup">Get started with ScopeSync <ArrowRight size={16} /></GlowButton>
        </motion.div>
      </section>
      <footer className="landing-footer">
        <div className="landing-footer__main">
          <div className="landing-footer__brand">
            <Logo className="landing-brand" eager href="/" size="sm" />
            <p>Keep every project decision connected to the work it shapes.</p>
          </div>
          <nav className="landing-footer__links" aria-label="Footer navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Platform</a>
            <a href="#use-cases">Who it’s for</a>
          </nav>
          <div className="landing-footer__account">
            <span>Ready for a clearer project story?</span>
            <Link href="/signup">Get started <ArrowRight size={14} /></Link>
            <Link href="/login">Sign in</Link>
          </div>
        </div>
        <div className="landing-footer__bottom">
          <span>Clear scope. Confident delivery.</span>
          <a href="#top" onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
          }}>Back to top <ArrowRight size={14} /></a>
        </div>
      </footer>
      </main>
    </>
  );
}
