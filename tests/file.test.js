import assert from "assert";
import { writeToCSV } from "../scripts/utils/file.js";

// Mock Browser APIs
global.URL = {
    // Mocking URL.createObjectURL to return a static object URL
    createObjectURL: () => "mockObjectURL",
};

global.document = {
    // Mocking document.createElement to simulate anchor elements
    createElement: (type) => {
        if (type === "a") {
            return {
                href: "",
                download: "",
                // Mock click function to set a global variable when invoked
                click: () => {
                    global.anchorClicked = true;
                },
            };
        }
        return null;
    },
};

(async () => {
    try {
        // Test: CSV generation with valid data
        const mockData = [
            { name: "Alice", age: 30, city: "Wonderland" },
            { name: "Bob", age: 25, city: "Builderland" },
        ];
        const mockHeaders = ["name", "age", "city"];
        const mockFilename = "test.csv";

        global.anchorClicked = false; // Reset the mock click state
        writeToCSV(mockFilename, mockData, mockHeaders);

        // Validate if the click method was called
        assert.strictEqual(
            global.anchorClicked,
            true,
            "Anchor element's click method was not called"
        );

        // Test: CSV generation with empty data
        const emptyData = [];
        const emptyHeaders = ["name", "age", "city"];
        const emptyFilename = "empty.csv";

        global.anchorClicked = false; // Reset the mock click state
        writeToCSV(emptyFilename, emptyData, emptyHeaders);

        // Validate if the click method was called for empty data
        assert.strictEqual(
            global.anchorClicked,
            true,
            "Anchor element's click method was not called for empty data"
        );

        // Test: CSV generation with missing headers
        const noHeaderData = [{ name: "Alice", age: 30 }];
        const noHeaders = [];
        const noHeaderFilename = "no-headers.csv";

        global.anchorClicked = false; // Reset the mock click state
        writeToCSV(noHeaderFilename, noHeaderData, noHeaders);

        // Validate if the click method was called for missing headers
        assert.strictEqual(
            global.anchorClicked,
            true,
            "Anchor element's click method was not called for missing headers"
        );
    } catch (error) {
        // Log errors if any test fails
        console.error("Test failed:", error.message);
    }
})();
