import { Skeleton } from "@/src/ui/primitives";
import { LogoMark } from "@/src/ui/brand/LogoMark";

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading ScopeSync"
      className="route-loader"
      role="status"
    >
      <LogoMark animated className="brand-logo--route" size={48} />
      <div className="route-loader__cards" aria-hidden="true">
        <section className="route-loader__card">
          <Skeleton className="w-1/3" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </section>
        <section className="route-loader__card">
          <Skeleton className="w-1/2" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </section>
      </div>
    </main>
  );
}
