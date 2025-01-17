import { formatDate } from './time.js';

function mapCommonFields(entry) {
    return {
        Date: formatDate(entry.createdAt),
        Label: entry.type,
        "Sent Currency": "GMT",
        "Outgoing Asset": "GMT",
        "Sent Amount": entry.value,
        "Outgoing Amount": entry.value,
        "Received Amount": "",
        "Incoming Amount": "",
        "Received Currency": "",
        "Incoming Asset": "",
        "Fee Amount": "",
        "Fee Asset (optional)": "",
        "Fee Currency": "",
        "Net Worth Amount": "",
        "Net Worth Currency": "",
        "Fee Amount (optional)": "",
        "Comment (optional)": entry.walletAddress,
        Description: entry.walletAddress,
        "Trx. ID (optional)": entry.blockchainTxId,
        TxHash: entry.blockchainTxId,
    };
}

/**
 * Maps a transaction row to Koinly format.
 * @param {Object} row - Transaction data.
 * @returns {Object} Mapped transaction for Koinly.
 */
export function mapToKoinly(entry) {
    const commonFields = mapCommonFields(entry);
    return {
        Date: commonFields.Date,
        "Sent Amount": commonFields["Sent Amount"],
        "Sent Currency": commonFields["Sent Currency"],
        "Received Amount": commonFields["Received Amount"],
        "Received Currency": commonFields["Received Currency"],
        "Fee Amount": commonFields["Fee Amount"],
        "Fee Currency": commonFields["Fee Currency"],
        "Net Worth Amount": commonFields["Net Worth Amount"],
        "Net Worth Currency": commonFields["Net Worth Currency"],
        Label: commonFields.Label,
        Description: commonFields.Description,
        TxHash: commonFields.TxHash,
    };
}

/**
 * Maps a transaction row to Blockpit format.
 * @param {Object} row - Transaction data.
 * @returns {Object} Mapped transaction for Blockpit.
 */
export function mapToBlockpit(entry) {
    const commonFields = mapCommonFields(entry);
    return {
        "Date (UTC)": commonFields.Date,
        "Integration Name": "GoMining",
        Label: commonFields.Label,
        "Outgoing Asset": commonFields["Outgoing Asset"],
        "Outgoing Amount": commonFields["Outgoing Amount"],
        "Incoming Asset": commonFields["Incoming Asset"],
        "Incoming Amount": commonFields["Incoming Amount"],
        "Fee Asset (optional)": commonFields["Fee Asset (optional)"],
        "Fee Amount (optional)": commonFields["Fee Amount (optional)"],
        "Comment (optional)": commonFields["Comment (optional)"],
        "Trx. ID (optional)": commonFields["Trx. ID (optional)"],
    };
}

// Export functions globally for the worker
self.mapToKoinly = mapToKoinly;
self.mapToBlockpit = mapToBlockpit;
