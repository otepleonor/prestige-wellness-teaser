import { projectCommandCenter } from "@galley/application";
import { fetchCommandCenterSnapshot } from "@galley/github-adapter";
import "./command-center.css";
export const dynamic = "force-dynamic";
function Badge({ value }: { value: string }) {
  return (
    <span className={`badge badge--${value.replace(/[^a-z]/g, "")}`}>
      {value}
    </span>
  );
}
function relativeTime(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp > Date.now()) return "unknown";
  const minutes = Math.round((Date.now() - timestamp) / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}
export default async function CommandCenterPage() {
  const token = process.env.GITHUB_COMMAND_CENTER_TOKEN;
  if (!token)
    return (
      <main className="cc shell">
        <section className="notice">
          <strong>GitHub connection required.</strong>
          <p>Connect GitHub to display current work.</p>
        </section>
      </main>
    );
  const view = projectCommandCenter(
    await fetchCommandCenterSnapshot({
      owner: "otepleonor",
      repo: "galley",
      token,
    }),
  );
  return (
    <main className="cc shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">GALLEY / COMMAND CENTER</span>
          <h1>Development Progress</h1>
          <p className="sub">
            Ongoing work, owners, validation, and PR health.
          </p>
        </div>
        <div className="source">
          <Badge value={view.stale ? "stale" : "live"} />
          <span>Updated {relativeTime(view.fetchedAt)}</span>
        </div>
      </header>
      {!view.complete && (
        <section className="notice">
          <strong>Some GitHub data could not be loaded.</strong>
          <p>{view.errors.join(" · ")}</p>
        </section>
      )}
      <section className="metrics">
        <article>
          <span>Ongoing tasks</span>
          <strong>{view.counts.active}</strong>
        </article>
        <article>
          <span>In review</span>
          <strong>{view.counts.review}</strong>
        </article>
        <article>
          <span>Reported blocked</span>
          <strong>{view.counts.blocked}</strong>
        </article>
        <article>
          <span>CI passing</span>
          <strong>{view.counts.healthy}</strong>
          <small>active work with green checks</small>
        </article>
      </section>
      <section className="panel">
        <div className="panelhead">
          <div>
            <span className="eyebrow">ONGOING WORK</span>
            <h2>Current tasks</h2>
          </div>
          <span>{view.active.length} tasks</span>
        </div>
        <div className="worklist">
          {view.active.length === 0 && (
            <p className="empty">
              {view.complete
                ? "No ongoing tasks reported by GitHub."
                : "Ongoing work is unavailable until GitHub data is complete."}
            </p>
          )}
          {view.active.map((item) => (
            <a className="work" href={item.url} key={item.number}>
              <div className="workmain">
                <div className="worktitle">
                  <strong>{item.galId}</strong>
                  <h3>{item.title.replace(/^GAL-\d+\s*[—-]\s*/, "")}</h3>
                </div>
                <p>
                  {item.module ?? "unclassified"} ·{" "}
                  {item.record?.agent ?? "unknown owner"} · updated{" "}
                  {relativeTime(item.updatedAt)}
                  {item.stale ? " · stale owner update" : ""}
                </p>
                {item.metadataInvalid && (
                  <p className="blockedBy">
                    Invalid task metadata; check the issue record.
                  </p>
                )}
                {item.record?.branch && <p>Branch: {item.record.branch}</p>}
                {item.record?.nextAction && (
                  <p className="next">Next: {item.record.nextAction}</p>
                )}
                {item.record?.blocker && (
                  <p className="blockedBy">Blocker: {item.record.blocker}</p>
                )}
              </div>
              <div className="workmeta">
                <Badge value={item.status} />
                <span>
                  Validation: {item.record?.validation?.state ?? "unknown"}
                </span>
                <span>
                  PR:{" "}
                  {item.pr
                    ? `#${item.pr.number} · ${item.pr.checks}`
                    : item.record?.pullRequest
                      ? "linked, data unavailable"
                      : "none recorded"}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
      <footer>Read-only projection · GitHub remains the source of truth</footer>
    </main>
  );
}
