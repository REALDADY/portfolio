"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  featuredProjects,
  getProject,
  labExperiments,
  projectCategories,
  projects,
  type Project,
  type ProjectCategory,
} from "./project-data";
import { ProjectVisual } from "./project-visual";
import { company, contact, headshot, mailtoLink, owner, profiles, routeSeo, whatsappLink } from "./site-config";
import { SITE_CONTENT_ID, useModal } from "./use-modal";
import { scrollToTarget, setScrollLock, useReveal } from "./motion";

type View = "home" | "work";
type Category = "All" | ProjectCategory;
type SectionId = "about" | "work" | "services" | "process" | "contact";

const navItems: Array<{ id: SectionId | "all-work"; label: string }> = [
  { id: "all-work", label: "Work" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "process", label: "Process" },
  { id: "contact", label: "Contact" },
];

const liveProjects = projects.filter((project) => project.liveUrl);

const services = [
  ["Web design & art direction", "Visual systems, typography and layouts designed for the brand and the screen — not adapted templates."],
  ["Front-end development", "Responsive, accessible interfaces in React and Next.js, with motion and 3D only where they help the product."],
  ["Full-stack products & APIs", "Web apps and APIs on Node, Express or FastAPI with PostgreSQL, authentication, payments and realtime features."],
  ["Business systems", "CRM, ticketing, HR, dispatch and inventory tools shaped around how the business actually operates."],
  ["Infrastructure & security", "Virtualisation, identity, network segmentation, endpoint hardening, backup and disaster recovery."],
  ["SAP Business One", "ERP workflows and HANA-backed reporting across inventory, warehouse, production and costing."],
] as const;

const processSteps = [
  ["Discovery", "Goals, users, constraints and what already exists — agreed before anything is designed."],
  ["Structure", "Information architecture, user journeys and the data model behind them."],
  ["Design", "Visual direction, interface design and the interaction details, reviewed together."],
  ["Build", "Front end, APIs, data and integrations — responsive, accessible and tested."],
  ["Launch & operate", "Hosting, security, monitoring and backups, so it keeps working after go-live."],
] as const;

const stackGroups: Array<[string, string[]]> = [
  ["Design", ["Web design", "UI / UX", "Motion design", "Bilingual EN / AR", "Responsive design"]],
  ["Front-end", ["React", "Next.js", "Vite", "Tailwind CSS", "Framer Motion", "React Three Fiber", "Electron"]],
  ["Back-end & data", ["Node.js", "Express", "FastAPI", "PostgreSQL", "PostGIS", "MySQL", "Supabase", "Socket.io"]],
  ["Infrastructure & security", ["Proxmox", "Windows Server", "Active Directory", "FortiGate", "VLANs", "Site-to-site VPN", "Microsoft Defender", "AppLocker"]],
  ["ERP & operations", ["SAP Business One", "SAP HANA", "SQL reporting", "Hikvision", "ZKTeco BioTime"]],
];

const briefTypes = ["Website", "Web app or product", "E-commerce store", "Internal business system", "Infrastructure & security", "SAP Business One", "Something else"];

const categorySlug = (category: Category) => category.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const categoryFromSlug = (slug: string | null) => projectCategories.find((category) => categorySlug(category) === slug) ?? "All";
const countIn = (category: Category) => (category === "All" ? projects.length : projects.filter((project) => project.category === category).length);

/** Let modified clicks (new tab, etc.) behave natively; handle plain clicks in-app. */
const isPlainClick = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

function Arrow({ direction = "right" }: { direction?: "right" | "up-right" | "left" }) {
  const paths = { right: "M4 10h12m-5-5 5 5-5 5", "up-right": "M6 14 14 6m-7 0h7v7", left: "M16 10H4m5-5-5 5 5 5" };
  return <svg className="icon" viewBox="0 0 20 20" aria-hidden="true"><path d={paths[direction]} /></svg>;
}

function SectionHead({ id, label, title, intro }: { id: string; label: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <header className="section-head" data-reveal>
      <p className="eyebrow">{label}</p>
      <h2 id={id}>{title}</h2>
      {intro && <p className="section-intro">{intro}</p>}
    </header>
  );
}

function StatusTag({ project }: { project: Project }) {
  return <span className={`status status-${project.statusKind}`}>{project.status}</span>;
}

function CaseLink({ project, onOpen, className, children }: { project: Project; onOpen: (slug: string) => void; className?: string; children: ReactNode }) {
  return (
    <a className={className} href={`#case/${project.slug}`} onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); onOpen(project.slug); }}>
      {children}
    </a>
  );
}

function ProjectActions({ project, onOpen }: { project: Project; onOpen: (slug: string) => void }) {
  return (
    <div className="project-actions">
      <CaseLink project={project} onOpen={onOpen} className="link-strong">
        Read the case study<span className="sr-only">: {project.shortTitle}</span> <Arrow />
      </CaseLink>
      {project.liveUrl && (
        <a className="link-quiet" href={project.liveUrl} target="_blank" rel="noopener noreferrer">
          {project.liveUrlLabel ?? "Visit site"}<span className="sr-only">: {project.shortTitle} (opens in a new tab)</span> <Arrow direction="up-right" />
        </a>
      )}
    </div>
  );
}

function CaseStudyDialog({ project, onClose, onOpen, onStartProject, onCopyLink }: {
  project: Project;
  onClose: () => void;
  onOpen: (slug: string) => void;
  onStartProject: () => void;
  onCopyLink: (slug: string) => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModal(dialogRef, onClose, closeRef);
  const position = projects.findIndex((item) => item.slug === project.slug);
  const previous = projects[(position - 1 + projects.length) % projects.length];
  const next = projects[(position + 1) % projects.length];

  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0 });
  }, [project.slug]);

  return (
    <div className="case-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article className="case" role="dialog" aria-modal="true" aria-labelledby="case-title" ref={dialogRef} tabIndex={-1}>
        <div className="case-bar">
          <span>Case study {project.index} / {String(projects.length).padStart(2, "0")}</span>
          <div>
            <button type="button" onClick={() => onCopyLink(project.slug)}>Copy link</button>
            <button type="button" ref={closeRef} onClick={onClose} aria-label="Close case study">Close ×</button>
          </div>
        </div>
        <header className="case-head">
          <p className="eyebrow">{project.projectType}</p>
          <h2 id="case-title">{project.title}</h2>
          <p className="case-lede">{project.shortDescription}</p>
          <dl className="case-meta">
            <div><dt>Role</dt><dd>{project.role}</dd></div>
            <div><dt>Category</dt><dd>{project.category}</dd></div>
            <div><dt>Status</dt><dd><StatusTag project={project} /></dd></div>
          </dl>
        </header>
        <ProjectVisual project={project} priority full />
        <div className="case-body">
          <section><h3>Challenge</h3><p>{project.challenge}</p></section>
          <section><h3>Approach</h3><p>{project.approach}</p></section>
          <section><h3>Solution</h3><p>{project.solution}</p></section>
          <section><h3>Scope</h3><ul className="tag-list">{project.capabilities.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section><h3>Technologies</h3><ul className="tag-list">{project.technologies.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section><h3>Status</h3><p>{project.statusNote}</p></section>
        </div>
        {(project.liveUrl || project.relatedUrl) && (
          <div className="case-links">
            {project.liveUrl && <a className="button button-primary" href={project.liveUrl} target="_blank" rel="noopener noreferrer">{project.liveUrlLabel ?? "Visit live site"} <Arrow direction="up-right" /></a>}
            {project.storeLinks?.map((store) => <a key={store.url} className="button button-secondary" href={store.url} target="_blank" rel="noopener noreferrer">{store.label} <Arrow direction="up-right" /></a>)}
            {project.relatedUrl && <a className="button button-secondary" href={project.relatedUrl} target="_blank" rel="noopener noreferrer">{project.relatedUrlLabel ?? "View related project"} <Arrow direction="up-right" /></a>}
          </div>
        )}
        <aside className="case-cta" aria-label="Start a similar project">
          <p>Planning something like <strong>{project.shortTitle}</strong>?</p>
          <div>
            <button type="button" className="button button-primary" onClick={onStartProject}>Start a project <Arrow /></button>
            <a className="button button-secondary" href={whatsappLink(`Hi Mohamed, I saw the ${project.shortTitle} case study and would like to talk about a project.`)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </aside>
        <nav className="case-pager" aria-label="More case studies">
          <button type="button" onClick={() => onOpen(previous.slug)}><Arrow direction="left" /><span><small>Previous</small>{previous.shortTitle}</span></button>
          <button type="button" onClick={() => onOpen(next.slug)}><span><small>Next</small>{next.shortTitle}</span><Arrow /></button>
        </nav>
      </article>
    </div>
  );
}

function SiteHeader({ view, menuOpen, scrolled, activeSection, onMenu, onCloseMenu, onHome, onWork, onSection }: {
  view: View;
  menuOpen: boolean;
  scrolled: boolean;
  activeSection: string | null;
  onMenu: () => void;
  onCloseMenu: () => void;
  onHome: () => void;
  onWork: () => void;
  onSection: (id: SectionId) => void;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // The open mobile menu behaves like a modal: Escape closes, focus stays in the header.
  useEffect(() => {
    if (!menuOpen) return;
    const header = headerRef.current;
    setScrollLock(true);
    header?.querySelector<HTMLElement>("#primary-nav a")?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseMenu();
        menuButtonRef.current?.focus();
      }
      if (event.key !== "Tab" || !header) return;
      const focusable = Array.from(header.querySelectorAll<HTMLElement>("a[href], button")).filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const desktop = window.matchMedia("(min-width: 901px)");
    const onDesktop = () => desktop.matches && onCloseMenu();
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      setScrollLock(false);
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [menuOpen, onCloseMenu]);

  return (
    <header className={`site-header${scrolled || view === "work" ? " is-scrolled" : ""}${menuOpen ? " menu-open" : ""}`} ref={headerRef}>
      <div className="header-inner">
        <a className="wordmark" href="/" aria-label={`${owner.displayName} — home`} onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); onHome(); }}>
          <span className="wordmark-mark" aria-hidden="true">MA</span>
          <span className="wordmark-text" aria-hidden="true">{owner.name}</span>
        </a>
        <nav id="primary-nav" className={menuOpen ? "is-open" : ""} aria-label="Primary">
          <ul>
            {navItems.map((item) => {
              const isWork = item.id === "all-work";
              const current = isWork ? view === "work" : view === "home" && activeSection === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={isWork ? "/work" : `/#${item.id}`}
                    className={current ? "is-current" : undefined}
                    aria-current={isWork && view === "work" ? "page" : undefined}
                    onClick={(event) => {
                      if (!isPlainClick(event)) return;
                      event.preventDefault();
                      if (isWork) onWork();
                      else onSection(item.id as SectionId);
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="nav-extra">
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp {contact.phoneDisplay}</a>
          </div>
        </nav>
        <div className="header-actions">
          <a className="button button-primary button-small" href="/#contact" onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); onSection("contact"); }}>Start a project</a>
          <button className="menu-button" type="button" ref={menuButtonRef} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="primary-nav" onClick={onMenu}><span /><span /></button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onSection, onWork }: { onSection: (id: SectionId) => void; onWork: () => void }) {
  return (
    <section className="hero shell" id="top" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow">{`${owner.displayName} — designer & full-stack developer in Dubai`}</p>
        <h1 id="hero-title">
          <span>I design the interface.</span>{" "}
          <span className="hero-accent">I build what makes it work.</span>
        </h1>
        <p className="hero-lede">Websites and product interfaces, the apps and APIs behind them, and the infrastructure, security and SAP systems they run on — designed, built and launched as one connected system.</p>
        <div className="hero-ctas">
          <a className="button button-primary button-large" href="#contact" onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); onSection("contact"); }}>
            Start a project <Arrow />
          </a>
          <a className="button button-secondary button-large" href="/work" onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); onWork(); }}>View all work</a>
        </div>
      </div>
      <figure className="hero-portrait">
        <img src={headshot.path} alt={headshot.alt} width={headshot.width} height={headshot.height} fetchPriority="high" decoding="async" />
        <figcaption>
          <b>{owner.name}</b>
          <span>{`${owner.alternateName} · ${owner.jobTitle}`}</span>
          <span>{`${company.role}, `}<a href={company.url} target="_blank" rel="noopener noreferrer">{company.name}</a></span>
        </figcaption>
      </figure>
      <ul className="hero-stats" aria-label="At a glance">
        <li><strong>{projects.length}</strong><span>Projects across web, product and systems</span></li>
        <li><strong>{liveProjects.length}</strong><span>Live websites &amp; apps</span></li>
        <li><strong>EN / AR</strong><span>Bilingual, right-to-left interfaces</span></li>
        <li><strong>{owner.locality}</strong><span>{owner.countryName}</span></li>
      </ul>
    </section>
  );
}

function FeaturedProject({ project, onOpen }: { project: Project; onOpen: (slug: string) => void }) {
  return (
    <article className="feature" aria-labelledby={`feature-${project.slug}`} data-reveal>
      <div className="feature-copy">
        <p className="feature-meta"><span>{project.index}</span><span>{project.category}</span><StatusTag project={project} /></p>
        <h3 id={`feature-${project.slug}`}>{project.shortTitle}</h3>
        <p className="feature-desc">{project.shortDescription}</p>
        <p className="feature-role"><span>Role</span>{project.role}</p>
        <ul className="tech-line" aria-label="Technologies">{project.technologies.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
        <ProjectActions project={project} onOpen={onOpen} />
      </div>
      <CaseLink project={project} onOpen={onOpen} className="feature-visual">
        <span className="sr-only">Open the {project.shortTitle} case study</span>
        <ProjectVisual project={project} />
      </CaseLink>
    </article>
  );
}

function SelectedWork({ onOpen, onWork }: { onOpen: (slug: string) => void; onWork: () => void }) {
  const others = projects.filter((project) => !featuredProjects.includes(project));
  return (
    <section className="work shell" id="work" aria-labelledby="work-title" tabIndex={-1}>
      <SectionHead
        id="work-title"
        label="Selected work"
        title="Public websites, private platforms and the infrastructure underneath."
        intro="Each project is shown with its real status — live, in production, private or a case study. Private systems are described, not staged."
      />
      <div className="features">{featuredProjects.map((project) => <FeaturedProject project={project} onOpen={onOpen} key={project.slug} />)}</div>
      <div className="more-work" data-reveal>
        <h3 className="more-work-title">More projects</h3>
        <ul className="index-list">
          {others.map((project) => (
            <li key={project.slug}>
              <CaseLink project={project} onOpen={onOpen} className="index-row">
                <span className="index-num">{project.index}</span>
                <span className="index-name">{project.shortTitle}</span>
                <span className="index-cat">{project.category}</span>
                <span className="index-status">{project.status}</span>
                <Arrow />
              </CaseLink>
            </li>
          ))}
        </ul>
        <a className="button button-secondary" href="/work" onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); onWork(); }}>Browse all {projects.length} projects <Arrow /></a>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="about shell" id="about" aria-labelledby="about-title" tabIndex={-1}>
      <SectionHead id="about-title" label="About" title="One accountable owner, from the first sketch to the production server." />
      <div className="about-body" data-reveal>
        <div className="about-text">
          <p>I’m <strong>{owner.name}</strong> — known online as <strong>{owner.alternateName}</strong> — a designer and full-stack developer based in Dubai, and {company.role.toLowerCase()} of {company.name}. My work usually starts with visual direction and interface design, then continues through front-end and back-end development, launch, and the infrastructure it runs on.</p>
          <p>That range matters when a project involves commerce, bilingual Arabic / English journeys, internal workflows, integrations, security or SAP — not just a marketing page. You work with one person who understands every layer, instead of a hand-off chain.</p>
        </div>
        <div className="about-side">
          <dl className="facts">
            <div><dt>Based in</dt><dd>Dubai, United Arab Emirates</dd></div>
            <div><dt>Company</dt><dd>{`${company.role}, `}<a href={company.url} target="_blank" rel="noopener noreferrer">{company.name}</a></dd></div>
            <div><dt>Practice</dt><dd>Web design · Full-stack · Systems</dd></div>
            <div><dt>Languages</dt><dd>English · Arabic interfaces</dd></div>
          </dl>
          <div className="profiles">
            <p className="eyebrow">{`Elsewhere as ${owner.alternateName}`}</p>
            <ul>
              {profiles.map((profile) => (
                <li key={profile.url}>
                  <a href={profile.url} rel="me noopener noreferrer" target="_blank">
                    <span>{profile.label}</span><span>{profile.handle}</span><Arrow direction="up-right" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section className="services shell" id="services" aria-labelledby="services-title" tabIndex={-1}>
      <SectionHead
        id="services-title"
        label="Services"
        title="Design, development and the systems that keep it running."
        intro="Most projects combine several of these. You get one plan that covers all of them."
      />
      <ol className="service-grid">
        {services.map(([title, description], index) => (
          <li className="service" key={title} data-reveal>
            <span className="service-num">{String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>
      <div className="stack" data-reveal>
        <h3 className="stack-title">Tools and platforms</h3>
        <div className="stack-groups">
          {stackGroups.map(([group, items]) => (
            <div className="stack-group" key={group}>
              <h4>{group}</h4>
              <p>{items.join(" · ")}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="process shell" id="process" aria-labelledby="process-title" tabIndex={-1}>
      <SectionHead id="process-title" label="Process" title="A clear process, so nothing gets lost between design and launch." />
      <ol className="process-list">
        {processSteps.map(([title, description], index) => (
          <li key={title} data-reveal>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ProjectBrief() {
  const [type, setType] = useState(briefTypes[0]);
  const [details, setDetails] = useState("");
  const message = `Hi Mohamed, I'd like to talk about a project.\n\nType: ${type}${details.trim() ? `\nDetails: ${details.trim()}` : ""}`;
  return (
    <form className="brief" onSubmit={(event) => event.preventDefault()} aria-labelledby="brief-title">
      <p className="brief-title" id="brief-title">Project brief</p>
      <fieldset>
        <legend>What are you planning?</legend>
        <div className="brief-options">
          {briefTypes.map((item) => (
            <label key={item} className={type === item ? "is-checked" : undefined}>
              <input type="radio" name="brief-type" value={item} checked={type === item} onChange={() => setType(item)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="brief-label" htmlFor="brief-details">A few details <span>(optional)</span></label>
      <textarea id="brief-details" rows={4} maxLength={600} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Goals, timeline, links to anything that already exists…" />
      <div className="brief-actions">
        <a className="button button-primary" href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">Send on WhatsApp <Arrow direction="up-right" /></a>
        <a className="button button-secondary" href={mailtoLink(`Project enquiry — ${type}`, message)}>Send by email</a>
      </div>
      <p className="brief-note">Opens WhatsApp or your email app with the message ready to send. Nothing is stored on this site.</p>
    </form>
  );
}

function ContactSection({ dubaiTime, onCopyEmail }: { dubaiTime: string; onCopyEmail: () => void }) {
  return (
    <section className="contact shell" id="contact" aria-labelledby="contact-title" tabIndex={-1}>
      <div className="contact-grid">
        <div className="contact-lead" data-reveal>
          <p className="eyebrow">Contact</p>
          <h2 id="contact-title">Have a project in mind?</h2>
          <p>Tell me what you’re planning — a website, a product, an internal system or the infrastructure underneath it. I’ll reply with honest next steps.</p>
          <ul className="channels">
            <li>
              <span>Email</span>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              <button type="button" onClick={onCopyEmail}>Copy</button>
            </li>
            <li>
              <span>WhatsApp</span>
              <a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">{contact.phoneDisplay}</a>
            </li>
            <li>
              <span>Location</span>
              <p>Dubai, UAE <small>{dubaiTime ? `· ${dubaiTime} local time` : "· GMT+4"}</small></p>
            </li>
          </ul>
        </div>
        <div data-reveal><ProjectBrief /></div>
      </div>
    </section>
  );
}

function SiteFooter({ onHome, onWork, onSection }: { onHome: () => void; onWork: () => void; onSection: (id: SectionId) => void }) {
  const links: Array<[SectionId | "all-work", string]> = [["all-work", "Work"], ["about", "About"], ["services", "Services"], ["process", "Process"], ["contact", "Contact"]];
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div className="footer-brand">
          <a href="/" onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); onHome(); }}>{owner.name}</a>
          <p>{`${owner.displayName} — designer & full-stack developer in Dubai, UAE.`} Websites, products, business systems and the infrastructure underneath.</p>
        </div>
        <nav aria-label="Footer">
          <ul>
            {links.map(([id, label]) => (
              <li key={id}>
                <a href={id === "all-work" ? "/work" : `/#${id}`} onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); if (id === "all-work") onWork(); else onSection(id); }}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="footer-contact">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">{`WhatsApp · ${contact.phoneDisplay}`}</a>
          {profiles.map((profile) => (
            <a key={profile.url} href={profile.url} target="_blank" rel="me noopener noreferrer">{`${profile.label} · ${profile.handle}`}</a>
          ))}
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> {owner.displayName} · Dubai, UAE</span>
        <a href="#top" onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); scrollToTarget("top"); }}>Back to top ↑</a>
      </div>
    </footer>
  );
}

function HomeView({ dubaiTime, onOpen, onWork, onSection, onCopyEmail }: {
  dubaiTime: string;
  onOpen: (slug: string) => void;
  onWork: () => void;
  onSection: (id: SectionId) => void;
  onCopyEmail: () => void;
}) {
  return (
    <>
      <Hero onSection={onSection} onWork={onWork} />
      <SelectedWork onOpen={onOpen} onWork={onWork} />
      <AboutSection />
      <ServicesSection />
      <ProcessSection />
      <ContactSection dubaiTime={dubaiTime} onCopyEmail={onCopyEmail} />
    </>
  );
}

function WorkView({ category, dubaiTime, onCategory, onOpen, onCopyEmail }: {
  category: Category;
  dubaiTime: string;
  onCategory: (category: Category) => void;
  onOpen: (slug: string) => void;
  onCopyEmail: () => void;
}) {
  const visibleProjects = category === "All" ? projects : projects.filter((project) => project.category === category);
  const privateCount = projects.length - liveProjects.length;
  return (
    <>
      <section className="work-hero shell" id="top" aria-labelledby="work-page-title">
        <p className="eyebrow">Work</p>
        <h1 id="work-page-title">The work, in full.</h1>
        <p className="section-intro">Websites, product interfaces and deeper systems work — from bilingual commerce to SAP, infrastructure and cybersecurity — each shown with its real public, private or production status.</p>
        <ul className="work-stats" aria-label="Index summary">
          <li><strong>{projects.length}</strong> projects</li>
          <li><strong>{liveProjects.length}</strong> live websites &amp; apps</li>
          <li><strong>{privateCount}</strong> private, production or case-study builds</li>
        </ul>
      </section>
      <section className="work-index shell" id="project-index" aria-labelledby="index-title">
        <div className="work-toolbar">
          <h2 id="index-title" className="sr-only">Project index</h2>
          <div className="filters" role="group" aria-label="Filter projects by category">
            {projectCategories.map((item) => (
              <button type="button" key={item} className={category === item ? "is-active" : ""} aria-pressed={category === item} onClick={() => onCategory(item)}>
                {item}<span aria-hidden="true">{countIn(item)}</span><span className="sr-only"> ({countIn(item)} projects)</span>
              </button>
            ))}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{`Showing ${visibleProjects.length} ${category === "All" ? "" : `${category} `}projects`}</p>
        <ol className="work-list">
          {visibleProjects.map((project) => (
            <li className="work-row" key={project.slug}>
              <article aria-labelledby={`row-${project.slug}`}>
                <div className="work-row-visual"><ProjectVisual project={project} compact /></div>
                <div className="work-row-copy">
                  <p className="feature-meta"><span>{project.index}</span><span>{project.projectType}</span></p>
                  <h3 id={`row-${project.slug}`}>{project.shortTitle}</h3>
                  <p className="feature-desc">{project.shortDescription}</p>
                  <p className="feature-role"><span>Role</span>{project.role}</p>
                  <ul className="tech-line" aria-label="Technologies">{project.technologies.slice(0, 6).map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div className="work-row-side"><StatusTag project={project} /><ProjectActions project={project} onOpen={onOpen} /></div>
              </article>
            </li>
          ))}
        </ol>
      </section>
      <section className="lab shell" id="lab-index" aria-labelledby="lab-index-title">
        <h2 id="lab-index-title" className="eyebrow">Experiments</h2>
        <ul>
          {labExperiments.map((experiment) => (
            <li key={experiment.slug}>
              <h3>{experiment.title}</h3>
              <p>{experiment.summary}</p>
              <small>{experiment.technologies.join(" · ")} — {experiment.note}</small>
            </li>
          ))}
        </ul>
      </section>
      <ContactSection dubaiTime={dubaiTime} onCopyEmail={onCopyEmail} />
    </>
  );
}

/** Scroll to a section and move keyboard focus there without a second jump. */
const focusSection = (id: string) => {
  scrollToTarget(id);
  document.getElementById(id)?.focus({ preventScroll: true });
};

const readCaseSlug = () => {
  const match = window.location.hash.match(/^#case\/([a-z0-9-]+)$/);
  return match && getProject(match[1]) ? match[1] : null;
};

export default function Home({ initialView = "home" }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView);
  const [category, setCategory] = useState<Category>("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dubaiTime, setDubaiTime] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const pendingSection = useRef<string | null>(null);
  const toastTimer = useRef(0);
  const selectedProject = selectedSlug ? getProject(selectedSlug) ?? null : null;

  useReveal(`${view}:${category}`, setScrolled);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  // Route, filter and case-study state all live in the URL.
  useEffect(() => {
    const syncFromUrl = () => {
      setView(window.location.pathname.replace(/\/+$/, "") === "/work" ? "work" : "home");
      setCategory(categoryFromSlug(new URLSearchParams(window.location.search).get("filter")));
      setSelectedSlug(readCaseSlug());
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
    };
  }, []);

  useEffect(() => {
    const updateClock = () => setDubaiTime(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    updateClock();
    const clock = window.setInterval(updateClock, 30000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    document.title = routeSeo[view].title;
    if (pendingSection.current) {
      const target = pendingSection.current;
      pendingSection.current = null;
      window.requestAnimationFrame(() => focusSection(target));
    }
  }, [view]);

  // Highlight the nav item for the section being read.
  useEffect(() => {
    if (view !== "home") return;
    const sections = ["about", "work", "services", "process", "contact"].map((id) => document.getElementById(id)).filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [view]);

  const navigate = useCallback((next: View, section?: string) => {
    setMenuOpen(false);
    setSelectedSlug(null);
    const target = section ? `/#${section}` : next === "work" ? "/work" : "/";
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== target) window.history.pushState({}, "", target);
    if (next === "work") setCategory("All");
    if (next === view) {
      if (section) focusSection(section);
      else scrollToTarget("top");
      return;
    }
    pendingSection.current = section ?? null;
    setView(next);
    if (!section) scrollToTarget("top", { immediate: true });
  }, [view]);

  const goToSection = useCallback((id: SectionId) => {
    setMenuOpen(false);
    if (view === "home") {
      window.history.replaceState({}, "", `/#${id}`);
      focusSection(id);
    } else {
      navigate("home", id);
    }
  }, [navigate, view]);

  const openCaseStudy = useCallback((slug: string) => {
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#case/${slug}`);
    setSelectedSlug(slug);
  }, []);

  const closeCaseStudy = useCallback(() => {
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
    setSelectedSlug(null);
  }, []);

  const changeCategory = useCallback((next: Category) => {
    const url = new URL(window.location.href);
    if (next === "All") url.searchParams.delete("filter"); else url.searchParams.set("filter", categorySlug(next));
    window.history.replaceState(window.history.state, "", url);
    setCategory(next);
  }, []);

  const copyEmail = useCallback(() => {
    if (!navigator.clipboard) {
      window.location.href = `mailto:${contact.email}`;
      return;
    }
    navigator.clipboard.writeText(contact.email)
      .then(() => notify(`Copied ${contact.email}`))
      .catch(() => { window.location.href = `mailto:${contact.email}`; });
  }, [notify]);

  const copyCaseLink = useCallback((slug: string) => {
    const url = `${window.location.origin}${window.location.pathname}#case/${slug}`;
    if (!navigator.clipboard) {
      notify(url);
      return;
    }
    navigator.clipboard.writeText(url).then(() => notify("Case study link copied")).catch(() => notify(url));
  }, [notify]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <div id={SITE_CONTENT_ID} className="site">
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader
          view={view}
          menuOpen={menuOpen}
          scrolled={scrolled}
          activeSection={activeSection}
          onMenu={() => setMenuOpen((open) => !open)}
          onCloseMenu={closeMenu}
          onHome={() => navigate("home")}
          onWork={() => navigate("work")}
          onSection={goToSection}
        />
        <main id="main" className={view === "work" ? "is-work" : "is-home"} tabIndex={-1}>
          {view === "home" ? (
            <HomeView dubaiTime={dubaiTime} onOpen={openCaseStudy} onWork={() => navigate("work")} onSection={goToSection} onCopyEmail={copyEmail} />
          ) : (
            <WorkView category={category} dubaiTime={dubaiTime} onCategory={changeCategory} onOpen={openCaseStudy} onCopyEmail={copyEmail} />
          )}
        </main>
        <SiteFooter onHome={() => navigate("home")} onWork={() => navigate("work")} onSection={goToSection} />
      </div>
      {selectedProject && (
        <CaseStudyDialog
          project={selectedProject}
          onClose={closeCaseStudy}
          onOpen={openCaseStudy}
          onStartProject={() => { closeCaseStudy(); goToSection("contact"); }}
          onCopyLink={copyCaseLink}
        />
      )}
      <p className={`toast${toast ? " is-visible" : ""}`} role="status" aria-live="polite">{toast}</p>
    </>
  );
}
