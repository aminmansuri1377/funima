import { copyFileSync, mkdirSync } from "node:fs";

import { createRequire } from "node:module";

import path from "node:path";

const require = createRequire(import.meta.url);

/*
 * ========================================
 * MapLibre Worker
 * ========================================
 */

const maplibrePackagePath = require.resolve("maplibre-gl/package.json");

const maplibreDist = path.join(path.dirname(maplibrePackagePath), "dist");

const maplibreDestination = path.join(process.cwd(), "public", "maplibre");

mkdirSync(maplibreDestination, {
  recursive: true,
});

const maplibreFiles = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

for (const file of maplibreFiles) {
  copyFileSync(
    path.join(maplibreDist, file),

    path.join(maplibreDestination, file),
  );
}

/*
 * ========================================
 * RTL Plugin
 * ========================================
 *
 * require.resolve package را به:
 *
 * node_modules/@mapbox/mapbox-gl-rtl-text/src/index.js
 *
 * می‌رساند.
 *
 * بنابراین یک level بالا می‌رویم
 * و فایل dist رسمی package را کپی می‌کنیم.
 */

const rtlEntry = require.resolve("@mapbox/mapbox-gl-rtl-text");

const rtlPackageRoot = path.resolve(path.dirname(rtlEntry), "..");

const rtlSource = path.join(rtlPackageRoot, "dist", "mapbox-gl-rtl-text.js");

const rtlDestination = path.join(
  process.cwd(),
  "public",
  "mapbox-gl-rtl-text.js",
);

copyFileSync(rtlSource, rtlDestination);

console.log("MapLibre assets copied.");
