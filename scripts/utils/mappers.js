import { KOINLY_HEADER, BLOCKPIT_HEADER } from '../config.js';
import { formatDate } from './time.js';

/**
 * Maps a transaction row to Koinly format.
 * @param {Object} row - Transaction data.
 * @returns {Object} Mapped transaction for Koinly.
 */
export function mapToKoinly(entry) {
    return {
        Date: entry.createdAt,
        "Sent Amount": entry.value,
        "Sent Currency": "GMT",
        "Received Amount": "",
        "Received Currency": "",
        "Fee Amount": "",
        "Fee Currency": "",
        "Net Worth Amount": "",
        "Net Worth Currency": "",
        Label: entry.type,
        Description: entry.walletAddress,
        TxHash: entry.blockchainTxId,
    };
}

/**
 * Maps a transaction row to Blockpit format.
 * @param {Object} row - Transaction data.
 * @returns {Object} Mapped transaction for Blockpit.
 */
export function mapToBlockpit(entry) {
    return {
        "Date (UTC)": entry.createdAt,
        "Integration Name": "GoMining",
        Label: entry.type,
        "Outgoing Asset": "GMT",
        "Outgoing Amount": entry.value,
        "Incoming Asset": "",
        "Incoming Amount": "",
        "Fee Asset (optional)": "",
        "Fee Amount (optional)": "",
        "Comment (optional)": entry.walletAddress,
        "Trx. ID (optional)": entry.blockchainTxId,
    };
}

// Export functions globally for the worker
self.mapToKoinly = mapToKoinly;
self.mapToBlockpit = mapToBlockpit;
