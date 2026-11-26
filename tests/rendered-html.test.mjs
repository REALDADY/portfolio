import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

const SITE = "https://real3adi\\.space";
const countMatches = (html, pattern) => (html.match(pattern) ?? []).length;

test("renders the professional portfolio homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /I design the interface/);
  assert.match(html, /I build what makes it work/);
  assert.match(html, /Selected work/);
  assert.match(html, /Alrawdah Digital Platform/);
  assert.match(html, /Infrastructure Transformation/);
  assert.match(html, /\/projects\/rs-water\.png/);
  assert.match(html, /\/projects\/haak-solutions\.jpg/);
  assert.match(html, /\/projects\/revana\.jpg/);
  assert.match(html, /\/mohamed-amin-real3adi\.jpg/);
  assert.match(html, /amijbari8@gmail\.com/);
  assert.match(html, /971551959820/);
});

test("homepage uses only real imagery — no generated concept art or WebGL scene", async () => {
  const html = await (await render()).text();
  assert.doesNotMatch(html, /concept\.webp|og-systems|CONCEPT VISUAL/);
  assert.doesNotMatch(html, /space-canvas|data-hud|sector-codename|amin@dxb/);
  assert.doesNotMatch(html, /WebGLRenderer/);
});

test("homepage tells the full story with clear calls to action", async () => {
  const html = await (await render()).text();
  assert.equal(countMatches(html, /<h1[\s>]/g), 1, "exactly one <h1>");
  assert.match(html, /Start a project/);
  assert.match(html, /wa\.me\/971551959820/);
  for (const title of ["Kifaya", "Revana", "Ticket System", "Bottle Tracking", "Dispatch Console", "GamerHub UAE"]) {
    assert.match(html, new RegExp(title), `${title} is listed`);
  }
  for (const id of ["work", "about", "services", "process", "contact"]) {
    assert.match(html, new RegExp(`<section[^>]*id="${id}"`), `#${id} section`);
  }
  assert.match(html, /Project brief/);
});

test("homepage ships search metadata and structured data", async () => {
  const html = await (await render()).text();
  assert.match(html, /<html lang="en"/);
  assert.match(html, new RegExp(`<link(?=[^>]*rel="canonical")(?=[^>]*href="${SITE}/?")[^>]*>`));
  assert.match(html, new RegExp(`og:image"[^>]*content="${SITE}/og-mohamed-amin\\.jpg"|content="${SITE}/og-mohamed-amin\\.jpg"[^>]*og:image"`));
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"@type":"ProfilePage"/);
  assert.match(html, /"@type":"Person"/);
  assert.match(html, /"alternateName":"real3adi"/);
  assert.match(html, /"@type":"ProfessionalService"/);
  assert.match(html, /"@type":"ItemList"/);
  assert.match(html, /"addressLocality":"Dubai"/);
});

test("renders the full work route", async () => {
  const response = await render("/work");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The work,/);
  assert.match(html, /Cybersecurity Hardening/);
  assert.match(html, /HRMS &amp; Attendance/);
  assert.match(html, /class="spec/);
  assert.doesNotMatch(html, /concept\.webp/);
  assert.doesNotMatch(html, /falcon-crm-xi/);
});

test("work route has category filters, every project and its own metadata", async () => {
  const html = await (await render("/work")).text();
  assert.equal(countMatches(html, /<h1[\s>]/g), 1, "exactly one <h1>");
  assert.match(html, /Filter projects by category/);
  for (const category of ["Products", "Enterprise Systems", "Infrastructure", "Cybersecurity", "ERP / SAP", "Web"]) {
    assert.match(html, new RegExp(`aria-pressed="(true|false)"[^>]*>${category.replace("/", "\\/")}`), `${category} filter`);
  }
  for (const title of ["Kifaya", "Revana", "Ticket System", "Bottle Tracking", "Dispatch Console", "GamerHub UAE"]) {
    assert.match(html, new RegExp(title), `${title} is listed`);
  }
  assert.match(html, /<title>Work — Web, Product/);
  assert.match(html, new RegExp(`<link(?=[^>]*rel="canonical")(?=[^>]*href="${SITE}/work")[^>]*>`));
  assert.doesNotMatch(html, /falcon-crm\.png/);
});

test("uses the restrained editorial palette", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  for (const token of ["--bg: #f6f4ef", "--ink: #141310", "--accent: #0e5a47"]) {
    assert.ok(css.includes(token), `${token} defined`);
  }
  assert.doesNotMatch(css, /space-canvas|#ff84ba/);
});

test("publishes robots.txt and a sitemap for both routes", async () => {
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  assert.match(robots, new RegExp(`Sitemap: ${SITE}/sitemap\\.xml`));
  assert.match(sitemap, new RegExp(`<loc>${SITE}/</loc>`));
  assert.match(sitemap, new RegExp(`<loc>${SITE}/work</loc>`));
});
