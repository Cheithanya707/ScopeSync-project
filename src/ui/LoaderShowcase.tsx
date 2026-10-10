"use client";

import { useState } from "react";
import { BrandLoader } from "./BrandLoader";
import { InlineLoader } from "./InlineLoader";
import { LogoMark } from "./brand/LogoMark";

export function LoaderShowcase() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <section className="loader-showcase" aria-labelledby="loader-showcase-title">
      <div className="loader-showcase__heading">
        <div>
          <p className="loader-showcase__eyebrow">LOADING STATES</p>
          <h2 id="loader-showcase-title">A calm signal while things sync.</h2>
        </div>
        {isDevelopment ? (
          <button
            aria-expanded={previewOpen}
            className="loader-showcase__toggle"
            onClick={() => setPreviewOpen((open) => !open)}
            type="button"
          >
            {previewOpen ? "Close loader preview" : "Preview loaders"}
          </button>
        ) : null}
      </div>
      <div className="loader-showcase__variants">
        <div className="loader-showcase__variant">
          <span>Compact route mark</span>
          <LogoMark animated className="brand-logo--route" size={48} />
        </div>
        <div className="loader-showcase__variant">
          <span>Inline activity</span>
          <InlineLoader label="Loading preview" size={24} />
        </div>
      </div>
      {isDevelopment && previewOpen ? (
        <div className="loader-showcase__preview">
          <BrandLoader preview />
        </div>
      ) : null}
    </section>
  );
}
