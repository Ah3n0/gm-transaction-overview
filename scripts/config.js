// API Endpoints and Filenames
export const BASE_URL = "https://app.gomining.com/api/virtual-wallet-transaction/index";
export const AUTH_URL = "https://api.gomining.com/api/auth/isAuth";
export const MINER_UPGRADE_URL = "https://api.gomining.com/api/internal-payment/get-my";
export const MINER_BUY_URL = "https://api.gomining.com/api/user-payments-history/index";
export const DISCOUNT_URL = "https://api.gomining.com/api/user/get-my-nft-discount";
export const MAINTENANCE_STATE_URL = "https://api.gomining.com/api/action/get-maintenance-state";
export const USER_REWARDS_URL = "https://api.gomining.com/api/nft-game/rewards-by-user";
export const CLAN_MEMBER_URL = "https://api.gomining.com/api/nft-game/clan/get-my-with-users";
export const MARKETPLACE_ORDER_URL = "https://api.gomining.com/api/nft-marketplace-order/find-by-user";
export const PUSH_SERVICE_URL = "https://api.gomining.com/api/action/push";
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
