import { KOINLY_HEADER, BLOCKPIT_HEADER } from '../config.js';
import { formatDate } from './time.js';

/**
 * Maps a transaction row to Koinly format.
 * @param {Object} row - Transaction data.
 * @returns {Object} Mapped transaction for Koinly.
 */
export function mapToKoinly(row) {
    const formattedDate = formatDate(row["createdAt"], 1); // Adjust time by 1 hour

    return {
        Date: formattedDate,
        "Sent Amount": row["type"] === "deposit" ? "" : row["value"],
        "Sent Currency": row["type"] === "deposit" ? "" : "GMT",
        "Received Amount": row["type"] === "deposit" ? row["value"] : "",
        "Received Currency": row["type"] === "deposit" ? "GMT" : "",
        "Fee Amount": "",
        "Fee Currency": "",
        "Net Worth Amount": "",
        "Net Worth Currency": "",
        Label: row["type"] === "deposit" ? "Deposit" : "Withdrawal",
        Description: row["fromType"] || "",
        TxHash: row["transactionId"] || "",
    };
}

/**
 * Maps a transaction row to Blockpit format.
 * @param {Object} row - Transaction data.
 * @returns {Object} Mapped transaction for Blockpit.
 */
export function mapToBlockpit(row) {
    const formattedDate = formatDate(row["createdAt"]);

    return {
        "Date (UTC)": formattedDate,
        "Integration Name": "Gomining Portal",
        Label: row["type"] === "deposit" ? "Deposit" : "Payment",
        "Outgoing Asset": row["type"] === "deposit" ? "" : "GMT",
        "Outgoing Amount": row["type"] === "deposit" ? "" : row["value"],
        "Incoming Asset": row["type"] === "deposit" ? "GMT" : "",
        "Incoming Amount": row["type"] === "deposit" ? row["value"] : "",
        "Fee Asset (optional)": "",
        "Fee Amount (optional)": "",
        "Comment (optional)": row["fromType"] || "",
        "Trx. ID (optional)": row["transactionId"] || "",
    };
}
