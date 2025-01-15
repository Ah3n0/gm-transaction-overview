import { readdirSync } from "fs";
import { exec } from "child_process";
import path from "path";

const testDir = path.resolve(path.dirname(import.meta.url), "../tests");

const testFiles = readdirSync(testDir).filter((file) => file.endsWith(".test.js"));

testFiles.forEach((file) => {
    const filePath = path.resolve(testDir, file);
    console.log(`Running test: ${file}`);
    exec(`node "${filePath}"`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error running test: ${file}\n${stderr}`);
        } else {
            console.log(stdout);
        }
    });
});