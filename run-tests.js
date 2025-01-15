import { readdirSync } from "fs";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

// Get the current directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the test directory
const testDir = path.resolve(__dirname, "tests");

// Read all test files in the directory
const testFiles = readdirSync(testDir).filter((file) => file.endsWith(".test.js"));

// Execute each test file
testFiles.forEach((file) => {
    const filePath = path.resolve(testDir, file);
    console.log(`Running test: ${file}`);
    exec(`node "${filePath}"`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error running test: ${file}\n${stderr}`);
            process.exitCode = 1; // Set exit code to 1 if a test fails
        } else {
            console.log(stdout);
        }
    });
});
