import assert from "assert";
import { fetchCheapestMarketplaceMiners, mapMarketplaceOrderToDeal } from "../scripts/utils/api.js";

(async () => {
    try {
        // Test 1: Computes and sorts by $/TH.
        {
            const calls = [];
            global.fetch = async (url, init) => {
                calls.push({ url, init });
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    json: async () => ({
                        data: {
                            array: [
                                { name: "Miner A", power: 100, priceInUsd: 1200 }, // 12 $/TH
                                { name: "Miner B", power: 50, priceInUsd: 400 },   // 8 $/TH
                                { name: "Miner C", power: 80, priceInUsd: 800 },   // 10 $/TH
                            ],
                        },
                    }),
                    text: async () => "",
                };
            };

            const result = await fetchCheapestMarketplaceMiners("mockBearer", { top: 2, scanLimit: 10, pageSize: 50 });
            assert.strictEqual(Array.isArray(result), true, "Result should be an array");
            assert.strictEqual(result.length, 2, "Should return top N");
            assert.strictEqual(result[0].name, "Miner B", "Cheapest $/TH should be first");
            assert.ok(Math.abs(result[0].usdPerTh - 8) < 1e-9, "Should compute usdPerTh");
            assert.strictEqual(result[1].name, "Miner C", "Second cheapest should be next");
            assert.strictEqual(calls.length, 1, "Should fetch a single page when scanLimit is satisfied");

            const requestBody = JSON.parse(calls[0].init.body);
            assert.deepStrictEqual(requestBody.pagination, { skip: 0, limit: 50 }, "Should request pagination");
            assert.strictEqual(requestBody.filters.currency, "GMT", "Should request GMT currency");
            assert.ok(String(calls[0].url).includes("/api/nft/marketplace-index"), "Should call nft marketplace-index endpoint");
        }

        // Test 2: Falls back to app endpoint when api endpoint returns 404.
        {
            const urls = [];
            global.fetch = async (url, init) => {
                urls.push(url);

                if (String(url).includes("api.gomining.com")) {
                    return {
                        ok: false,
                        status: 404,
                        statusText: "Not Found",
                        json: async () => ({}),
                        text: async () => "not found",
                    };
                }

                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    json: async () => ({
                        data: {
                            array: [{ name: "Miner Z", power: 10, priceInUsd: 50 }],
                        },
                    }),
                    text: async () => "",
                };
            };

            const result = await fetchCheapestMarketplaceMiners("mockBearer", { top: 1, scanLimit: 5, pageSize: 50 });
            assert.strictEqual(result.length, 1, "Should return one result");
            assert.strictEqual(result[0].name, "Miner Z", "Should use fallback endpoint payload");
            assert.strictEqual(urls.length, 2, "Should try both endpoints (404 then success)");
        }

        // Test 3: Mapping prefers externalUrlId and extracts imageUrl.
        {
            const deal = mapMarketplaceOrderToDeal({
                name: "Miner Img",
                power: 10,
                priceInUsd: 100,
                id: 12345,
                externalUrlId: "2c58f3b4-0bb6-4eaa-9c57-2c3231ad2d9e",
                // Even if a URL is provided, externalUrlId should drive the canonical nft/view/<uuid> link.
                marketplaceUrl: "https://app.gomining.com/marketplace",
                smallImageUrl: "https://cdn.example.com/miner.png",
            });

            assert.ok(deal, "Deal should map");
            assert.strictEqual(deal.marketplaceUrl, "https://app.gomining.com/nft/view/2c58f3b4-0bb6-4eaa-9c57-2c3231ad2d9e", "Should build nft/view/<uuid> URL from externalUrlId");
            assert.strictEqual(deal.imageUrl, "https://cdn.example.com/miner.png", "Should map imageUrl");
        }

        console.log("All tests passed successfully.");
    } catch (error) {
        console.error(`Test failed: ${error.message}\n`);
        process.exitCode = 1;
    }
})();
