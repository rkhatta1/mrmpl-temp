export default function SitePageLoading() {
  return (
    <div
      aria-label="Loading page"
      aria-live="polite"
      className="min-h-[60vh] px-6 pb-16 pt-32"
      role="status"
    >
      <div className="mx-auto max-w-7xl animate-pulse space-y-8">
        <div className="space-y-4">
          <div className="h-4 w-28 rounded-full bg-emerald-100" />
          <div className="h-10 max-w-xl rounded-xl bg-slate-200" />
          <div className="h-5 max-w-2xl rounded-lg bg-slate-100" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              className="aspect-[4/3] rounded-2xl bg-slate-100"
              key={item}
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading page…</span>
    </div>
  );
}
