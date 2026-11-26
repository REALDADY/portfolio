import { imageSizes, type Project } from "./project-data";

type VisualProps = { project: Project; compact?: boolean; priority?: boolean; full?: boolean };

const hostOf = (url?: string) => (url ? new URL(url).host.replace(/^www\./, "") : null);

/**
 * Real captures only. Public work is shown as a screenshot of the actual site
 * in a browser frame; private and internal systems get a spec panel built from
 * the project's real scope — never a staged or generated image.
 */
export function ProjectVisual({ project, compact = false, priority = false, full = false }: VisualProps) {
  if (project.appScreens?.length) {
    const screens = full ? project.appScreens : project.appScreens.slice(0, compact ? 3 : 4);
    return (
      <figure className={`phones${compact ? " is-compact" : ""}${full ? " is-full" : ""}`}>
        <ul>
          {screens.map((screen) => (
            <li key={screen.src}>
              <img src={screen.src} alt={screen.alt} width={600} height={1304} loading={priority ? "eager" : "lazy"} decoding="async" />
            </li>
          ))}
        </ul>
        {full && <figcaption>Screens from the live app — scroll for more</figcaption>}
      </figure>
    );
  }

  if (project.coverAsset) {
    const size = imageSizes[project.coverAsset];
    return (
      <figure className={`shot${compact ? " is-compact" : ""}`}>
        <div className="shot-bar" aria-hidden="true">
          <span /><span /><span />
          <b>{hostOf(project.liveUrl ?? project.relatedUrl) ?? project.shortTitle}</b>
        </div>
        <img
          src={project.coverAsset}
          alt={project.coverAlt ?? `${project.title} website`}
          width={size?.width}
          height={size?.height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      </figure>
    );
  }

  const scope = project.capabilities.slice(0, compact ? 4 : 8);
  return (
    <figure className={`spec${compact ? " is-compact" : ""}`} aria-label={`${project.title} — system scope`}>
      <div className="spec-head">
        <span>{project.category}</span>
        <span>{project.statusKind === "private" ? "Private system" : project.status}</span>
      </div>
      <p className="spec-title">{project.projectType}</p>
      <ul className="spec-list">
        {scope.map((item) => <li key={item}>{item}</li>)}
      </ul>
      {!compact && <p className="spec-stack">{project.technologies.slice(0, 6).join(" · ")}</p>}
    </figure>
  );
}
