import assert from "assert";
import { fetchClanMember } from "../scripts/utils/api.js";

let callCount = 0;

// Mock fetch used by fetchFromAPI (api.js)
global.fetch = async (url, init) => {
    callCount += 1;
    const body = init?.body ? JSON.parse(init.body) : undefined;

    // 1) My-clan endpoint returns clan info but no members (shape change)
    if (url.includes("/api/nft-game/clan/get-my-with-users")) {
        // Endpoint removed
        return {
            ok: false,
            status: 404,
            statusText: "Not Found",
            text: async () => "not found",
        };
    }

    if (url.includes("/api/nft-game/clan/get-my")) {
        // New endpoint variant returns clan id but no member list
        return {
            ok: true,
            status: 200,
            json: async () => ({
                data: {
                    id: 21854,
                },
            }),
        };
    }

    // 2) get-by-id returns members in usersForClient
    assert.ok(url.includes("/api/nft-game/clan/get-by-id"), "Expected get-by-id to be called");
    assert.strictEqual(body.clanId, 21854, "Expected clanId to be passed to get-by-id");
    assert.ok(body.pagination && typeof body.pagination.skip === "number", "Expected pagination in get-by-id payload");

    const limit = body.pagination.limit;
    const skip = body.pagination.skip;

    // First page full, second page partial -> stop
    if (skip === 0) {
        return {
            ok: true,
            status: 200,
            json: async () => ({
                data: {
                    usersForClient: Array.from({ length: limit }, (_, i) => ({
                        alias: `Member${i}`,
                        joinDate: "2026-02-01T00:00:00.000Z",
                        power: 1,
                        usedNftGameAbilities: [],
                    })),
                    usersCount: limit + 1,
                },
            }),
        };
    }

    return {
        ok: true,
        status: 200,
        json: async () => ({
            data: {
                usersForClient: [
                    {
                        alias: "LastMember",
                        joinDate: "2026-02-02T00:00:00.000Z",
                        power: 2,
                        usedNftGameAbilities: [],
                    },
                ],
                usersCount: limit + 1,
            },
        }),
    };
};

(async () => {
    try {
        const result = await fetchClanMember("mockBearerToken");
        const members = result?.data?.usersForClient;

        assert.ok(Array.isArray(members), "Expected usersForClient to be an array");
        assert.strictEqual(members.length, 51, "Expected to aggregate members via get-by-id pagination");
        assert.ok(callCount >= 2, "Expected at least my-clan + get-by-id calls");

        console.log("All tests passed successfully.");
    } catch (error) {
        console.error(`Test failed: ${error.message}\n`);
        process.exitCode = 1;
    }
})();
