import { BASE_URL, MINER_UPGRADE_URL, MINER_BUY_URL, DISCOUNT_URL, MAINTENANCE_STATE_URL } from "../config.js";

/**
 * Generic function to fetch data from an API endpoint with a bearer token.
 * @param {int} skip - For paging - skip at least 'skip' values.
 * @param {string} bearerToken - Bearer token for authorization.
 * @returns {Promise<Object>} The response data.
 */
export async function fetchData(skip, bearerToken) {
    const headers = {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
    };

    const body = {
        filters: {},
        pagination: { skip: skip, limit: 50 },
    };

    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized. Please ensure you are logged in.");
        }
        throw new Error(`API gmt wallet request failed: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Generic function to fetch bought nft from an API endpoint with a bearer token.
 * @param {int} skip - For paging - skip at least 'skip' values.
 * @param {string} bearerToken - Bearer token for authorization.
 * @returns {Promise<Object>} The response data.
 */
export async function fetchNFT(skip, bearerToken) {
    const headers = {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
    };

    const body = {
        filters:{withCanceled: false},
        pagination:{skip: skip, limit: 50}
    };

    const response = await fetch(MINER_BUY_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized. Please ensure you are logged in.");
        }
        throw new Error(`API nft order request failed: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Generic function to fetch nft upgrades from an API endpoint with a bearer token.
 * @param {int} skip - For paging - skip at least 'skip' values.
 * @param {string} bearerToken - Bearer token for authorization.
 * @returns {Promise<Object>} The response data.
 */
export async function fetchUpgradesNFT(skip, bearerToken) {
    const headers = {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
    };

    const body = {
        filters:{status: 
            {in: ["canceled",
                "pending",
                "success",
                "error",
                "waitingForProviderConfirmation",
                "approvedByProvider",
                "waitingForConfirmation"
            ]}
        },
        sort:{createdAt: "DESC"},
        pagination:{skip: skip, limit: 50}
    };

    const response = await fetch(MINER_UPGRADE_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized. Please ensure you are logged in.");
        }
        throw new Error(`API nft upgrade request failed: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Generic function to fetch discount information from an API endpoint with a bearer token.
 * @param {string} bearerToken - Bearer token for authorization.
 * @returns {Promise<Object>} The response data.
 */
export async function fetchDiscount(bearerToken) {
    const headers = {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
    };

    const body = {};

    const response = await fetch(DISCOUNT_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized. Please ensure you are logged in.");
        }
        throw new Error(`API discount request failed: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Generic function to fetch the maintenance state information from an API endpoint with a bearer token.
 * @param {string} bearerToken - Bearer token for authorization.
 * @returns {Promise<Object>} The response data.
 */
export async function fetchMaintenanceState(bearerToken) {
    const headers = {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
    };

    const body = {};

    const response = await fetch(MAINTENANCE_STATE_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized. Please ensure you are logged in.");
        }
        throw new Error(`API maintenance state request failed: ${response.statusText}`);
    }

    return await response.json();
}
