// API Endpoints and Filenames
export const BASE_URL = "https://app.gomining.com/api/virtual-wallet-transaction/index";
export const AUTH_URL = "https://api.gomining.com/api/auth/isAuth";
export const MINER_UPGRADE_URL = "https://api.gomining.com/api/internal-payment/get-my";
export const MINER_BUY_URL = "https://api.gomining.com/api/user-payments-history/index";
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
