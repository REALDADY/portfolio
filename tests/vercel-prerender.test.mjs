import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Run after `npm run build:vercel` (see the "test:vercel" script).
// VERCEL_DIST can point the checks at another output directory.
const distDir = new URL(`../${process.env.VERCEL_DIST ?? "vercel-dist"}/`, import.meta.url);
const read = (file) => readFile(new URL(file, distDir), "utf8");
// The build's public origin (VITE_SITE_URL, e.g. GitHub Pages), escaped for RegExp.
const SITE = (process.env.VITE_SITE_URL || "https://real3adi.space").replace(/\/+$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rootMarkup = (html) => html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/)?.[1] ?? "";

test("index.html is prerendered with homepage content and head tags", async () => {
  const html = await read("index.html");
  const root = rootMarkup(html);
  assert.ok(root.length > 5000, "#root contains rendered markup");
  assert.equal((root.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.match(root, /I design the interface/);
  assert.match(root, /Alrawdah Digital Platform/);
  assert.match(root, /Kifaya/);
  assert.match(root, /AR Green/);
  assert.match(root, /\/projects\/alrawdah-app\/02-home\.jpg/);
  assert.match(root, /href="https:\/\/onelink\.to\/jb4gmr"/);
  assert.match(root, /\/projects\/argreen\.jpg/);
  assert.match(root, /amijbari8@gmail\.com/);
  assert.match(root, /971551959820/);
  assert.doesNotMatch(html, /seo:start|seo:end/);
  assert.match(html, /<title>Mohamed Amin \(real3adi\) — Designer &amp; Full-Stack Developer in Dubai<\/title>/);
  assert.match(html, /<meta name="description" content="Mohamed Amin \(real3adi\) is a Dubai-based designer/);
  assert.match(html, /<meta name="robots" content="index, follow/);
  assert.match(html, /<link rel="me" href="https:\/\/github\.com\/REALDADY" \/>/);
  // The visible bio carries the full name and the handle.
  assert.match(root, /Mohamed Amin \(real3adi\) — designer &amp; full-stack developer in Dubai/);
  assert.match(root, /<strong>Mohamed Amin<\/strong> — known online as <strong>real3adi<\/strong>/);
  assert.match(root, /href="https:\/\/github\.com\/REALDADY" rel="me/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE}/" />`));
  assert.match(html, new RegExp(`<meta property="og:url" content="${SITE}/" />`));
  assert.match(html, /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org"/);
  assert.doesNotMatch(html, /falcon-crm-xi|falcon-crm\.png/);
});

test("index.html is a ProfilePage whose single Person matches the visible bio", async () => {
  const html = await read("index.html");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  assert.equal(blocks.length, 1, "exactly one JSON-LD block");
  const graph = blocks[0]["@graph"];
  const page = graph.find((node) => node["@type"] === "ProfilePage");
  assert.ok(page, "ProfilePage present");
  const site = SITE.replace(/\\/g, "");
  assert.equal(page["@id"], `${site}/#profilepage`);
  assert.equal(page.url, `${site}/`);
  const person = page.mainEntity;
  assert.equal(person["@type"], "Person");
  assert.equal(person["@id"], `${site}/#person`);
  assert.equal(person.name, "Mohamed Amin");
  assert.deepEqual(person.alternateName, ["real3adi", "Mohamed Amin Jbari", "محمد امين اجباري"]);
  // Every alternate name is also visible on the page.
  assert.match(html, /Mohamed Amin Jbari · <span lang="ar" dir="rtl">محمد امين اجباري<\/span>/);
  assert.deepEqual(person.sameAs, [
    "https://www.linkedin.com/in/mohamed-amin-jbari-223237364/",
    "https://www.instagram.com/real3adi/",
    "https://github.com/REALDADY",
    "https://ai.lounge.ai/@real3adi",
  ]);
  assert.equal(person.image.url, `${site}/mohamed-amin-real3adi.jpg`);
  assert.equal(person.worksFor["@id"], "https://www.haak-org.com");
  assert.match(person.description, /co-founder of HAAK Solutions/);
  assert.match(html, /Co-founder, <a href="https:\/\/haak-org\.com\/"/);
  // Every sameAs profile is also a visible rel="me" link, and the headshot is on the page.
  for (const url of person.sameAs) assert.ok(html.includes(`href="${url}" rel="me`), `${url} is linked visibly`);
  assert.match(html, /<img src="\/mohamed-amin-real3adi\.jpg" alt="Portrait of Mohamed Amin \(real3adi\)/);
  await readFile(new URL("mohamed-amin-real3adi.jpg", distDir));
  // Only one full Person definition; everything else references it by @id.
  const fullPersons = JSON.stringify(blocks).match(/"@type":"Person"/g) ?? [];
  assert.equal(fullPersons.length, 1);
});

test("work.html is prerendered with the full index and its own head tags", async () => {
  const html = await read("work.html");
  const root = rootMarkup(html);
  assert.equal((root.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.match(root, /The work,/);
  assert.match(root, /Cybersecurity Hardening/);
  assert.match(root, /GamerHub UAE/);
  assert.match(root, /Filter projects by category/);
  assert.match(html, /<title>Work — Web, Product &amp; Enterprise Systems Case Studies \| Mohamed Amin<\/title>/);
  assert.match(html, /"@type":"CollectionPage"/);
  assert.doesNotMatch(html, /"@type":"(Person|ProfilePage)"/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE}/work" />`));
  assert.doesNotMatch(html, /falcon-crm-xi|falcon-crm\.png/);
});

test("robots.txt and sitemap.xml are deployed", async () => {
  assert.match(await read("robots.txt"), new RegExp(`Allow: /\\n\\nSitemap: ${SITE}/sitemap\\.xml`));
  assert.doesNotMatch(await read("robots.txt"), /Disallow: \//);
  assert.match(await read("sitemap.xml"), new RegExp(`<loc>${SITE}/</loc>`));
  assert.match(await read("sitemap.xml"), new RegExp(`<loc>${SITE}/work</loc>`));
});
