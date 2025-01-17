import { BASE_URL, MINER_UPGRADE_URL, MINER_BUY_URL, DISCOUNT_URL, MAINTENANCE_STATE_URL } from "../config.js";

async function fetchFromAPI(url, body, bearerToken) {
    const headers = {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
    };

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized. Please ensure you are logged in.");
        }
        throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
}

export async function fetchData(skip, bearerToken) {
    const body = {
        filters: {},
        pagination: { skip: skip, limit: 50 },
    };
    return fetchFromAPI(BASE_URL, body, bearerToken);
}

export async function fetchNFT(skip, bearerToken) {
    const body = {
        filters: { withCanceled: false },
        pagination: { skip: skip, limit: 50 }
    };
    return fetchFromAPI(MINER_BUY_URL, body, bearerToken);
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

// Export functions globally for the worker
self.fetchData = fetchData;
self.fetchNFT = fetchNFT;
self.fetchUpgradesNFT = fetchUpgradesNFT;
self.fetchDiscount = fetchDiscount;
self.fetchMaintenanceState = fetchMaintenanceState;
