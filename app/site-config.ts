import { projects } from "./project-data";

/**
 * Single source of truth for identity, contact details and search metadata.
 * Used by app/layout.tsx (vinext build) and vercel-prerender.tsx (Vercel build),
 * so both deployments describe the site identically. Pure data — no DOM access.
 */
// The public origin, overridable per deployment (e.g. GitHub Pages sets VITE_SITE_URL at build time).
const configuredUrl = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_SITE_URL;
// Production canonical origin: the real3adi.space custom domain on GitHub Pages.
export const SITE_URL = (configuredUrl || "https://real3adi.space").replace(/\/+$/, "");
export const SITE_NAME = "Mohamed Amin (real3adi) — Designer & Full-Stack Developer";
export const THEME_COLOR = "#f6f4ef";

export const owner = {
  /** Full legal name — the entity name in structured data. */
  name: "Mohamed Amin",
  /** Public handle used across the web. */
  alternateName: "real3adi",
  /** Full name with family name, and the Arabic spelling — both shown in About. */
  fullName: "Mohamed Amin Jbari",
  arabicName: "محمد امين اجباري",
  /** Visible "name (handle)" form, so the page text matches the structured data. */
  displayName: "Mohamed Amin (real3adi)",
  jobTitle: "Designer & Full-Stack Developer",
  summary:
    "Dubai-based designer and full-stack developer. I design websites and product interfaces, build the apps and APIs behind them, and run the infrastructure, security and SAP systems they depend on.",
  locality: "Dubai",
  country: "AE",
  countryName: "United Arab Emirates",
} as const;

/** Company Mohamed Amin co-founded; @id matches the one haak-org.com publishes. */
export const company = {
  id: "https://www.haak-org.com",
  name: "HAAK Solutions",
  url: "https://haak-org.com/",
  role: "Co-founder",
} as const;

/** Third-person bio shared by the visible About section and Person.description. */
export const personBio =
  "Mohamed Amin, known online as real3adi, is a Dubai-based designer, full-stack developer and co-founder of HAAK Solutions who designs websites and product interfaces, builds the apps and APIs behind them, and runs the infrastructure, security and SAP systems they depend on.";

/**
 * Official personal profiles — only accounts verified as Mohamed Amin's own.
 * Rendered as visible rel="me" links and emitted as Person.sameAs.
 */
export const profiles = [
  { label: "LinkedIn", handle: "Mohamed Amin", url: "https://www.linkedin.com/in/mohamed-amin-jbari-223237364/" },
  { label: "Instagram", handle: "@real3adi", url: "https://www.instagram.com/real3adi/" },
  { label: "GitHub", handle: "REALDADY", url: "https://github.com/REALDADY" },
] as const;

/** Real headshot — shown in the About section and used as Person.image. */
export const headshot = {
  path: "/mohamed-amin-real3adi.jpg",
  width: 720,
  height: 960,
  alt: "Portrait of Mohamed Amin (real3adi), designer and full-stack developer in Dubai",
} as const;

export const contact = {
  email: "amijbari8@gmail.com",
  phoneDisplay: "+971 55 195 9820",
  phoneE164: "+971551959820",
  whatsappUrl: "https://wa.me/971551959820",
} as const;

export const whatsappLink = (message?: string) =>
  message ? `${contact.whatsappUrl}?text=${encodeURIComponent(message)}` : contact.whatsappUrl;

export const mailtoLink = (subject?: string, body?: string) => {
  const params = [subject && `subject=${encodeURIComponent(subject)}`, body && `body=${encodeURIComponent(body)}`].filter(Boolean);
  return `mailto:${contact.email}${params.length ? `?${params.join("&")}` : ""}`;
};

export const knowsAbout = [
  "Web design",
  "UI/UX design",
  "Creative front-end development",
  "Full-stack web development",
  "React",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "E-commerce development",
  "Bilingual Arabic / English interfaces",
  "Technical SEO",
  "IT infrastructure",
  "Virtualisation (Proxmox)",
  "Active Directory",
  "Network security (FortiGate)",
  "Cybersecurity hardening",
  "Backup and disaster recovery",
  "SAP Business One",
  "SAP HANA",
];

export type RouteKey = "home" | "work";

export const routeSeo: Record<RouteKey, { path: string; title: string; description: string; ogTitle: string }> = {
  home: {
    path: "/",
    title: "Mohamed Amin (real3adi) — Designer & Full-Stack Developer in Dubai",
    description:
      "Mohamed Amin (real3adi) is a Dubai-based designer and full-stack developer building websites, web apps and the enterprise systems behind them — infrastructure, cybersecurity and SAP.",
    ogTitle: "Mohamed Amin (real3adi) — I design the interface. I build what makes it work.",
  },
  work: {
    path: "/work",
    title: "Work — Web, Product & Enterprise Systems Case Studies | Mohamed Amin",
    description: `${projects.length} case studies from Dubai: commerce websites, product platforms, internal tools, IT infrastructure, cybersecurity hardening and SAP Business One.`,
    ogTitle: "The work, in full — Mohamed Amin (real3adi), Dubai",
  },
};

export const ogImage = {
  url: `${SITE_URL}/og-mohamed-amin.jpg`,
  width: 1200,
  height: 630,
  alt: "Mohamed Amin (real3adi) — designer and full-stack developer in Dubai",
} as const;

export const absoluteUrl = (path: string) => (path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`);

/** Stable entity ids. The person lives on the canonical homepage, which is the profile page. */
export const ids = {
  person: `${SITE_URL}/#person`,
  profilePage: `${SITE_URL}/#profilepage`,
  website: `${SITE_URL}/#website`,
  service: `${SITE_URL}/#service`,
  workPage: `${SITE_URL}/work#webpage`,
  projects: `${SITE_URL}/work#projects`,
} as const;

/** First publication of the profile page on real3adi.space. */
const PROFILE_CREATED = "2026-09-27";

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Structured data per route. The homepage is a ProfilePage whose mainEntity is
 * the one full Person definition; every other node (and the /work page)
 * points at that Person by @id, so there is never a second Person block.
 */
export function buildJsonLd(route: RouteKey = "home", modified = todayIso()) {
  const person = { "@id": ids.person };
  const address = { "@type": "PostalAddress", addressLocality: owner.locality, addressCountry: owner.country };

  const website = {
    "@type": "WebSite",
    "@id": ids.website,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    alternateName: owner.alternateName,
    description: routeSeo.home.description,
    inLanguage: "en",
    publisher: person,
  };

  const projectList = {
    "@type": "ItemList",
    "@id": ids.projects,
    name: "Projects and case studies",
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CreativeWork",
        name: project.title,
        description: project.shortDescription,
        url: project.liveUrl ?? `${SITE_URL}/work#case/${project.slug}`,
        genre: project.category,
        keywords: project.technologies.join(", "),
        creator: person,
      },
    })),
  };

  if (route === "work") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": ids.workPage,
          url: absoluteUrl(routeSeo.work.path),
          name: routeSeo.work.title,
          description: routeSeo.work.description,
          inLanguage: "en",
          isPartOf: { "@id": ids.website },
          about: person,
          author: person,
          mainEntity: { "@id": ids.projects },
        },
        website,
        projectList,
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": ids.profilePage,
        url: `${SITE_URL}/`,
        name: routeSeo.home.title,
        description: routeSeo.home.description,
        inLanguage: "en",
        isPartOf: { "@id": ids.website },
        dateCreated: PROFILE_CREATED,
        dateModified: modified,
        primaryImageOfPage: { "@id": `${SITE_URL}/#headshot` },
        mainEntity: {
          "@type": "Person",
          "@id": ids.person,
          name: owner.name,
          alternateName: [owner.alternateName, owner.fullName, owner.arabicName],
          jobTitle: owner.jobTitle,
          description: personBio,
          url: `${SITE_URL}/`,
          image: {
            "@type": "ImageObject",
            "@id": `${SITE_URL}/#headshot`,
            url: `${SITE_URL}${headshot.path}`,
            contentUrl: `${SITE_URL}${headshot.path}`,
            width: headshot.width,
            height: headshot.height,
            caption: owner.displayName,
          },
          mainEntityOfPage: { "@id": ids.profilePage },
          sameAs: profiles.map((profile) => profile.url),
          worksFor: {
            "@type": "Organization",
            "@id": company.id,
            name: company.name,
            url: company.url,
          },
          hasOccupation: {
            "@type": "Role",
            roleName: company.role,
          },
          email: `mailto:${contact.email}`,
          telephone: contact.phoneE164,
          address,
          homeLocation: { "@type": "Place", name: `${owner.locality}, ${owner.countryName}` },
          knowsAbout,
        },
      },
      website,
      {
        "@type": "ProfessionalService",
        "@id": ids.service,
        name: `${owner.displayName} — Design & Engineering`,
        description: owner.summary,
        url: `${SITE_URL}/`,
        image: ogImage.url,
        email: contact.email,
        telephone: contact.phoneE164,
        address,
        founder: person,
        knowsAbout,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Services",
          itemListElement: [
            "Web design and creative development",
            "Full-stack web and product development",
            "Enterprise and internal business systems",
            "IT infrastructure and disaster recovery",
            "Cybersecurity hardening",
            "SAP Business One / HANA",
          ].map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })),
        },
      },
      projectList,
    ],
  };
}

/** JSON for a <script type="application/ld+json"> body; `<` is escaped so it can never close the tag. */
export const serializeJsonLd = (route: RouteKey = "home") => JSON.stringify(buildJsonLd(route)).replace(/</g, "\\u003c");

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Route-specific <head> tags for the statically prerendered Vercel build. */
export function buildHeadTags(route: RouteKey) {
  const seo = routeSeo[route];
  const url = absoluteUrl(seo.path);
  const meta = (attribute: "name" | "property", key: string, content: string | number) =>
    `<meta ${attribute}="${key}" content="${escapeAttribute(String(content))}" />`;

  return [
    `<title>${escapeAttribute(seo.title)}</title>`,
    meta("name", "description", seo.description),
    `<link rel="canonical" href="${url}" />`,
    meta("name", "author", owner.name),
    meta("name", "robots", "index, follow, max-image-preview:large"),
    meta("property", "og:type", "website"),
    meta("property", "og:site_name", SITE_NAME),
    meta("property", "og:locale", "en_AE"),
    meta("property", "og:url", url),
    meta("property", "og:title", seo.ogTitle),
    meta("property", "og:description", seo.description),
    meta("property", "og:image", ogImage.url),
    meta("property", "og:image:width", ogImage.width),
    meta("property", "og:image:height", ogImage.height),
    meta("property", "og:image:alt", ogImage.alt),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", seo.ogTitle),
    meta("name", "twitter:description", seo.description),
    meta("name", "twitter:image", ogImage.url),
    meta("name", "twitter:image:alt", ogImage.alt),
    ...profiles.map((profile) => `<link rel="me" href="${escapeAttribute(profile.url)}" />`),
    `<script type="application/ld+json">${serializeJsonLd(route)}</script>`,
  ].join("\n    ");
}

/** robots.txt and sitemap.xml for the deployed origin, written by the static build. */
export const robotsTxt = () => `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;

export const sitemapXml = (lastmod = new Date().toISOString().slice(0, 10)) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${(Object.keys(routeSeo) as RouteKey[]).map((route) => `  <url>
    <loc>${absoluteUrl(routeSeo[route].path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${route === "home" ? "1.0" : "0.8"}</priority>
  </url>`).join("\n")}
</urlset>
`;
