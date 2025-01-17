import assert from "assert";
import { fetchData } from "../scripts/utils/api.js";

// Mock the global fetch API
global.fetch = (url) => {
    // Simulate a successful API response
    return new Promise((resolve) => {
        resolve({
            ok: true,
            status: 200,
            json: async () => ({ data: "mock_data" }),
        });
    });
};

// Test execution block
(async () => {
    try {
        // Test Case 1: Successful API call
        const data = await fetchData(0, "mockBearerToken");
        assert.deepStrictEqual(
            data,
            { data: "mock_data" },
            "Should return mock data for a successful response"
        );

        // Test Case 2: API call fails
        global.fetch = (url) => {
            // Simulate a failed API call
            return new Promise((_, reject) => {
                reject(new Error("Network error"));
            });
        };

        try {
            await fetchData(0, "mockBearerToken");
            console.error("Test 2 failed: Expected an error on network failure.\n");
        } catch (error) {
            assert.strictEqual(
                error.message,
                "Network error",
                "Should throw a 'Network error' when the API call fails"
            );
        }

        console.log("All tests passed successfully.");
    } catch (error) {
        // Log unexpected errors during test execution
        console.error(`Test failed: ${error.message}\n`);
    }
})();
