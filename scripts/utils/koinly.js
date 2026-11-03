// Builds Koinly "Universal" CSV rows from GoMining wallet transaction history.
//
// Booking scheme (matches the existing manual Koinly entries):
// - nft-reinvestment / nft-game-reinvestment minus maintenance / nft-game-maintenance (GMT)
//   are netted per UTC day -> "other income" (nft-reinvestment) or "cost" (maintenance) if negative.
// - simple-earn-reward (BTC) per UTC day, rounded to 8 decimals with carry-over.
// - gmt-fund / gmt-fund-clan-owner -> "other income" (gmt-fund)
// - bounty-program -> "other income", ref-bonus -> "airdrop" (Bonus)
// - nft-income / nft-game-income (BTC) -> "other income" (nft-income)
// - nft-game-ability-payment -> "cost" (Zauberkauf)
// - asset-conversion pairs (same second) -> trade
// - withdraw (GMT) -> withdrawal with fixed network fee; fireblocks-deposit -> deposit
// - marketplace-deposit / nft-payment / internal-payment -> review rows ("PRÜFEN")

export const KOINLY_HEADER = [
    "Date", "Sent Amount", "Sent Currency", "Received Amount", "Received Currency",
    "Fee Amount", "Fee Currency", "Net Worth Amount", "Net Worth Currency", "Label", "Description", "TxHash",
];

const SCALE = 10n ** 18n; // valueNumeric uses 18 decimals for all wallets
const STEP = 10n ** 10n; // 18 -> 8 decimals

export function currencySymbol(walletType) {
    const symbol = String(walletType || "").replace("VIRTUAL_", "");
    return symbol === "GMT" ? "GOMINING" : symbol;
}

/** Rounds an 18-decimal BigInt to 8 decimals (half up, symmetric). Returns BigInt in 1e-8 units. */
export function roundTo8(value) {
    const negative = value < 0n;
    const abs = negative ? -value : value;
    const rounded = (abs + STEP / 2n) / STEP;
    return negative ? -rounded : rounded;
}

/** Formats a BigInt in 1e-8 units as decimal string without trailing zeros. */
export function format8(units) {
    const negative = units < 0n;
    const abs = negative ? -units : units;
    const s = abs.toString().padStart(9, "0");
    const integer = s.slice(0, -8);
    const fraction = s.slice(-8).replace(/0+$/, "");
    return (negative ? "-" : "") + integer + (fraction ? `.${fraction}` : "");
}

function row({ date, sent = null, sentCur = "", received = null, receivedCur = "", fee = null, feeCur = "", label = "", description = "" }) {
    return [
        date,
        sent === null ? "" : format8(sent), sentCur,
        received === null ? "" : format8(received), receivedCur,
        fee === null ? "" : format8(fee), feeCur,
        "", "", label, description, "",
    ];
}

function utcTimestamp(iso) {
    return `${iso.slice(0, 19).replace("T", " ")} UTC`;
}

/**
 * @param {Array} transactions raw items from /api/wallet/transaction-history
 * @param {{from: string, to: string, withdrawFeeGmt?: number}} options dates as YYYY-MM-DD (UTC, inclusive)
 */
export function buildKoinlyRows(transactions, options = {}) {
    const { from = "0000-01-01", to = "9999-12-31", withdrawFeeGmt = 10 } = options;
    const withdrawFee = BigInt(Math.round(withdrawFeeGmt * 1e8)) * STEP;

    const txs = (Array.isArray(transactions) ? transactions : [])
        .filter((tx) => tx?.status === "success")
        .filter((tx) => {
            const day = String(tx.createdAt).slice(0, 10);
            return day >= from && day <= to;
        })
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));

    const rows = [];
    const review = [];
    const daily = new Map();
    const conversions = new Map();

    const addDaily = (day, key, value) => {
        if (!daily.has(day)) daily.set(day, {});
        const bucket = daily.get(day);
        bucket[key] = (bucket[key] ?? 0n) + value;
    };

    for (const tx of txs) {
        const value = BigInt(tx.valueNumeric);
        const day = tx.createdAt.slice(0, 10);
        const cur = currencySymbol(tx.walletType);
        switch (tx.fromType) {
            case "nft-reinvestment":
            case "nft-game-reinvestment":
                addDaily(day, "net", value);
                break;
            case "maintenance":
            case "nft-game-maintenance":
                addDaily(day, "net", -value);
                break;
            case "simple-earn-reward":
                addDaily(day, "simpleEarn", value);
                break;
            case "gmt-fund":
            case "gmt-fund-clan-owner":
                addDaily(day, "fund", value);
                break;
            case "bounty-program":
                addDaily(day, "bounty", value);
                break;
            case "ref-bonus":
                addDaily(day, "ref", value);
                break;
            case "nft-income":
            case "nft-game-income":
                addDaily(day, "nftIncome", value);
                break;
            case "nft-game-ability-payment":
                addDaily(day, "ability", value);
                break;
            case "asset-conversion": {
                const key = tx.createdAt.slice(0, 19);
                if (!conversions.has(key)) conversions.set(key, {});
                conversions.get(key)[tx.type] = { cur, value };
                break;
            }
            case "withdraw":
                rows.push(row({
                    date: utcTimestamp(tx.createdAt),
                    sent: roundTo8(value - withdrawFee), sentCur: cur,
                    fee: roundTo8(withdrawFee), feeCur: cur,
                    description: `Withdraw ${cur}`,
                }));
                break;
            case "fireblocks-deposit":
                rows.push(row({ date: utcTimestamp(tx.createdAt), received: roundTo8(value), receivedCur: cur, description: `Deposit ${cur}` }));
                break;
            case "income-withdraw-order":
                rows.push(row({ date: utcTimestamp(tx.createdAt), sent: roundTo8(value), sentCur: cur, description: `Withdraw ${cur}` }));
                break;
            case "marketplace-deposit":
                review.push(row({ date: utcTimestamp(tx.createdAt), sent: 100000000n, sentCur: "MINEBOX", received: roundTo8(value), receivedCur: cur, description: "PRÜFEN: NFT sold (marketplace) - Anzahl MINEBOX anpassen" }));
                break;
            case "nft-payment":
                review.push(row({ date: utcTimestamp(tx.createdAt), sent: roundTo8(value), sentCur: cur, received: 100000000n, receivedCur: "MINEBOX", description: "PRÜFEN: NFT buy" }));
                break;
            case "internal-payment":
                review.push(row({ date: utcTimestamp(tx.createdAt), sent: roundTo8(value), sentCur: cur, received: 100000000n, receivedCur: "MINEBOX", description: "PRÜFEN: NFT upgrade" }));
                break;
            default:
                review.push(row({
                    date: utcTimestamp(tx.createdAt),
                    ...(tx.type === "deposit" ? { received: roundTo8(value), receivedCur: cur } : { sent: roundTo8(value), sentCur: cur }),
                    description: `PRÜFEN: unbekannter Typ ${tx.fromType}`,
                }));
        }
    }

    for (const [key, pair] of conversions) {
        const sent = pair.withdraw;
        const received = pair.deposit;
        rows.push(row({
            date: `${key.replace("T", " ")} UTC`,
            sent: sent ? roundTo8(sent.value) : null, sentCur: sent?.cur ?? "",
            received: received ? roundTo8(received.value) : null, receivedCur: received?.cur ?? "",
            description: "asset-conversion",
        }));
    }

    let simpleEarnCarry = 0n;
    for (const day of Array.from(daily.keys()).sort()) {
        const b = daily.get(day);
        const date = `${day} 00:00:00 UTC`;
        if (b.net !== undefined) {
            const net = roundTo8(b.net);
            if (net > 0n) rows.push(row({ date, received: net, receivedCur: "GOMINING", label: "other income", description: "nft-reinvestment" }));
            else if (net < 0n) rows.push(row({ date, sent: -net, sentCur: "GOMINING", label: "cost", description: "maintenance" }));
        }
        if (b.simpleEarn !== undefined) {
            const total = b.simpleEarn + simpleEarnCarry;
            const rounded = roundTo8(total);
            simpleEarnCarry = total - rounded * STEP;
            if (rounded > 0n) rows.push(row({ date, received: rounded, receivedCur: "BTC", label: "other income", description: "simple-earn-reward" }));
        }
        if (b.fund) rows.push(row({ date, received: roundTo8(b.fund), receivedCur: "GOMINING", label: "other income", description: "gmt-fund" }));
        if (b.bounty) rows.push(row({ date, received: roundTo8(b.bounty), receivedCur: "GOMINING", label: "other income", description: "bounty-program" }));
        if (b.ref) rows.push(row({ date, received: roundTo8(b.ref), receivedCur: "GOMINING", label: "airdrop", description: "Bonus" }));
        if (b.nftIncome) rows.push(row({ date, received: roundTo8(b.nftIncome), receivedCur: "BTC", label: "other income", description: "nft-income" }));
        if (b.ability) rows.push(row({ date, sent: roundTo8(b.ability), sentCur: "GOMINING", label: "cost", description: "Zauberkauf" }));
    }

    const byDate = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    rows.sort(byDate);
    review.sort(byDate);

    // Net totals per currency of the regular rows (received - sent - fee)
    const totalsUnits = {};
    for (const r of rows) {
        const apply = (amount, currency, sign) => {
            if (!amount) return;
            const [i, f = ""] = amount.split(".");
            const units = BigInt(i) * 100000000n + BigInt((f + "00000000").slice(0, 8));
            totalsUnits[currency] = (totalsUnits[currency] ?? 0n) + sign * units;
        };
        apply(r[1], r[2], -1n);
        apply(r[3], r[4], 1n);
        apply(r[5], r[6], -1n);
    }
    const totals = Object.fromEntries(Object.entries(totalsUnits).map(([k, v]) => [k, format8(v)]));

    return { rows, review, totals };
}

function csvCell(value) {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toKoinlyCsv(rows) {
    return [KOINLY_HEADER, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}

export { SCALE };
