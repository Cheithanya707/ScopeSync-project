import { notFound } from "next/navigation";

// Every real project section (requirements, tasks, changes, calendar,
// documents, payments, people, event, sharing, edit) has its own dedicated
// route, which Next.js matches before this dynamic segment. Anything that
// reaches this file is an unknown section, so it gets a real 404 instead of
// a "coming soon" placeholder.
export default function UnknownProjectSectionPage() {
  notFound();
}
