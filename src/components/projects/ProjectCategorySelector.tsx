"use client";

import { ArrowRight, BriefcaseBusiness, Check, Compass, Sparkles } from "lucide-react";
import { PROJECT_CATEGORIES, type ProjectKind } from "@/lib/constants/projectCatalog";

export function ProjectKindSelector({
  value,
  onChange,
}: {
  value: ProjectKind | "";
  onChange: (value: ProjectKind) => void;
}) {
  const choices: { value: ProjectKind; title: string; description: string; icon: typeof BriefcaseBusiness; examples: string }[] = [
    {
      value: "freelancer",
      title: "Freelancer project",
      description: "Client work and professional services you deliver for someone else.",
      icon: BriefcaseBusiness,
      examples: "Development, design, writing, marketing, data & AI",
    },
    {
      value: "personal",
      title: "Personal project",
      description: "Your own plans, learning, events, celebrations, or community activities.",
      icon: Compass,
      examples: "School, college, festivals, sports, family & more",
    },
  ];

  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">What kind of project are you creating?</legend>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {choices.map(({ value: choice, title, description, icon: Icon, examples }) => {
          const selected = value === choice;
          return (
            <button
              key={choice}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(choice)}
              className={`group min-h-48 rounded-2xl border p-5 text-left transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                selected
                  ? "border-brand bg-accent shadow-sm ring-1 ring-brand/20"
                  : "border-border bg-card hover:border-brand/40 hover:shadow-md"
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-brand"><Icon aria-hidden="true" className="size-5" /></span>
                {selected ? <Check aria-hidden="true" className="size-5 text-brand" /> : <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />}
              </span>
              <span className="mt-5 block text-lg font-semibold text-foreground">{title}</span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">{description}</span>
              <span className="mt-3 block text-xs font-medium text-brand">{examples}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ProjectCategorySelector({
  kind,
  categoryId,
  subcategory,
  onChangeCategory,
  onChangeSubcategory,
}: {
  kind: ProjectKind;
  categoryId: string;
  subcategory: string;
  onChangeCategory: (categoryId: string) => void;
  onChangeSubcategory: (subcategory: string) => void;
}) {
  const categories = PROJECT_CATEGORIES[kind];
  const selectedCategory = categories.find((category) => category.id === categoryId);

  return (
    <div>
      <div>
        <h2 className="text-sm font-medium text-foreground">Choose a category</h2>
        <p className="mt-1 text-sm text-muted-foreground">Select the area that best describes this project.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const selected = category.id === categoryId;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChangeCategory(category.id)}
                className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  selected ? "border-brand bg-accent text-accent-foreground" : "border-border bg-card text-foreground hover:border-brand/40 hover:bg-muted"
                }`}
              >
                <span>{category.label}</span>
                {selected && <Check aria-hidden="true" className="size-4 shrink-0 text-brand" />}
              </button>
            );
          })}
        </div>
      </div>

      {selectedCategory && (
        <fieldset className="mt-7 border-t border-border pt-6">
          <legend className="text-sm font-medium text-foreground">What are you planning?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {selectedCategory.items.map((item) => {
              const selected = subcategory === item;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChangeSubcategory(item)}
                  className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    selected ? "border-brand bg-accent font-medium text-accent-foreground" : "border-border bg-card text-foreground hover:border-brand/40 hover:bg-muted"
                  }`}
                >
                  {selected ? <Check aria-hidden="true" className="size-4 shrink-0 text-brand" /> : <span className="size-4 shrink-0 rounded-full border border-input" aria-hidden="true" />}
                  {item}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand/15 bg-accent/60 p-4 text-sm text-muted-foreground">
        <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
        <p>ScopeSync will use your selected category and project details to prepare a tailored planning draft. You can review it before creating the project.</p>
      </div>
    </div>
  );
}
