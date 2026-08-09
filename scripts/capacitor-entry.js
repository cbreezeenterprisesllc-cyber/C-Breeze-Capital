#!/usr/bin/env node
/**
 * Generates an index.html entry point in dist/client for Capacitor.
 *
 * The TanStack Start SSR build produces client JS/CSS bundles but no
 * standalone index.html. This script creates one that loads the SPA
 * bundles so Capacitor can use them as its web entry point.
 *
 * Run: node scripts/capacitor-entry.js
 */
import { readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, "..");
const DIST_CLIENT = join(SITE_ROOT, "dist", "client");
const ASSETS_DIR = join(DIST_CLIENT, "assets");

// Find the main JS bundle and CSS file
const assets = readdirSync(ASSETS_DIR);
const mainJs = assets.find((f) => /^index-[A-Za-z0-9]+\.js$/.test(f));
const mainCss = assets.find((f) => /^app-[A-Za-z0-9]+\.css$/.test(f));

if (!mainJs) {
  console.error("Could not find main index JS bundle in dist/client/assets");
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#0D2818" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <title>GreenExpress</title>
  ${mainCss ? `<link rel="stylesheet" href="./assets/${mainCss}" />` : ""}
  <script>
    // Signal to api-config.ts that we're running in Capacitor
    window.__CAPACITOR__ = true;
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./assets/${mainJs}"></script>
</body>
</html>`;

writeFileSync(join(DIST_CLIENT, "index.html"), html);
console.log(
  `✓ Generated dist/client/index.html (main: ${mainJs}${mainCss ? ", css: " + mainCss : ""})`
);
