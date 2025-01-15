import assert from "assert";

// Mock `document` object with required properties
global.document = {
    getElementById: (id) => {
        const mockElements = {
            "inspect-cookies": { style: {}, disabled: false, addEventListener: () => {} },
            "loader": { style: { display: "none" } },
            "status-label": { textContent: "", className: "", style: { display: "none" } },
            "csv-checkbox": { checked: false },
            "koinly-checkbox": { checked: false },
            "blockpit-checkbox": { checked: false },
            "start-date-picker": { value: "" },
            "clear-date": { addEventListener: () => {} },
            "version-info": { textContent: "" },
            "createdAt": { textContent: "" },
            "alias": { textContent: "" },
            "user-id": { textContent: "" },
            "email": { textContent: "" },
        };
        return mockElements[id];
    },
    querySelector: (selector) => {
        if (selector === ".container") {
            return { appendChild: () => {} };
        }
    },
    addEventListener: (event, callback) => {
        if (event === "DOMContentLoaded") {
            callback(); // Immediately invoke the callback to simulate DOMContentLoaded
        }
    },
};

// Mock browser APIs
global.chrome = {
    runtime: {
        getManifest: () => ({ version: "1.0.0" }),
    },
};

// Mock `fetch` function
global.fetch = (url, options) => {
    if (url.includes("AUTH_URL")) {
        return Promise.resolve({
            ok: true,
            json: async () => ({
                data: {
                    alias: "TestAlias",
                    id: "123",
                    email: "test@example.com",
                    createdAt: "2025-01-01T12:00:00Z",
                },
            }),
        });
    }
    return Promise.resolve({ ok: false });
};

// Import the module after mocks are set up
const { main, updateStatusLabel } = require("../scripts/popup");

(async () => {
    try {
        // Test Case 1: Update status label
        const mockStatusLabel = { textContent: "", className: "", style: { display: "none" } };
        updateStatusLabel(mockStatusLabel, "Test message", false);
        assert.strictEqual(mockStatusLabel.textContent, "Test message", "Text content should match the input message");
        assert.strictEqual(mockStatusLabel.className, "status-label success", "Class name should indicate success");
        assert.strictEqual(mockStatusLabel.style.display, "block", "Display style should be 'block'");

        // Test Case 2: Main function handles empty checkboxes
        const mockButton = global.document.getElementById("inspect-cookies");
        const mockLoader = global.document.getElementById("loader");
        const mockStatusLabel2 = global.document.getElementById("status-label");
        global.document.getElementById("csv-checkbox").checked = false;
        global.document.getElementById("koinly-checkbox").checked = false;
        global.document.getElementById("blockpit-checkbox").checked = false;

        await main();

        assert.strictEqual(
            mockStatusLabel2.textContent,
            "Please select at least one option.",
            "Should show error message when no options are selected"
        );
        assert.strictEqual(mockStatusLabel2.className, "status-label error", "Should indicate an error");

        // Test Case 3: Main function handles successful data fetch
        global.document.getElementById("csv-checkbox").checked = true;

        global.fetch = (url) =>
            Promise.resolve({
                ok: true,
                json: async () => ({
                    data: {
                        count: 1,
                        array: [{ createdAt: "2025-01-01T12:00:00Z", type: "deposit", value: 1000 }],
                    },
                }),
            });

        await main();

        assert.strictEqual(mockStatusLabel2.textContent, "Download successful!", "Should indicate successful download");
    } catch (error) {
        console.error(`Test failed: ${error.message}\n`);
    }
})();
