const { readdirSync } = require("fs");
const { exec } = require("child_process");
const path = require("path");

const testDir = path.resolve(__dirname, "tests");
const testFiles = readdirSync(testDir).filter((file) => file.endsWith(".test.js"));

let hasError = false;

testFiles.forEach((file) => {
    const filePath = path.resolve(testDir, file);
    console.log(`Running test: ${file}`);
    exec(`node "${filePath}"`, (err, stdout, stderr) => {
        if (err) {
            hasError = true;
            console.error(`Error running test: ${file}\n${stderr}`);
        } else {
            console.log(stdout);
        }
    });
});

process.on("exit", () => {
    if (hasError) process.exit(1);
});
