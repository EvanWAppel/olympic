import type { Milestone } from "@/lib/changelog"

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}

export function ChangelogView({ milestones }: { milestones: Milestone[] }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>
        <p className="text-sm text-muted-foreground">What has shipped, newest first.</p>
      </div>
      <ol className="flex flex-col gap-8">
        {milestones.map((m) => (
          <li key={m.date + m.title}>
            <article aria-labelledby={`m-${m.date}`} className="flex flex-col gap-2">
              <h2 id={`m-${m.date}`} className="text-lg font-semibold tracking-tight">
                {m.version && (
                  <span className="mr-2 font-mono text-sm text-muted-foreground">{m.version}</span>
                )}
                {m.title}
              </h2>
              <time dateTime={m.date} className="text-sm text-muted-foreground">
                {formatDate(m.date)}
              </time>
              <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground">
                {m.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ol>
    </main>
  )
}
