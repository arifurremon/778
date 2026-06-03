/** Route-level loading skeletons for consumer pages (app route loading.tsx files). */
export function PageHeaderSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="h-3 w-28 bg-muted/60 animate-pulse rounded-full" />
      <div className="h-9 w-56 md:w-72 bg-muted/60 animate-pulse rounded-xl" />
      <div className="h-4 w-40 bg-muted/40 animate-pulse rounded-full" />
    </div>
  );
}

export function PostFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/50 bg-card/40 p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-2.5 w-20 rounded bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
          </div>
          <div className="flex gap-4 pt-2">
            <div className="h-8 w-20 rounded-lg bg-muted" />
            <div className="h-8 w-20 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}

export function CommunityPageLoading() {
  return (
    <div className="min-h-full bg-muted/30 dark:bg-background/20">
      <div className="max-w-2xl mx-auto py-10 px-4 md:px-0 space-y-10">
        <PageHeaderSkeleton />
        <div className="h-28 rounded-2xl bg-card/50 border border-border/50 animate-pulse" />
        <div className="flex flex-col gap-6">
          <PostFeedSkeleton count={3} />
        </div>
      </div>
    </div>
  );
}

export function ProfilePageLoading() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 md:px-0 space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="w-24 h-24 rounded-2xl bg-muted shrink-0" />
        <div className="flex-1 space-y-3 w-full">
          <div className="h-7 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-32 bg-muted/70 rounded-full" />
          <div className="h-4 w-full max-w-md bg-muted/50 rounded-full" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 bg-muted/60 rounded-xl" />
        ))}
      </div>
      <PostFeedSkeleton count={2} />
    </div>
  );
}

export function ShopGridPageLoading() {
  return (
    <div className="p-6 md:p-10 space-y-10">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden animate-pulse"
          >
            <div className="h-40 bg-muted" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 bg-muted rounded-lg" />
              <div className="h-3 w-1/2 bg-muted/70 rounded-full" />
              <div className="h-8 w-full bg-muted/50 rounded-xl mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchPageLoading() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeaderSkeleton />
        <div className="flex gap-3">
          <div className="h-9 w-40 bg-muted/60 animate-pulse rounded-full" />
          <div className="h-9 w-40 bg-muted/60 animate-pulse rounded-full" />
        </div>
      </div>
      <div className="h-10 w-full max-w-md bg-muted/50 animate-pulse rounded-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl border border-border/50 bg-card/30 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function DashboardPageLoading() {
  return (
    <div className="p-6 md:p-10 space-y-12 animate-pulse">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[1px] bg-muted" />
          <div className="h-3 w-32 bg-muted/60 rounded-full" />
        </div>
        <div className="h-12 md:h-14 w-full max-w-2xl bg-muted/60 rounded-xl" />
        <div className="h-5 w-full max-w-xl bg-muted/40 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-[2rem] border border-border/50 bg-card/30"
          />
        ))}
      </div>
      <div className="h-80 rounded-[2.5rem] border border-border/50 bg-card/20" />
    </div>
  );
}

export function ActivityPageLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8 animate-pulse">
      <PageHeaderSkeleton />
      <div className="h-11 w-full max-w-2xl bg-muted/50 rounded-full" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-2xl border border-border/50 bg-card/30"
          />
        ))}
      </div>
    </div>
  );
}

export function ServicesPageLoading() {
  return (
    <div className="p-6 md:p-10 space-y-8 animate-pulse">
      <PageHeaderSkeleton />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-28 bg-muted/50 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-2xl border border-border/50 bg-card/30"
          />
        ))}
      </div>
    </div>
  );
}

export function NeighboursPageLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8 animate-pulse">
      <PageHeaderSkeleton />
      <div className="h-11 w-full bg-muted/50 rounded-xl" />
      <div className="h-10 w-64 bg-muted/40 rounded-full" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/20"
          >
            <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded-lg" />
              <div className="h-3 w-24 bg-muted/60 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsPageLoading() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-6 space-y-8 animate-pulse">
      <PageHeaderSkeleton />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-3xl border border-border/50 bg-card/20"
        />
      ))}
    </div>
  );
}

export function DirectoryPageLoading() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeaderSkeleton />
        <div className="h-11 w-full md:w-80 bg-muted/50 rounded-xl" />
      </div>
      <div className="h-10 w-96 bg-muted/40 rounded-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl border border-border/50 bg-card/30" />
        ))}
      </div>
    </div>
  );
}

export function AboutPageLoading() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-8 animate-pulse">
      <PageHeaderSkeleton />
      <div className="h-11 w-full max-w-lg bg-muted/50 rounded-full" />
      <div className="h-64 rounded-3xl border border-border/50 bg-card/20" />
    </div>
  );
}

export function MessagesPageLoading() {
  return (
    <div className="h-[calc(100vh-80px)] flex animate-pulse">
      <div className="w-full md:w-80 border-r border-border/30 p-4 space-y-3">
        <PageHeaderSkeleton className="md:hidden" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-muted rounded-full" />
              <div className="h-2.5 w-full bg-muted/60 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:flex flex-1 items-center justify-center bg-muted/10">
        <div className="h-4 w-32 bg-muted/40 rounded-full" />
      </div>
    </div>
  );
}

export function EmergencyPageLoading() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeaderSkeleton />
        <div className="h-11 w-full md:w-80 bg-muted/50 rounded-xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-muted/50 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-border/50 bg-card/30"
          />
        ))}
      </div>
    </div>
  );
}
