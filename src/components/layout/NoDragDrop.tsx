"use client";

import type { ReactNode, DragEvent } from "react";

function preventDragDrop(event: DragEvent<HTMLDivElement>) {
  event.preventDefault();
}

export function NoDragDrop({ children }: { children: ReactNode }) {
  return (
    <div
      onDragStartCapture={preventDragDrop}
      onDragOverCapture={preventDragDrop}
      onDropCapture={preventDragDrop}
    >
      {children}
    </div>
  );
}
