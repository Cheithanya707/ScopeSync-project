import { ArrowRight, BriefcaseBusiness, Building2, CalendarRange, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

const cards = [
  {
    title: "Freelancers",
    examples: ["Video Editing", "Graphic Design", "Web Development", "Content Writing", "UI/UX Design", "Digital Marketing"],
    description: "Manage client requirements, tasks, revisions, deadlines, and scope changes.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Agencies",
    description: "Manage multiple clients, projects, team members, requirements, and approvals.",
    icon: Building2,
  },
  {
    title: "College & School Events",
    examples: ["Hackathons", "Workshops", "Symposiums", "Culturals", "Seminars"],
    description: "Track registrations, payments, tasks, participants, sponsors, certificates, and event requirements.",
    icon: CalendarRange,
  },
  {
    title: "Organizations",
    description: "Manage internal projects, campaigns, activities, deadlines, and changing requirements.",
    icon: Users,
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center" data-animate="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Use cases</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            One platform. Different kinds of work.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {cards.map(({ title, description, examples, icon: Icon }) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-animate="fade-up">
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <Sparkles className="h-4 w-4 text-slate-300" />
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-slate-900">{title}</h3>
              {examples && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {examples.map((example) => (
                    <span key={example} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {example}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-5 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button asChild>
            <Link href="/signup">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
