import { BASE_URL } from "../config.js";

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
        throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
}
