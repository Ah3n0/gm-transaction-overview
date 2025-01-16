import assert from "assert";
import { mapToKoinly, mapToBlockpit } from "../scripts/utils/mappers.js";

// Mock formatDate function
const originalFormatDate = require("../scripts/utils/time.js").formatDate;
require("../scripts/utils/time.js").formatDate = (date, hourOffset = 0) => {
    return `${date}_formatted_with_offset_${hourOffset}`;
};

(async () => {
    try {
        // Sample transaction row
        const sampleRow = {
            createdAt: "2025-01-15T12:00:00Z",
            type: "deposit",
            value: 1000,
            fromType: "Gomining Wallet",
            transactionId: "abc123",
        };

        // Test Case 1: mapToKoinly with deposit
        const expectedKoinlyOutput = {
            Date: "2025-01-15T12:00:00Z_formatted_with_offset_1",
            "Sent Amount": "",
            "Sent Currency": "",
            "Received Amount": 1000,
            "Received Currency": "GMT",
            "Fee Amount": "",
            "Fee Currency": "",
            "Net Worth Amount": "",
            "Net Worth Currency": "",
            Label: "Deposit",
            Description: "Gomining Wallet",
            TxHash: "abc123",
        };
        const koinlyResult = mapToKoinly(sampleRow);
        assert.deepStrictEqual(
            koinlyResult,
            expectedKoinlyOutput,
            "mapToKoinly did not map the deposit transaction correctly"
        );

        // Test Case 2: mapToKoinly with withdrawal
        const withdrawalRow = { ...sampleRow, type: "withdrawal" };
        const expectedKoinlyWithdrawalOutput = {
            Date: "2025-01-15T12:00:00Z_formatted_with_offset_1",
            "Sent Amount": 1000,
            "Sent Currency": "GMT",
            "Received Amount": "",
            "Received Currency": "",
            "Fee Amount": "",
            "Fee Currency": "",
            "Net Worth Amount": "",
            "Net Worth Currency": "",
            Label: "Withdrawal",
            Description: "Gomining Wallet",
            TxHash: "abc123",
        };
        const koinlyWithdrawalResult = mapToKoinly(withdrawalRow);
        assert.deepStrictEqual(
            koinlyWithdrawalResult,
            expectedKoinlyWithdrawalOutput,
            "mapToKoinly did not map the withdrawal transaction correctly"
        );

        // Test Case 3: mapToBlockpit with deposit
        const expectedBlockpitOutput = {
            "Date (UTC)": "2025-01-15T12:00:00Z_formatted_with_offset_0",
            "Integration Name": "Gomining Portal",
            Label: "Deposit",
            "Outgoing Asset": "",
            "Outgoing Amount": "",
            "Incoming Asset": "GMT",
            "Incoming Amount": 1000,
            "Fee Asset (optional)": "",
            "Fee Amount (optional)": "",
            "Comment (optional)": "Gomining Wallet",
            "Trx. ID (optional)": "abc123",
        };
        const blockpitResult = mapToBlockpit(sampleRow);
        assert.deepStrictEqual(
            blockpitResult,
            expectedBlockpitOutput,
            "mapToBlockpit did not map the deposit transaction correctly"
        );

        // Test Case 4: mapToBlockpit with withdrawal
        const expectedBlockpitWithdrawalOutput = {
            "Date (UTC)": "2025-01-15T12:00:00Z_formatted_with_offset_0",
            "Integration Name": "Gomining Portal",
            Label: "Payment",
            "Outgoing Asset": "GMT",
            "Outgoing Amount": 1000,
            "Incoming Asset": "",
            "Incoming Amount": "",
            "Fee Asset (optional)": "",
            "Fee Amount (optional)": "",
            "Comment (optional)": "Gomining Wallet",
            "Trx. ID (optional)": "abc123",
        };
        const blockpitWithdrawalResult = mapToBlockpit(withdrawalRow);
        assert.deepStrictEqual(
            blockpitWithdrawalResult,
            expectedBlockpitWithdrawalOutput,
            "mapToBlockpit did not map the withdrawal transaction correctly"
        );
    } catch (error) {
        console.error(`Test failed: ${error.message}\n`);
    } finally {
        // Restore original formatDate function
        require("../scripts/utils/time.js").formatDate = originalFormatDate;
    }
})();
