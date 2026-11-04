import assert from "assert";
import { buildKoinlyRows, toKoinlyCsv, roundTo8, format8 } from "../scripts/utils/koinly.js";

const E18 = (decimal) => {
    const [i, f = ""] = String(decimal).split(".");
    return (BigInt(i) * 10n ** 18n + BigInt((f + "0".repeat(18)).slice(0, 18))).toString();
};

const tx = (createdAt, type, fromType, walletType, value) => ({
    id: `${createdAt}-${fromType}-${type}`,
    createdAt,
    status: "success",
    type,
    fromType,
    walletType,
    valueNumeric: E18(value),
});

(async () => {
    try {
        // Rounding helpers
        assert.strictEqual(format8(roundTo8(BigInt(E18("0.123456785")))), "0.12345679");
        assert.strictEqual(format8(-150000000n), "-1.5");

        const data = [
            // Day 1: net reinvestment positive (64.27 - 43.57 = 20.70)
            tx("2026-03-01T03:00:00.000Z", "deposit", "nft-reinvestment", "VIRTUAL_GMT", "64.27"),
            tx("2026-03-01T03:00:01.000Z", "withdraw", "maintenance", "VIRTUAL_GMT", "43.57"),
            // Day 2: maintenance only -> cost
            tx("2026-03-02T03:00:00.000Z", "withdraw", "nft-game-maintenance", "VIRTUAL_GMT", "1.5"),
            // Simple earn BTC with sub-satoshi carry
            tx("2026-03-01T04:00:00.000Z", "deposit", "simple-earn-reward", "VIRTUAL_BTC", "0.000000004"),
            tx("2026-03-02T04:00:00.000Z", "deposit", "simple-earn-reward", "VIRTUAL_BTC", "0.000000004"),
            // Conversion pair with millisecond difference
            tx("2026-03-02T12:04:38.100Z", "withdraw", "asset-conversion", "VIRTUAL_GMT", "100"),
            tx("2026-03-02T12:04:38.900Z", "deposit", "asset-conversion", "VIRTUAL_USDC", "30.5"),
            // Withdraw with 10 GMT fee
            tx("2026-03-03T10:00:00.000Z", "withdraw", "withdraw", "VIRTUAL_GMT", "2010"),
            // NFT sale -> review
            tx("2026-03-03T11:00:00.000Z", "deposit", "marketplace-deposit", "VIRTUAL_GMT", "842.66"),
            // Out of range
            tx("2026-04-01T00:00:00.000Z", "deposit", "ref-bonus", "VIRTUAL_GMT", "1"),
            // Failed tx ignored
            { ...tx("2026-03-03T12:00:00.000Z", "deposit", "ref-bonus", "VIRTUAL_GMT", "5"), status: "error" },
        ];

        const { rows, review, totals } = buildKoinlyRows(data, { from: "2026-03-01", to: "2026-03-31" });

        const find = (desc, date) => rows.find((r) => r[10] === desc && r[0].startsWith(date));

        assert.deepStrictEqual(find("nft-reinvestment", "2026-03-01").slice(3, 5), ["20.7", "GOMINING"]);
        assert.strictEqual(find("nft-reinvestment", "2026-03-01")[9], "other income");
        assert.deepStrictEqual(find("maintenance", "2026-03-02").slice(1, 3), ["1.5", "GOMINING"]);
        assert.strictEqual(find("maintenance", "2026-03-02")[9], "cost");

        // 0.4 sat + 0.4 sat -> day1: 0 (skipped), day2: 0.8 sat rounds to 1 sat
        const se = rows.filter((r) => r[10] === "simple-earn-reward");
        assert.strictEqual(se.length, 1);
        assert.strictEqual(se[0][3], "0.00000001");

        const conv = rows.filter((r) => r[10] === "asset-conversion");
        assert.strictEqual(conv.length, 1);
        assert.deepStrictEqual(conv[0].slice(1, 5), ["100", "GOMINING", "30.5", "USDC"]);

        const wd = rows.find((r) => r[10].startsWith("Withdraw"));
        assert.deepStrictEqual(wd.slice(1, 3), ["2000", "GOMINING"]);
        assert.deepStrictEqual(wd.slice(5, 7), ["10", "GOMINING"]);

        assert.strictEqual(review.length, 1);
        assert.ok(review[0][10].startsWith("PRÜFEN"));
        assert.ok(!rows.some((r) => r[10] === "Bonus"));

        // Totals: GMT 20.7 - 1.5 - 100 - 2000 - 10 = -2090.8
        assert.strictEqual(totals.GOMINING, "-2090.8");
        assert.strictEqual(totals.USDC, "30.5");

        const csv = toKoinlyCsv(rows);
        assert.ok(csv.startsWith("Date,Sent Amount,Sent Currency"));
        assert.strictEqual(csv.trim().split("\n").length, rows.length + 1);

        console.log("All Koinly tests passed!");
    } catch (error) {
        console.error("Koinly test failed:", error);
        process.exit(1);
    }
})();
