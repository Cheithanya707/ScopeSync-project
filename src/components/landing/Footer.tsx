import { Container } from "@/components/layout/Container";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="py-10">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">S</span>
              ScopeSync
            </div>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600">
              Manage requirements. Understand changes. Stay in control.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Product</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><a href="#features" className="hover:text-slate-900">Features</a></li>
              <li><a href="#ai" className="hover:text-slate-900">AI</a></li>
              <li><a href="#how-it-works" className="hover:text-slate-900">How It Works</a></li>
              <li><a href="#use-cases" className="hover:text-slate-900">Use Cases</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Resources</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-slate-900">Documentation</a></li>
              <li><a href="#" className="hover:text-slate-900">Help Center</a></li>
              <li><a href="#" className="hover:text-slate-900">Blog</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Company</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-slate-900">About</a></li>
              <li><a href="#" className="hover:text-slate-900">Contact</a></li>
              <li><a href="#" className="hover:text-slate-900">Privacy</a></li>
              <li><a href="#" className="hover:text-slate-900">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          © 2026 ScopeSync. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
