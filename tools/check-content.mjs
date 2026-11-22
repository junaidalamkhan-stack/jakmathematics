#!/usr/bin/env node
// Checks content/site.json and content/courses.json before publishing.
// Usage:  node tools/check-content.mjs
// Exits with code 1 if anything is wrong, and prints what to fix.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

function load(rel) {
  try { return JSON.parse(readFileSync(resolve(root, rel), "utf8")); }
  catch (e) { err(`${rel}: not valid JSON (${e.message})`); return null; }
}
const isLocal = (u) => u && !/^(https?:)?\/\//.test(u) && !u.startsWith("mailto:");
function checkFile(u, where) {
  if (!u) return;
  if (isLocal(u) && !existsSync(resolve(root, u.replace(/^\//, "").split(/[?#]/)[0]))) err(`${where}: file not found: ${u}`);
}

const site = load("content/site.json");
const data = load("content/courses.json");

if (site) {
  for (const k of ["name", "title", "institution", "email"]) if (!site[k]) err(`site.json: "${k}" is required`);
  checkFile(site.cvPdf, "site.json cvPdf");
  for (const [k, v] of Object.entries(site.links || {})) if (v && !/^https:\/\//.test(v)) err(`site.json links.${k}: must start with https://`);
  for (const x of site.research?.software || []) for (const k of ["url", "repo"]) if (x[k] && !/^https:\/\//.test(x[k])) err(`site.json software ${x.name}: ${k} must start with https://`);
}
if (data) {
  if (!Array.isArray(data.courses)) err(`courses.json: top level must be { "courses": [ ... ] }`);
  const ids = new Set();
  for (const [i, c] of (data.courses || []).entries()) {
    const at = `courses.json course #${i + 1} (${c.title || c.id || "untitled"})`;
    if (!c.id || !/^[a-z0-9-]+$/.test(c.id)) err(`${at}: "id" must be lowercase letters, digits and hyphens`);
    if (ids.has(c.id)) err(`${at}: duplicate id "${c.id}"`); ids.add(c.id);
    if (!c.title) err(`${at}: "title" is required`);
    if (!["active", "archived"].includes(c.status)) err(`${at}: "status" must be "active" or "archived"`);
    if (!["Undergraduate", "Graduate", "Secondary"].includes(c.level)) warn(`${at}: level "${c.level}" is not Undergraduate/Graduate`);
    if (c.status === "active" && !c.summary) warn(`${at}: active course has no summary for its card`);
    const nums = new Set();
    for (const l of c.lectures || []) {
      const lat = `${at} lecture ${l.number} (${l.title || "untitled"})`;
      if (!Number.isInteger(l.number)) err(`${lat}: "number" must be a whole number`);
      if (nums.has(l.number)) err(`${lat}: lecture number used twice`); nums.add(l.number);
      if (!l.title) err(`${lat}: "title" is required`);
      if (l.updated && !/^\d{4}-\d{2}-\d{2}/.test(l.updated)) err(`${lat}: "updated" must look like 2026-09-29`);
      if ((l.lecture || l.slides || l.notes || (l.extras || []).length) && !l.updated) warn(`${lat}: has files but no "updated" date, so it will not appear under Latest materials`);
      if (l.video && !/^https:\/\//.test(l.video)) err(`${lat}: "video" must be a full https:// link`);
      for (const x of l.videos || []) if (!/^https:\/\//.test(x.url || "")) err(`${lat}: each video needs a full https:// url`);
      checkFile(l.lecture, lat + " lecture"); checkFile(l.slides, lat + " slides"); checkFile(l.notes, lat + " notes");
      for (const x of l.extras || []) { if (!x.url) err(`${lat}: extra "${x.label}" has no url`); checkFile(x.url, `${lat} extra "${x.label}"`); }
    }
  }
  for (const c of data.courses || []) if (c.coveredBy && !ids.has(c.coveredBy)) err(`courses.json ${c.title}: coveredBy "${c.coveredBy}" is not a course id`);
}

for (const w of warnings) console.log("warning: " + w);
for (const e of errors) console.log("ERROR:   " + e);
if (errors.length) { console.log(`\n${errors.length} problem(s) found. Fix them before publishing.`); process.exit(1); }
console.log(`Content OK (${(data?.courses || []).length} courses, ${warnings.length} warning(s)).`);
