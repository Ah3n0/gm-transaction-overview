import { MINER_UPGRADE_URL, MINER_BUY_URL, MY_NFT_URL, DISCOUNT_URL, MAINTENANCE_STATE_URL, USER_REWARDS_URL, NFT_GAME_INCOME_URL, NFT_GAME_INCOME_APP_URL, CLAN_MEMBER_URL, CLAN_MY_URL, CLAN_BY_ID_URL, MARKETPLACE_ORDER_URL, MARKETPLACE_ORDER_INDEX_URL, MARKETPLACE_ORDER_INDEX_APP_URL, NFT_MARKETPLACE_INDEX_URL, NFT_MARKETPLACE_INDEX_APP_URL, PUSH_SERVICE_URL, WALLET_TX_HISTORY_URL } from "../config.js";

function toFiniteNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function toDateString(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
}

export function mapPoolRewardIncomeEntry(entry) {
    // New API: find-aggregated-by-date
    // Interest: totalReward (BTC) + gmtPrice (USD/GMT)
    const createdAt = toDateString(entry?.createdAt) ?? null;

    const totalRewardBtc = toFiniteNumber(entry?.totalReward);
    const c1ValueBtc = toFiniteNumber(entry?.c1Value);
    const c2ValueBtc = toFiniteNumber(entry?.c2Value);
    const c1ValueInGmt = toFiniteNumber(entry?.c1ValueInGmt);
    const c2ValueInGmt = toFiniteNumber(entry?.c2ValueInGmt);

    const btcCourseInUsd = toFiniteNumber(entry?.incomeStatistic?.btcCourseInUsd);
    const gmtPrice = toFiniteNumber(entry?.incomeStatistic?.gmtPrice);

    const totalRewardGmt =
        totalRewardBtc === null || btcCourseInUsd === null || gmtPrice === null || gmtPrice === 0
            ? null
            : (totalRewardBtc * btcCourseInUsd) / gmtPrice;

    // Costs (PR + Electricity) appear as c1/c2 values.
    // Prefer server-provided GMT values (c1ValueInGmt/c2ValueInGmt) if present; otherwise convert BTC costs to GMT.
    const costsBtc = c1ValueBtc === null || c2ValueBtc === null ? null : c1ValueBtc + c2ValueBtc;

    const costsGmtFromApi = c1ValueInGmt === null || c2ValueInGmt === null ? null : c1ValueInGmt + c2ValueInGmt;

    const costsGmtFromBtc =
        costsGmtFromApi === null && costsBtc !== null && btcCourseInUsd !== null && gmtPrice !== null && gmtPrice !== 0
            ? (costsBtc * btcCourseInUsd) / gmtPrice
            : null;

    const costsGmt = costsGmtFromApi ?? costsGmtFromBtc;

    const netBtc = totalRewardBtc === null || costsBtc === null ? null : totalRewardBtc - costsBtc;
    const netGmt = totalRewardGmt === null || costsGmt === null ? null : totalRewardGmt - costsGmt;

    return {
        createdAt,
        totalRewardBtc,
        c1ValueBtc,
        c2ValueBtc,
        c1ValueInGmt,
        c2ValueInGmt,
        costsBtc,
        costsGmt,
        gmtPrice,
        btcCourseInUsd,
        totalRewardGmt,
        netBtc,
        netGmt,
        toWalletType: entry?.toWalletType ?? null,
    };
}

function createApiError({ url, status, statusText, responseText }) {
    const suffix = responseText ? `: ${responseText}` : "";
    const message = `API request failed (${status}) ${statusText}${suffix}`;

    const error = new Error(message);
    error.url = url;
    error.status = status;
    error.statusText = statusText;
    error.responseText = responseText;
    return error;
}

async function fetchFromAPI(url, body, bearerToken, options = {}) {
    const { method = "POST" } = options;

    const headers = {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
    };

    const init = {
        method,
        headers,
        ...(method === "GET" ? {} : { body: JSON.stringify(body ?? {}) }),
    };

    const response = await fetch(url, init);

    if (!response.ok) {
        const responseText = await response.text().catch(() => "");
        if (response.status === 401) {
            throw createApiError({
                url,
                status: response.status,
                statusText: "Unauthorized",
                responseText: responseText || "Please ensure you are logged in.",
            });
        }

        throw createApiError({
            url,
            status: response.status,
            statusText: response.statusText,
            responseText,
        });
    }

    try {
        return await response.json();
    } catch (error) {
        const responseText = await response.text().catch(() => "");
        throw createApiError({
            url,
            status: response.status,
            statusText: "Invalid JSON",
            responseText,
        });
    }
}

async function fetchFromPublicAPI(url, body, options = {}) {
    const { method = "POST" } = options;

    const headers = {
        "Content-Type": "application/json",
    };

    const init = {
        method,
        headers,
        credentials: "omit",
        ...(method === "GET" ? {} : { body: JSON.stringify(body ?? {}) }),
    };

    const response = await fetch(url, init);

    if (!response.ok) {
        const responseText = await response.text().catch(() => "");
        throw createApiError({
            url,
            status: response.status,
            statusText: response.statusText,
            responseText,
        });
    }

    try {
        return await response.json();
    } catch (error) {
        const responseText = await response.text().catch(() => "");
        throw createApiError({
            url,
            status: response.status,
            statusText: "Invalid JSON",
            responseText,
        });
    }
}

async function fetchFromCookieAPI(url, body, options = {}) {
    const { method = "POST" } = options;

    const headers = {
        "Content-Type": "application/json",
    };

    const init = {
        method,
        headers,
        credentials: "include",
        ...(method === "GET" ? {} : { body: JSON.stringify(body ?? {}) }),
    };

    const response = await fetch(url, init);

    if (!response.ok) {
        const responseText = await response.text().catch(() => "");
        throw createApiError({
            url,
            status: response.status,
            statusText: response.statusText,
            responseText,
        });
    }

    try {
        return await response.json();
    } catch (error) {
        const responseText = await response.text().catch(() => "");
        throw createApiError({
            url,
            status: response.status,
            statusText: "Invalid JSON",
            responseText,
        });
    }
}

export async function fetchNFT(skip, bearerToken) {
    const body = {
        filters: { withCanceled: false },
        pagination: { skip: skip, limit: 50 }
    };
    return fetchFromAPI(MINER_BUY_URL, body, bearerToken);
}

// Fetch all owned NFTs (includes gifted) from the dedicated endpoint.
export async function fetchMyNfts(bearerToken) {
    const body = {};
    return fetchFromAPI(MY_NFT_URL, body, bearerToken);
}

export async function fetchUpgradesNFT(skip, bearerToken) {
    const body = {
        filters: {
            status: {
                in: ["canceled", "pending", "success", "error", "waitingForProviderConfirmation", "approvedByProvider", "waitingForConfirmation"]
            }
        },
        sort: { createdAt: "DESC" },
        pagination: { skip: skip, limit: 50 }
    };
    return fetchFromAPI(MINER_UPGRADE_URL, body, bearerToken);
}

export async function fetchDiscount(bearerToken) {
    const body = {};
    return fetchFromAPI(DISCOUNT_URL, body, bearerToken);
}

export async function fetchMaintenanceState(bearerToken) {
    const body = {};
    return fetchFromAPI(MAINTENANCE_STATE_URL, body, bearerToken);
}

export async function fetchUserRewards(bearerToken) {
    const body = {
        filters: { type: "user" },
        pagination: { skip: 0, limit: 40 }
    };
    return fetchFromAPI(USER_REWARDS_URL, body, bearerToken);
}

export async function fetchNftGameIncome(bearerToken, options = {}) {
    const { startDate, endDate, limit = 20, skip = 0 } = options;
    const body = { startDate, endDate, limit, skip };

    // Primary endpoint on api.gomining.com. Fallback to app.gomining.com if it returns 404.
    try {
        return await fetchFromAPI(NFT_GAME_INCOME_URL, body, bearerToken);
    } catch (error) {
        if (error?.status === 404) {
            return await fetchFromAPI(NFT_GAME_INCOME_APP_URL, body, bearerToken);
        }
        throw error;
    }
}

export async function fetchClanMember(bearerToken) {
    const limit = 50;
    const maxPages = 200;

    let allMembers = [];
    let skip = 0;
    let paginationMode = "unknown"; // "pagination" | "single"

    const extractMembers = (response) => {
        const data = response?.data;
        if (Array.isArray(data)) return data;

        // The API response shape has changed before. Be defensive.
        const candidates = [
            data?.usersForClient,
            data?.users,
            data?.array,
            data?.members,
            data?.items,
        ];

        const firstArray = candidates.find((value) => Array.isArray(value));
        return firstArray ?? [];
    };

    const extractClanId = (response) => {
        const data = response?.data;
        const id = data?.id ?? data?.clanId ?? data?.clan?.id;
        return typeof id === "number" ? id : null;
    };

    const fetchClanById = async ({ clanId, skip, limit }) => {
        // Payload based on observed API behavior
        const body = {
            clanId,
            pagination: { limit, skip, count: 0 },
            filters: { filterType: "none" },
            sort: { sortType: "none" },
        };

        return fetchFromAPI(CLAN_BY_ID_URL, body, bearerToken);
    };

    const fetchWithFallbacks = async (url, body) => {
        try {
            return await fetchFromAPI(url, body, bearerToken);
        } catch (error) {
            // Some backends changed from POST to GET.
            if (error?.status === 405) {
                return await fetchFromAPI(url, undefined, bearerToken, { method: "GET" });
            }

            throw error;
        }
    };

    const fetchMyClan = async (body) => {
        const candidates = [CLAN_MEMBER_URL, CLAN_MY_URL];

        let lastError;
        for (const url of candidates) {
            try {
                return await fetchWithFallbacks(url, body);
            } catch (error) {
                // If endpoint does not exist, try the next one.
                if (error?.status === 404) {
                    lastError = error;
                    continue;
                }
                throw error;
            }
        }

        throw lastError ?? new Error("No clan endpoint available.");
    };

    // 1) Try "my clan" endpoint first (historical behavior)
    //    If it returns users -> we are done.
    //    If it returns only clan info/id -> use get-by-id to fetch members.
    let clanIdFromMyClan = null;

    for (let page = 1; page <= maxPages; page++) {
        let response;

        // Prefer pagination. If the API no longer supports it, fall back to a single request.
        if (paginationMode !== "single") {
            try {
                response = await fetchMyClan({ pagination: { skip, limit } });
                paginationMode = "pagination";
            } catch (error) {
                // If pagination is rejected (often 400/422), try a single-call mode once.
                if (page === 1 && (error?.status === 400 || error?.status === 404 || error?.status === 422)) {
                    response = await fetchMyClan({});
                    paginationMode = "single";
                } else {
                    throw error;
                }
            }
        } else {
            response = await fetchMyClan({});
        }

        if (page === 1) {
            clanIdFromMyClan = extractClanId(response);
        }

        let members = extractMembers(response);

        // If "my clan" endpoint no longer includes members, use get-by-id.
        if (page === 1 && members.length === 0 && clanIdFromMyClan) {
            let byIdSkip = 0;
            for (let byIdPage = 1; byIdPage <= maxPages; byIdPage++) {
                const byIdResponse = await fetchClanById({ clanId: clanIdFromMyClan, skip: byIdSkip, limit });
                const byIdMembers = byIdResponse?.data?.usersForClient ?? [];

                if (Array.isArray(byIdMembers) && byIdMembers.length > 0) {
                    allMembers = allMembers.concat(byIdMembers);
                }

                const usersCount = typeof byIdResponse?.data?.usersCount === "number" ? byIdResponse.data.usersCount : null;
                byIdSkip += limit;

                if (!Array.isArray(byIdMembers) || byIdMembers.length < limit) {
                    break;
                }

                if (usersCount !== null && byIdSkip >= usersCount) {
                    break;
                }
            }

            return { data: { usersForClient: allMembers } };
        }

        allMembers = allMembers.concat(members);
        skip += limit;

        if (paginationMode === "single") {
            break;
        }

        // Stop when we receive less than a full page.
        if (members.length < limit) {
            break;
        }
    }

    return { data: { usersForClient: allMembers } };
}

export async function fetchMarketplaceOrders(bearerToken, options = {}) {
    // v2 endpoint: requires status filter, returns { data: { array, count } } with `nft` objects.
    const { statuses = ["success", "canceled", "created", "waitingForPayment", "waitingForNFtSend", "not-approved"], limit = 50 } = options;
    let skip = 0;
    let all = [];
    for (let page = 0; page < 50; page++) {
        const body = { filters: { statuses }, pagination: { skip, limit } };
        const response = await fetchFromAPI(MARKETPLACE_ORDER_URL, body, bearerToken);
        const array = response?.data?.array ?? [];
        all = all.concat(array);
        const count = response?.data?.count;
        skip += limit;
        if (array.length < limit || (typeof count === "number" && skip >= count)) break;
    }
    return { data: { array: all, count: all.length } };
}

export function getOrderNftId(order) {
    return order?.nftId ?? order?.nft?.id ?? null;
}

export const WALLET_TYPES = ["VIRTUAL_BNB", "VIRTUAL_BTC", "VIRTUAL_ETH", "VIRTUAL_GMT", "VIRTUAL_SOL", "VIRTUAL_TON", "VIRTUAL_USDC", "VIRTUAL_USDT"];

/**
 * Fetches the complete wallet transaction history (newest first) back to `since` (ISO date, optional).
 * Pagination is cursor based: cursor = createdAt (ms) of the last item of the previous page.
 */
export async function fetchWalletTransactionHistory(bearerToken, options = {}) {
    const { since = null, limit = 100, maxPages = 500 } = options;
    const sinceMs = since ? new Date(since).getTime() : null;
    const seen = new Set();
    const all = [];
    let cursor = Date.now();
    for (let page = 0; page < maxPages; page++) {
        const body = { filter: { walletType: WALLET_TYPES, fromType: null, range: null }, pagination: { cursor, limit } };
        const response = await fetchFromAPI(WALLET_TX_HISTORY_URL, body, bearerToken);
        const array = response?.data?.array ?? [];
        let added = 0;
        for (const tx of array) {
            if (seen.has(tx.id)) continue;
            seen.add(tx.id);
            all.push(tx);
            added++;
        }
        if (array.length === 0 || added === 0 || array.length < limit) break;
        const lastMs = new Date(array[array.length - 1].createdAt).getTime();
        if (sinceMs !== null && lastMs < sinceMs) break;
        cursor = lastMs >= cursor ? cursor - 1 : lastMs;
    }
    return sinceMs === null ? all : all.filter((tx) => new Date(tx.createdAt).getTime() >= sinceMs);
}

async function fetchMarketplaceOrderIndexPage(bearerToken, body) {
    const apiUrl = MARKETPLACE_ORDER_INDEX_URL;
    const appUrl = MARKETPLACE_ORDER_INDEX_APP_URL;

    const attempts = [];

    const recordAttempt = (mode, url, error) => {
        attempts.push({
            mode,
            url,
            status: error?.status,
            statusText: error?.statusText,
            responseText: error?.responseText,
        });
    };

    const isInvalidAudience = (error) => {
        const responseText = String(error?.responseText ?? "");
        return error?.status === 403 && responseText.includes("INVALID_AUDIENCE");
    };

    // 0) Try without any auth at all (some listing endpoints may be public).
    try {
        return await fetchFromPublicAPI(apiUrl, body);
    } catch (error) {
        recordAttempt("public", apiUrl, error);
    }

    try {
        return await fetchFromPublicAPI(appUrl, body);
    } catch (error) {
        recordAttempt("public", appUrl, error);
    }

    // 1) Try API endpoint with bearer token (preferred).
    try {
        return await fetchFromAPI(apiUrl, body, bearerToken);
    } catch (error) {
        recordAttempt("bearer", apiUrl, error);
        // Some endpoints validate JWT audience differently.
        if (error?.status !== 404 && !isInvalidAudience(error)) {
            // For non-expected failures, bubble up immediately.
            // (404 and INVALID_AUDIENCE will fall back to app/cookie flows)
            throw error;
        }
    }

    // 2) Try APP endpoint with bearer token.
    try {
        return await fetchFromAPI(appUrl, body, bearerToken);
    } catch (error) {
        recordAttempt("bearer", appUrl, error);
        if (error?.status !== 404 && !isInvalidAudience(error)) {
            throw error;
        }
    }

    // 3) Try APP endpoint with cookies (no bearer token).
    try {
        return await fetchFromCookieAPI(appUrl, body);
    } catch (error) {
        recordAttempt("cookie", appUrl, error);
        const enriched = error instanceof Error ? error : new Error(String(error));
        enriched.marketplaceAttempts = attempts;
        throw enriched;
    }
}

export function extractMarketplaceOrderArray(response) {
    const data = response?.data;
    if (Array.isArray(data)) return data;

    const candidates = [
        data?.array,
        data?.items,
        data?.orders,
        data?.list,
        data?.result,
    ];

    const firstArray = candidates.find((value) => Array.isArray(value));
    return firstArray ?? [];
}

function toNumberOrNull(value) {
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : null;
}

function pickFirstNumber(obj, paths) {
    for (const path of paths) {
        const value = path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
        const number = toNumberOrNull(value);
        if (number !== null) return number;
    }
    return null;
}

function pickFirstString(obj, paths) {
    for (const path of paths) {
        const value = path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
        if (typeof value === "string" && value.trim()) return value;
    }
    return null;
}

export function mapMarketplaceOrderToDeal(order) {
    // Be defensive: response shape is not documented and might change.
    const name =
        pickFirstString(order, [
            "nft.name",
            "nft.title",
            "name",
            "title",
            "nftName",
        ]) ??
        "Unknown Miner";

    const powerTh = pickFirstNumber(order, [
        "nft.power",
        "nft.hashRateTh",
        "nft.powerTh",
        "power",
        "hashRateTh",
        "powerTh",
        "power",
        "powerTh",
        "hashRateTh",
    ]);

    const energyEfficiencyWPerTh = pickFirstNumber(order, [
        "nft.energyEfficiency",
        "nft.energyEfficiencyWPerTh",
        "energyEfficiency",
        "energyEfficiencyWPerTh",
    ]);

    // The web app often shows a USDT-based price (e.g. `priceUsdt`).
    // Prefer that for the "$ / TH" metric to match the UI users see.
    const priceUsdt = pickFirstNumber(order, [
        "priceUsdt",
        "priceInUsdt",
        "usdtPrice",
        "price.usdt",
        "priceInUSDT",
    ]);

    // Fallback USD sources (not always present).
    const priceUsdRaw = pickFirstNumber(order, [
        "priceUsd",
        "priceInUsd",
        "usdPrice",
        "price.usd",
    ]);

    const priceGmt = pickFirstNumber(order, [
        "priceGmt",
        "priceInGmt",
        "gmtPrice",
        "price.gmt",
        // Common when the API is filtered to GMT: `price` is the GMT amount.
        "price",
        "price.value",
    ]);

    // Some APIs store power in H/s (or GH/s). If power looks unrealistically large, treat it as H/s and convert to TH.
    let normalizedPowerTh = powerTh;
    if (normalizedPowerTh !== null && normalizedPowerTh > 1e6) {
        normalizedPowerTh = normalizedPowerTh / 1e12;
    }

    if (normalizedPowerTh === null || normalizedPowerTh <= 0) {
        return null;
    }

    const priceUsd = priceUsdt ?? priceUsdRaw;
    const usdPerTh = priceUsd === null || priceUsd <= 0 ? null : priceUsd / normalizedPowerTh;
    const gmtPerTh = priceGmt === null || priceGmt <= 0 ? null : priceGmt / normalizedPowerTh;

    if (usdPerTh === null && gmtPerTh === null) {
        return null;
    }

    const imageUrl = pickFirstString(order, [
        "nft.smallImageUrl",
        "nft.imageUrl",
        "nft.previewUrl",
        "smallImageUrl",
        "imageUrl",
        "previewUrl",
    ]);

    // Prefer server-provided URL if present.
    const explicitUrl = pickFirstString(order, [
        // Common top-level candidates
        "marketplaceUrl",
        "viewUrl",
        "url",
        "link",
        // Nested candidates
        "nft.marketplaceUrl",
        "nft.viewUrl",
        "nft.url",
        "nft.link",
        "nft.detailsUrl",
    ]);

    // Observed: the UUID used in `https://app.gomining.com/nft/view/<uuid>` is often provided as `externalUrlId`.
    const externalUrlId = pickFirstString(order, [
        "externalUrlId",
        "nft.externalUrlId",
    ]);

    const key = pickFirstString(order, [
        "nft.key",
        "nftKey",
        "key",
        "nft.nftKey",
    ]);

    const id = pickFirstNumber(order, [
        "nftId",
        "nft.id",
        "id",
        "nftIdForClient",
    ]);

    const marketplaceType = pickFirstString(order, [
        "marketplace",
        "marketplaceType",
        "filters.marketplace",
    ]);

    const fallbackUrl = "https://app.gomining.com/marketplace";

    const nftViewUrl = externalUrlId
        ? `https://app.gomining.com/nft/view/${encodeURIComponent(externalUrlId)}`
        : (id !== null
            ? `https://app.gomining.com/nft/view/${encodeURIComponent(String(id))}`
            : null);

    // Accept both integer IDs and UUIDs.
    const isNftViewUrl = (url) => typeof url === "string" && /\/nft\/view\/[^/?#]+/.test(url);

    // Prefer the canonical detail URL format the web app uses.
    // If the API already provides an nft/view URL, keep it; otherwise compute it from id.
    const marketplaceUrl =
        nftViewUrl ??
        (explicitUrl && isNftViewUrl(explicitUrl) ? explicitUrl : null) ??
        explicitUrl ??
        fallbackUrl;

    // Keep for future debugging/use.
    const nftKeyOrId = key ?? externalUrlId ?? (id !== null ? String(id) : null);

    const urlWithMarketplace =
        marketplaceType && isNftViewUrl(marketplaceUrl)
            ? `${marketplaceUrl}${marketplaceUrl.includes("?") ? "&" : "?"}marketplace=${encodeURIComponent(marketplaceType)}`
            : marketplaceUrl;

    return {
        name,
        powerTh: normalizedPowerTh,
        priceUsd,
        priceUsdt,
        priceGmt,
        usdPerTh,
        gmtPerTh,
        currency: usdPerTh !== null ? "USDT" : (gmtPerTh !== null ? "GMT" : "USD"),
        energyEfficiencyWPerTh,
        marketplaceUrl: urlWithMarketplace,
        imageUrl,
        nftKeyOrId,
    };
}

async function fetchNftMarketplaceIndexPage(bearerToken, body) {
    // Prefer api.gomining.com. Provide app.gomining.com as fallback.
    try {
        return await fetchFromAPI(NFT_MARKETPLACE_INDEX_URL, body, bearerToken);
    } catch (error) {
        if (error?.status === 404) {
            return await fetchFromAPI(NFT_MARKETPLACE_INDEX_APP_URL, body, bearerToken);
        }
        throw error;
    }
}

/**
 * Fetches and ranks marketplace miners by price efficiency ($/TH).
 *
 * The endpoint contract is not public; this implementation is defensive and may need
 * adjustments if the backend changes.
 */
export async function fetchCheapestMarketplaceMiners(bearerToken, options = {}) {
    const {
        top = 10,
        scanLimit = 300,
        pageSize = 50,
    } = options;

    const targetTop = Math.max(1, Math.min(50, Number(top) || 10));
    const targetScan = Math.max(targetTop, Math.min(2000, Number(scanLimit) || 300));
    const limit = Math.max(10, Math.min(200, Number(pageSize) || 50));

    const deals = [];
    let skip = 0;

    // Observed working request shape (defensive defaults).
    const baseFilters = {
        marketplace: ["gmt-account", "gmt-secondary"],
        jacobPrimary: false,
        status: ["available"],
        nftCollectionIds: null,
        body: null,
        topFan: null,
        screen: null,
        ui: null,
        downFan: null,
        buttons: null,
        upgrades: null,
        walls: null,
        basement: null,
        items: null,
        stickers: null,
        power: { min: 1, max: 6000 },
        energyEfficiency: { min: 0, max: 999 },
        price: { min: 0, max: 999999999 },
        achievementIds: null,
        // Observed allowed value in working request examples.
        currency: "GMT",
    };

    for (let page = 1; deals.length < targetScan && page <= 100; page++) {
        const body = {
            pagination: { skip, limit },
            filters: baseFilters,
            sort: { newest: 1 },
        };

        const response = await fetchNftMarketplaceIndexPage(bearerToken, body);

        const items =
            response?.data?.array ??
            response?.data?.items ??
            response?.data?.list ??
            response?.data ??
            [];

        if (!Array.isArray(items) || items.length === 0) {
            break;
        }

        for (const item of items) {
            const deal = mapMarketplaceOrderToDeal(item);
            if (deal) deals.push(deal);
            if (deals.length >= targetScan) break;
        }

        skip += limit;
        if (items.length < limit) break;
    }

    deals.sort((a, b) => (a.usdPerTh ?? a.gmtPerTh) - (b.usdPerTh ?? b.gmtPerTh));
    return deals.slice(0, targetTop);
}

export function rankMarketplaceDealsFromOrders(orders, options = {}) {
    const { top = 10 } = options;
    const targetTop = Math.max(1, Math.min(50, Number(top) || 10));

    const deals = [];
    for (const order of Array.isArray(orders) ? orders : []) {
        const deal = mapMarketplaceOrderToDeal(order);
        if (deal) deals.push(deal);
    }

    deals.sort((a, b) => (a.usdPerTh ?? a.gmtPerTh) - (b.usdPerTh ?? b.gmtPerTh));
    return deals.slice(0, targetTop);
}

export async function pushService(bearerToken) {
    const body = {};
    return fetchFromAPI(PUSH_SERVICE_URL, body, bearerToken);
}
