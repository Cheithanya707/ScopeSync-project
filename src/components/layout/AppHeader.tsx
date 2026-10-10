"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bot,
  CircleHelp,
  FolderKanban,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  PlugZap,
  Search,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { UserProfileMenu } from "@/components/layout/UserProfileMenu";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getIsLocalDemoMode, subscribeToLocalDemoMode } from "@/lib/localData";
import { Logo } from "@/src/ui/brand/Logo";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navigationLinks: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/projects/find", label: "Find projects", icon: Search },
  { href: "/projects/upload", label: "Upload project", icon: Plus },
  { href: "/ai-insights", label: "Chatbot", icon: Bot },
  { href: "/mcp", label: "Integrations", icon: PlugZap },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: CircleHelp },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/projects") {
    const projectSection = pathname.split("/")[2];
    return pathname === href || (
      pathname.startsWith(`${href}/`) &&
      projectSection !== "find" &&
      projectSection !== "upload" &&
      projectSection !== "applications" &&
      projectSection !== "my-applications" &&
      projectSection !== "new"
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLinks({
  pathname,
  expanded,
  onNavigate,
}: {
  pathname: string;
  expanded: boolean;
  onNavigate?: () => void;
}) {
  return navigationLinks.map(({ href, label, icon: Icon }) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        aria-label={label}
        title={expanded ? undefined : label}
        onClick={onNavigate}
        className={`app-rail__link${active ? " is-active" : ""}${expanded ? " is-expanded" : ""}`}
      >
        <Icon aria-hidden="true" size={19} />
        <span>{label}</span>
      </Link>
    );
  });
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const workspace = useWorkspace();
  const isLocalDemoMode = useSyncExternalStore(
    subscribeToLocalDemoMode,
    getIsLocalDemoMode,
    () => false,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--app-rail-width", expanded ? "15rem" : "4.5rem");
  }, [expanded]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) dialog.showModal();
    if (!mobileOpen && dialog.open) dialog.close();
  }, [mobileOpen]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [mobileOpen]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) {
      setSearchMessage("Enter a page name or project search term.");
      searchRef.current?.focus();
      return;
    }
    const term = query.toLocaleLowerCase();
    const match = navigationLinks.find((item) => item.label.toLocaleLowerCase().includes(term));
    router.push(match?.href ?? `/projects?q=${encodeURIComponent(query)}`);
    setSearch("");
    setSearchMessage("");
  };

  return (
    <>
      <aside className="app-rail" data-expanded={expanded}>
        <div className="app-rail__brand">
          <Logo
            className="app-rail__brand-logo"
            href="/dashboard"
            layout={expanded ? "horizontal" : "mark-only"}
            size={expanded ? "sm" : "md"}
          />
          <button
            type="button"
            className="app-rail__toggle"
            aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
            title={expanded ? "Collapse navigation" : "Expand navigation"}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
        </div>
        <nav aria-label="Main navigation" className="app-rail__nav">
          <NavigationLinks pathname={pathname} expanded={expanded} />
        </nav>
        <div className="app-rail__footer"><span className="app-local-pill" title={isLocalDemoMode ? "Illustrative sample data; changes are not saved" : "This workspace uses local mode"}>{isLocalDemoMode ? "Demo mode" : "Local mode"}</span></div>
      </aside>

      <header className="app-topbar">
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="app-topbar__menu"
        >
          <Menu size={19} />
        </button>
        <div className="app-context">
          <Link href="/settings/workspace" className="app-context__switcher" title="Open workspace settings">
            <span className="app-context__mark">{(workspace.workspace?.name ?? "W").slice(0, 1).toUpperCase()}</span>
            <span className="app-context__labels">
              <small>WORKSPACE</small>
              <b>{workspace.workspace?.name ?? "Your workspace"}</b>
            </span>
          </Link>
          <span className="app-context__divider" aria-hidden="true">/</span>
          <Link href="/projects" className="app-context__project">All projects</Link>
        </div>
        <form className="app-search" role="search" onSubmit={submitSearch}>
          <Search aria-hidden="true" size={16} />
          <input
            ref={searchRef}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSearchMessage("");
            }}
            aria-label="Search pages or projects"
            aria-describedby={searchMessage ? "app-search-message" : undefined}
            placeholder="Search pages or projects"
          />
          <kbd>Ctrl+K</kbd>
        </form>
        {searchMessage ? <span id="app-search-message" role="status" className="sr-only">{searchMessage}</span> : null}
        <div className="app-topbar__actions">
          <NotificationCenter />
          <UserProfileMenu />
        </div>
      </header>

      <dialog
        ref={dialogRef}
        aria-label="Main navigation"
        onClose={() => setMobileOpen(false)}
        onCancel={() => setMobileOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMobileOpen(false);
        }}
        className="app-mobile-dialog"
      >
        <div className="app-mobile-dialog__panel">
          <div className="app-mobile-dialog__header">
            <Logo className="app-mobile-dialog__brand" href="/dashboard" size="sm" />
            <button type="button" aria-label="Close navigation menu" autoFocus onClick={() => setMobileOpen(false)}><X size={19} /></button>
          </div>
          <nav aria-label="Mobile navigation">
            <NavigationLinks pathname={pathname} expanded onNavigate={() => setMobileOpen(false)} />
          </nav>
          <span className="app-local-pill">{isLocalDemoMode ? "Demo mode" : "Local mode"}</span>
        </div>
      </dialog>
    </>
  );
}
