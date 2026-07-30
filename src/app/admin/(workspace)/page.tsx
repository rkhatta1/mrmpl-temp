export default function AdminOverviewPage() {
  return (
    <section className="flex flex-1 flex-col">
      <div className="flex max-w-3xl flex-col gap-3">
        <p className="text-sm font-medium text-primary">Workspace foundation</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance md:text-3xl">
          The MRMPL admin workspace is ready for its first workflow.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground text-pretty">
          Navigation, responsive behavior, subdomain routing, and the shared UI
          foundation are in place. Product management, pricing, enquiries, and
          site controls can now be added one focused module at a time.
        </p>
      </div>

      <dl className="mt-10 grid border-y md:grid-cols-3 md:divide-x">
        <div className="flex flex-col gap-2 py-5 md:px-5 md:first:pl-0">
          <dt className="text-sm font-medium">Routing</dt>
          <dd className="text-sm leading-6 text-muted-foreground">
            Admin subdomain requests resolve into an isolated App Router
            segment.
          </dd>
        </div>
        <div className="flex flex-col gap-2 border-t py-5 md:border-t-0 md:px-5">
          <dt className="text-sm font-medium">Interface</dt>
          <dd className="text-sm leading-6 text-muted-foreground">
            The shadcn sidebar collapses to icons and becomes an off-canvas
            sheet on mobile.
          </dd>
        </div>
        <div className="flex flex-col gap-2 border-t py-5 md:border-t-0 md:px-5 md:last:pr-0">
          <dt className="text-sm font-medium">Security</dt>
          <dd className="text-sm leading-6 text-muted-foreground">
            Authentication is intentionally deferred and remains the next
            production-critical layer.
          </dd>
        </div>
      </dl>

      <p className="mt-6 max-w-prose text-base leading-7 text-muted-foreground">
        This shell is currently unprotected. Do not expose write operations or
        sensitive information until authorization is enforced in every admin
        workflow.
      </p>
    </section>
  );
}
