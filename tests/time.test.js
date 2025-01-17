import assert from "assert";
import { formatDate } from "../scripts/utils/time.js";

(async () => {
    try {
        // Test Case 1: Format a valid date string
        const inputDate1 = "2025-01-15T12:00:00Z";
        const expectedOutput1 = "2025-01-15 12:00:00";
        const result1 = formatDate(inputDate1);
        assert.strictEqual(result1, expectedOutput1, "Should format the date string correctly");

        // Test Case 2: Adjust time by a positive offset
        const inputDate2 = "2025-01-15T12:00:00Z";
        const hourOffset2 = 3;
        const expectedOutput2 = "2025-01-15 15:00:00";
        const result2 = formatDate(inputDate2, hourOffset2);
        assert.strictEqual(result2, expectedOutput2, "Should adjust the time by +3 hours");

        // Test Case 3: Adjust time by a negative offset
        const inputDate3 = "2025-01-15T12:00:00Z";
        const hourOffset3 = -2;
        const expectedOutput3 = "2025-01-15 10:00:00";
        const result3 = formatDate(inputDate3, hourOffset3);
        assert.strictEqual(result3, expectedOutput3, "Should adjust the time by -2 hours");

        // Test Case 4: Pass a Date object directly
        const inputDate4 = new Date("2025-01-15T12:00:00Z");
        const expectedOutput4 = "2025-01-15 12:00:00";
        const result4 = formatDate(inputDate4);
        assert.strictEqual(result4, expectedOutput4, "Should format the Date object correctly");

        // Test Case 5: Invalid date input
        const inputDate5 = "Invalid date string";
        try {
            formatDate(inputDate5);
            console.error("Test 5 failed: Expected an error for invalid date input.\n");
        } catch (error) {
            assert.strictEqual(
                error instanceof Error,
                true,
                "Should throw an Error for invalid date input"
            );
        }

        console.log("All tests passed successfully.");
    } catch (error) {
        console.error(`Test failed: ${error.message}\n`);
    }
})();
