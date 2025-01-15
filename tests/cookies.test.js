const assert = require("assert");
const { getBearerTokenFromCookie } = require("../scripts/utils/cookies.js");

// Mock the chrome.cookies API
global.chrome = {
    cookies: {
        // Mock implementation of chrome.cookies.getAll to return specific cookies
        getAll: (filter, callback) => {
            const mockCookies = [
                { domain: "gomining.com", name: "access_token", value: "mock_token_value" },
            ];
            callback(mockCookies);
        },
    },
};

// Test execution block
(async () => {
    try {
        // Test Case 1: Token exists
        const token = await getBearerTokenFromCookie();
        assert.strictEqual(token, "mock_token_value", "Should return the correct token");

        // Test Case 2: No token found
        global.chrome.cookies.getAll = (filter, callback) => {
            callback([]); // Simulate no cookies found
        };

        try {
            await getBearerTokenFromCookie();
            console.error("Test 2 failed: Expected an error when no token is found.\n");
        } catch (error) {
            assert.strictEqual(
                error,
                "No access_token cookie found for GoMining (gomining.com). Please log in to continue.",
                "Should throw an error when no token is found"
            );
        }
    } catch (error) {
        // Catch and log any unexpected errors during testing
        console.error(`Test failed: ${error.message}\n`);
    }
})();