"use client";

import { PROJECT_TYPES } from "@/lib/constants";
import type { ProjectType } from "@/types";
import { ProjectTypeCard } from "./ProjectTypeCard";

export function ProjectTypeSelector({
  value,
  onChange,
}: {
  value: ProjectType | "";
  onChange: (value: ProjectType) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Choose a project type</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECT_TYPES.map((item) => (
          <ProjectTypeCard
            key={item.value}
            value={item.value}
            selected={value === item.value}
            onSelect={onChange}
          />
        ))}
      </div>
    </fieldset>
  );
}
