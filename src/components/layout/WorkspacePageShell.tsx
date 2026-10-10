"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ActivitySyncNotice } from "@/components/activity/ActivitySyncNotice";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  getIsLocalDemoMode,
  isLocalDataAvailable,
  subscribeToLocalDemoMode,
} from "@/lib/localData";
import { SetupPanel } from "@/src/ui/primitives";

export function WorkspacePageShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLocalDemoMode = useSyncExternalStore(
    subscribeToLocalDemoMode,
    getIsLocalDemoMode,
    () => false,
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="workspace-content min-h-screen min-w-0 pt-16">
          <main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            {!isLocalDataAvailable && !(isLocalDemoMode && pathname === "/dashboard")
              ? <SetupPanel />
              : <>{!isLocalDemoMode && <ActivitySyncNotice />}{children}</>}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
