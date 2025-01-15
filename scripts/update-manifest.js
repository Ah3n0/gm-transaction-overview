#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Adjust paths if your files are located elsewhere:
const packageJsonPath = path.join(__dirname, "../package.json");
const manifestJsonPath = path.join(__dirname, "../manifest.json");

// 1. Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

// 2. Read manifest.json
const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, "utf-8"));

// 3. Copy the version from package.json to manifest.json
manifestJson.version = packageJson.version;

// 4. Write back to manifest.json
fs.writeFileSync(
  manifestJsonPath,
  JSON.stringify(manifestJson, null, 2),
  "utf-8"
);

console.log(`✅ manifest.json updated to version ${manifestJson.version}.`);