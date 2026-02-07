import assert from "assert";
import { mapPoolRewardIncomeEntry } from "../scripts/utils/api.js";

(async () => {
    try {
        // Test 1: Computes net = totalReward - (c1 + c2) and converts to GMT.
        {
            const mapped = mapPoolRewardIncomeEntry({
                createdAt: "2026-01-01T00:00:00.000Z",
                totalReward: 0.001,
                c1Value: 0.0002,
                c2Value: 0.0001,
                incomeStatistic: {
                    btcCourseInUsd: 80000,
                    gmtPrice: 0.4,
                },
            });

            assert.strictEqual(typeof mapped.createdAt, "string");
            assert.ok(mapped.createdAt.startsWith("2026-01-01T00:00:00"));
            assert.strictEqual(mapped.totalRewardBtc, 0.001);
            assert.strictEqual(mapped.totalRewardGmt, 200);
            assert.ok(Math.abs(mapped.costsBtc - 0.0003) < 1e-12);
            assert.ok(Math.abs(mapped.costsGmt - 60) < 1e-9);
            assert.ok(Math.abs(mapped.netBtc - 0.0007) < 1e-12);
            assert.ok(Math.abs(mapped.netGmt - 140) < 1e-9);
        }

        // Test 2: Prefers c1/c2 GMT values when present.
        {
            const mapped = mapPoolRewardIncomeEntry({
                date: "2026-02-01T12:34:56Z",
                totalReward: "0.002",
                c1Value: 0.0001,
                c2Value: 0.0002,
                c1ValueInGmt: 10,
                c2ValueInGmt: 5,
                incomeStatistic: {
                    btcCourseInUsd: 70000,
                    gmtPrice: 0.35,
                },
            });

            assert.strictEqual(mapped.totalRewardBtc, 0.002);
            assert.strictEqual(mapped.totalRewardGmt, 400);
            assert.strictEqual(mapped.costsGmt, 15);
            assert.strictEqual(mapped.netGmt, 385);
        }

        // Test 3: Does not compute net if costs are missing.
        {
            const mappedMissing = mapPoolRewardIncomeEntry({
                createdAt: "2026-01-01T00:00:00.000Z",
                totalReward: 0.001,
                incomeStatistic: {
                    btcCourseInUsd: 80000,
                    gmtPrice: 0.4,
                },
            });
            assert.strictEqual(mappedMissing.netGmt, null);
        }

        console.log("All tests passed successfully.");
    } catch (error) {
        console.error(`Test failed: ${error.message}\n`);
        process.exitCode = 1;
    }
})();
