// config.js

// API Endpoints and Filenames
export const BASE_URL = "https://app.gomining.com/api/virtual-wallet-transaction/index";
export const AUTH_URL = "https://api.gomining.com/api/auth/isAuth";
export const OUTPUT_CSV_FILE = "output.csv";
export const KOINLY_CSV_FILE = "koinly_formatted.csv";
export const BLOCKPIT_CSV_FILE = "blockpit_formatted.csv";

// CSV Headers
export const CSV_HEADER = [
    "walletType",
    "id",
    "createdAt",
    "updatedAt",
    "blockchainTxId",
    "walletId",
    "status",
    "value",
    "valueNumeric",
    "type",
    "walletAddress",
    "externalRequestId",
    "fromType",
    "transactionId",
];

export const KOINLY_HEADER = [
    "Date",
    "Sent Amount",
    "Sent Currency",
    "Received Amount",
    "Received Currency",
    "Fee Amount",
    "Fee Currency",
    "Net Worth Amount",
    "Net Worth Currency",
    "Label",
    "Description",
    "TxHash",
];

export const BLOCKPIT_HEADER = [
    "Date (UTC)",
    "Integration Name",
    "Label",
    "Outgoing Asset",
    "Outgoing Amount",
    "Incoming Asset",
    "Incoming Amount",
    "Fee Asset (optional)",
    "Fee Amount (optional)",
    "Comment (optional)",
    "Trx. ID (optional)",
];

// Mapping Functions
export function mapToKoinly(row) {
    const originalDate = new Date(row["createdAt"]);
    const adjustedDate = new Date(originalDate.getTime() + 1 * 60 * 60 * 1000); // Add 1 hour
    const formattedDate = adjustedDate.toISOString().replace("T", " ").split(".")[0];

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

export function mapToBlockpit(row) {
    const originalDate = new Date(row["createdAt"]);
    const formattedDate = originalDate.toISOString().replace("T", " ").split(".")[0];

    return {
        "Date (UTC)": formattedDate,
        "Integration Name": "Gomining Portal", // Fester Wert basierend auf Vorlage
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
