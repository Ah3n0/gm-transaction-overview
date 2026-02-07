chrome.runtime.onUpdateAvailable.addListener((details) => {
    console.log("A new version of the extension is available: ", details.version);
    chrome.runtime.reload();
});

async function waitForTabComplete(tabId, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Timed out waiting for GoMining tab to load."));
        }, timeoutMs);

        const onUpdated = (updatedTabId, info) => {
            if (updatedTabId !== tabId) return;
            if (info.status === "complete") {
                cleanup();
                resolve();
            }
        };

        const cleanup = () => {
            clearTimeout(timeout);
            chrome.tabs.onUpdated.removeListener(onUpdated);
        };

        chrome.tabs.onUpdated.addListener(onUpdated);
    });
}

async function getOrCreateGoMiningTab() {
    const tabs = await chrome.tabs.query({ url: "https://app.gomining.com/*" });
    if (tabs && tabs.length > 0 && tabs[0]?.id) {
        return tabs[0];
    }

    const tab = await chrome.tabs.create({
        url: "https://app.gomining.com/marketplace",
        active: false,
    });

    if (!tab?.id) {
        throw new Error("Failed to create GoMining tab.");
    }

    await waitForTabComplete(tab.id);
    return tab;
}

async function fetchJsonInTab(tabId, url, body, bearerToken) {
    const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: async (requestUrl, requestBody, requestBearerToken) => {
            try {
                const headers = {
                    "Content-Type": "application/json",
                    ...(requestBearerToken ? { Authorization: `Bearer ${requestBearerToken}` } : {}),
                };

                const response = await fetch(requestUrl, {
                    method: "POST",
                    headers,
                    credentials: "include",
                    body: JSON.stringify(requestBody ?? {}),
                });

                const text = await response.text().catch(() => "");
                if (!response.ok) {
                    return {
                        ok: false,
                        status: response.status,
                        statusText: response.statusText,
                        responseText: text,
                    };
                }

                try {
                    return {
                        ok: true,
                        status: response.status,
                        statusText: response.statusText,
                        json: text ? JSON.parse(text) : null,
                    };
                } catch (e) {
                    return {
                        ok: false,
                        status: response.status,
                        statusText: "Invalid JSON",
                        responseText: text,
                    };
                }
            } catch (e) {
                return {
                    ok: false,
                    status: 0,
                    statusText: "Network Error",
                    responseText: String(e?.message ?? e),
                };
            }
        },
        args: [url, body, bearerToken ?? null],
    });

    return result?.result;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "GM_FETCH_MARKETPLACE_INDEX") {
        return false;
    }

    (async () => {
        const { url, body, bearerToken } = message;

        const tab = await getOrCreateGoMiningTab();
        const result = await fetchJsonInTab(tab.id, url, body, bearerToken);
        sendResponse(result);
    })().catch((error) => {
        sendResponse({
            ok: false,
            status: 0,
            statusText: "Background Error",
            responseText: String(error?.message ?? error),
        });
    });

    return true;
});