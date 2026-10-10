import { BookOpenText, Briefcase, CheckCheck, FileText, FolderKanban, History, ListTodo, Users } from "lucide-react";
import { Container } from "@/components/layout/Container";

const features = [
  { title: "Requirements", description: "Define and organize the original project requirements.", icon: BookOpenText },
  { title: "Tasks", description: "Turn requirements into clear tasks and track progress.", icon: ListTodo },
  { title: "Change Management", description: "Record and manage new project requests and changes.", icon: CheckCheck },
  { title: "Scope Tracking", description: "Compare the current project with the original approved scope.", icon: FolderKanban },
  { title: "Deadlines", description: "Keep important tasks and project milestones visible.", icon: Briefcase },
  { title: "Project History", description: "See what changed, when it changed, and who approved it.", icon: History },
  { title: "Documents", description: "Keep project agreements and important documents organized.", icon: FileText },
  { title: "Team Management", description: "Assign responsibilities and keep everyone aligned.", icon: Users },
];

export function FeaturesSection() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center" data-animate="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Core features</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            Everything you need to stay in control.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-animate="fade-up">
              <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
