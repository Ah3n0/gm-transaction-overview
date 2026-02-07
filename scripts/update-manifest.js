#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust paths if your files are located elsewhere:
const packageJsonPath = path.join(__dirname, "../package.json");
const manifestJsonPath = path.join(__dirname, "../manifest.json");

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

// Read manifest.json
const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, "utf-8"));

// Copy the version from package.json to manifest.json
manifestJson.version = packageJson.version;

// Write back to manifest.json
fs.writeFileSync(
  manifestJsonPath,
  JSON.stringify(manifestJson, null, 2),
  "utf-8"
);

console.log(`✅ manifest.json updated to version ${manifestJson.version}.`);