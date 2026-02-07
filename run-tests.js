import { readdirSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

// Get the current directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the test directory
const testDir = path.resolve(__dirname, "tests");

// Read all test files in the directory
const testFiles = readdirSync(testDir).filter((file) => file.endsWith(".test.js"));

let hasFailures = false;

for (const file of testFiles) {
    const filePath = path.resolve(testDir, file);
    console.log(`Running test: ${file}`);

    const result = spawnSync(process.execPath, [filePath], {
        stdio: "inherit",
    });

    if (result.status !== 0) {
        hasFailures = true;
    }
}

if (hasFailures) {
    process.exitCode = 1;
}
