const { readdirSync } = require('fs');
const { exec } = require('child_process');
const path = require('path');

const testDir = path.resolve(__dirname, 'tests');

const testFiles = readdirSync(testDir).filter((file) => file.endsWith('.test.js'));

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
