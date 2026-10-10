import type { ProjectType } from "@/types";

export type ProjectKind = "personal" | "freelancer";

export type ProjectCategory = {
  id: string;
  label: string;
  items: string[];
};

export const PROJECT_CATEGORIES: Record<ProjectKind, ProjectCategory[]> = {
  freelancer: [
    {
      id: "technology-development",
      label: "Technology & Development",
      items: [
        "Website development", "Frontend development", "Backend development", "Full-stack development",
        "Mobile app development", "Software development", "API development", "WordPress development",
        "Shopify development", "Database development", "Cloud/DevOps", "AI/ML development",
        "Chatbot development", "Automation/n8n workflows", "Cybersecurity",
      ],
    },
    {
      id: "design-creative",
      label: "Design & Creative",
      items: [
        "UI/UX design", "Graphic design", "Logo design", "Brand identity", "Web design", "App design",
        "Presentation design", "3D design", "Illustration", "Animation", "Video editing",
        "Motion graphics", "Photo editing",
      ],
    },
    {
      id: "writing-content",
      label: "Writing & Content",
      items: [
        "Content writing", "Copywriting", "Blog writing", "Technical writing", "Documentation",
        "SEO writing", "Script writing", "Proofreading", "Translation", "Resume writing",
      ],
    },
    {
      id: "marketing-business",
      label: "Marketing & Business",
      items: [
        "Digital marketing", "SEO", "Social media management", "Social media marketing", "Email marketing",
        "Google Ads", "Lead generation", "Market research", "Business consulting", "Sales consulting",
        "Virtual assistance",
      ],
    },
    {
      id: "data-ai",
      label: "Data & AI",
      items: [
        "Data analysis", "Data visualization", "Machine learning", "Generative AI", "RAG development",
        "AI agent development", "Data cleaning", "Excel/Google Sheets", "Power BI", "Tableau",
        "Python data projects",
      ],
    },
  ],
  personal: [
    {
      id: "education-professional-services",
      label: "Education & Professional Services",
      items: [
        "Online tutoring", "Programming tutoring", "Technical training", "Career consulting",
        "Interview preparation", "Research assistance", "Academic projects", "Presentation preparation",
      ],
    },
    {
      id: "other-freelance-services",
      label: "Other Freelance Services",
      items: [
        "Voice-over", "Music production", "Audio editing", "Transcription", "Photography",
        "Video production", "Event services", "Customer support", "Project management",
      ],
    },
    {
      id: "schools",
      label: "Schools",
      items: [
        "Annual Day", "Sports Day", "Cultural Day / School Fest", "Science Exhibition", "Project Exhibition",
        "Teachers' Day", "Children's Day", "Independence Day", "Republic Day", "Farewell",
        "Parent-Teacher Meeting", "Educational Workshop",
      ],
    },
    {
      id: "colleges",
      label: "Colleges",
      items: [
        "College Fest", "Technical Fest", "Cultural Fest", "Symposium", "Hackathon", "Project Expo",
        "Sports Meet", "Freshers' Day", "Farewell", "Graduation / Convocation", "Alumni Meet",
        "Workshop", "Seminar / Guest Lecture", "Placement / Career Fair", "Job / Internship Fair",
      ],
    },
    {
      id: "festivals-celebrations",
      label: "Major Festivals & Celebrations",
      items: [
        "New Year", "Pongal", "Diwali", "Christmas", "Eid", "Holi", "Onam", "Navaratri",
        "Independence Day", "Republic Day", "Women's Day", "Environment Day", "International Yoga Day",
      ],
    },
    {
      id: "sports",
      label: "Sports",
      items: [
        "Cricket Tournament", "Football Tournament", "Volleyball Tournament", "Basketball Tournament",
        "Badminton Tournament", "Athletics Meet", "Marathon", "E-sports Tournament", "School Sports Day",
        "College Sports Meet", "Corporate Sports Day",
      ],
    },
    {
      id: "entertainment-cultural",
      label: "Entertainment & Cultural",
      items: [
        "Music Concert", "Dance Program", "Cultural Program", "Talent Show", "Fashion Show",
        "Art Exhibition", "Photography Exhibition", "Theatre / Drama", "Stand-up Comedy", "Film Festival",
        "Open Mic",
      ],
    },
    {
      id: "personal-events",
      label: "Personal Events",
      items: [
        "Wedding", "Engagement", "Reception", "Birthday", "Anniversary", "Baby Shower", "Housewarming",
        "Graduation Party", "Family Reunion",
      ],
    },
  ],
};

const FREELANCER_TYPE_MAP: Record<string, ProjectType> = {
  "Website development": "web-development",
  "Web design": "web-development",
  "Frontend development": "web-development",
  "Backend development": "software-development",
  "Full-stack development": "software-development",
  "Mobile app development": "mobile-app-development",
  "UI/UX design": "ui-ux-design",
  "App design": "ui-ux-design",
  "Graphic design": "graphic-design",
  "Logo design": "graphic-design",
  "Brand identity": "graphic-design",
  "Video editing": "video-editing",
  "Motion graphics": "video-editing",
  "Video production": "video-editing",
  Photography: "photography",
  "Photo editing": "photography",
  "Content writing": "content-writing",
  Copywriting: "content-writing",
  "Blog writing": "content-writing",
  "Technical writing": "content-writing",
  Documentation: "content-writing",
  "SEO writing": "content-writing",
  "Digital marketing": "digital-marketing",
  SEO: "digital-marketing",
  "Social media management": "social-media",
  "Social media marketing": "social-media",
  "Data analysis": "data-analytics",
  "Data visualization": "data-analytics",
  "Data cleaning": "data-analytics",
  "Excel/Google Sheets": "data-analytics",
  "Power BI": "data-analytics",
  Tableau: "data-analytics",
  "Python data projects": "data-analytics",
  "Event services": "organization-event",
  "Project management": "organization-project",
};

export function getProjectTypeForSelection(
  kind: ProjectKind,
  categoryId: string,
  subcategory: string,
): ProjectType {
  if (kind === "freelancer") {
    return FREELANCER_TYPE_MAP[subcategory] ?? ({
      "technology-development": "software-development",
      "design-creative": "graphic-design",
      "writing-content": "content-writing",
      "marketing-business": "digital-marketing",
      "data-ai": "data-analytics",
    } satisfies Record<string, ProjectType>)[categoryId] ?? "other";
  }
  if (categoryId === "schools") return "school-event";
  if (categoryId === "colleges") {
    return subcategory === "Hackathon" ? "hackathon" :
      subcategory === "Workshop" ? "workshop" :
      subcategory === "Seminar / Guest Lecture" ? "seminar" :
      subcategory === "Technical Fest" ? "hackathon" : "college-event";
  }
  if (categoryId === "education-professional-services") {
    if (subcategory === "Programming tutoring" || subcategory === "Technical training") return "software-development";
    return subcategory.includes("tutoring") || subcategory === "Academic projects" ? "other" : "organization-project";
  }
  if (categoryId === "other-freelance-services") return FREELANCER_TYPE_MAP[subcategory] ?? "organization-project";
  if (categoryId === "sports" || categoryId === "festivals-celebrations" ||
      categoryId === "entertainment-cultural" || categoryId === "personal-events") return "organization-event";
  return "other";
}

export function isEventProjectCategory(categoryId: string, subcategory?: string): boolean {
  return ["schools", "colleges", "festivals-celebrations", "sports", "entertainment-cultural", "personal-events"].includes(categoryId) ||
    (categoryId === "other-freelance-services" && subcategory === "Event services");
}
