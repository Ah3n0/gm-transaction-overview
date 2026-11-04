import { 
    AUTH_URL, 
} from './config.js';

import { fetchDiscount, fetchNFT, fetchMyNfts, fetchMaintenanceState, fetchUserRewards, fetchNftGameIncome, mapPoolRewardIncomeEntry, fetchClanMember, fetchMarketplaceOrders, getOrderNftId, fetchWalletTransactionHistory, fetchCheapestMarketplaceMiners, rankMarketplaceDealsFromOrders } from './utils/api.js';
import { buildKoinlyRows, toKoinlyCsv } from './utils/koinly.js';
import { formatDate } from './utils/time.js';
import { getBearerTokenFromCookie } from './utils/cookies.js';
import { displayMinerEvents, handleButtonActivation } from './utils/ui.js';

function escapeHtml(unsafe) {
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatMoneyUsd(value) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return "-";
    return `$${number.toFixed(2)}`;
}

function formatTh(value) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return "-";
    return `${number.toFixed(2)} TH`;
}

function formatUsdPerTh(value) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return "-";
    return `$${number.toFixed(4)} / TH`;
}

function formatGmtPerTh(value) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return "-";
    return `${number.toFixed(4)} GMT / TH`;
}

function formatGmt(value) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return "-";
    return `${number.toFixed(6)} GMT`;
}

function formatBtc(value) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return "-";
    return `${number.toFixed(8)} BTC`;
}

function formatUtc(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toUTCString();
}

function formatWPerTh(value) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return "-";
    return `${number.toFixed(0)} W/TH`;
}

function readMarketplaceTopN() {
    const input = document.getElementById('marketplaceTopN');
    const raw = input?.value;
    const parsed = raw === undefined || raw === null || raw === '' ? NaN : Number(raw);
    const allowed = [5, 10, 20, 50, 100];
    if (!Number.isFinite(parsed)) return 20;
    const value = Math.trunc(parsed);
    return allowed.includes(value) ? value : 20;
}

async function loadPoolRewards() {
    const listEl = document.getElementById('poolRewardsList');
    if (!listEl) return;

    listEl.innerHTML = '<p>Loading...</p>';

    try {
        const bearerToken = await getBearerTokenFromCookie();

        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 12);

        const result = await fetchNftGameIncome(bearerToken, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            limit: 20,
            skip: 0,
        });

        const items =
            result?.data?.array ??
            result?.data?.items ??
            result?.data?.list ??
            result?.data ??
            [];

        if (!Array.isArray(items) || items.length === 0) {
            listEl.innerHTML = '<p>No pool rewards found.</p>';
            return;
        }

        const mappedItems = items.map((entry) => mapPoolRewardIncomeEntry(entry));

        const rows = mappedItems
            .map((mapped) => {
                const createdAt = mapped?.createdAt ? formatUtc(mapped.createdAt) : '-';
                const totalRewardBtc = mapped?.totalRewardBtc;
                const totalRewardGmt = mapped?.totalRewardGmt;
                const costsGmt = mapped?.costsGmt;
                const netGmt = mapped?.netGmt;
                const walletType = mapped?.toWalletType ?? '-';

                return `
                    <div class="pool-rewards-row">
                        <div class="pool-rewards-col pool-rewards-date">${escapeHtml(createdAt)}</div>
                        <div class="pool-rewards-col">${escapeHtml(formatBtc(totalRewardBtc))}</div>
                        <div class="pool-rewards-col">${escapeHtml(formatGmt(totalRewardGmt))}</div>
                        <div class="pool-rewards-col">${escapeHtml(formatGmt(costsGmt))}</div>
                        <div class="pool-rewards-col pool-rewards-net">${escapeHtml(formatGmt(netGmt))}</div>
                        <div class="pool-rewards-col pool-rewards-wallet">${escapeHtml(walletType)}</div>
                    </div>
                `;
            })
            .join('');

        const totals = mappedItems.reduce(
            (acc, m) => {
                if (typeof m?.totalRewardBtc === 'number' && Number.isFinite(m.totalRewardBtc)) acc.totalRewardBtc += m.totalRewardBtc;
                if (typeof m?.totalRewardGmt === 'number' && Number.isFinite(m.totalRewardGmt)) acc.totalRewardGmt += m.totalRewardGmt;
                if (typeof m?.costsGmt === 'number' && Number.isFinite(m.costsGmt)) acc.costsGmt += m.costsGmt;
                if (typeof m?.netGmt === 'number' && Number.isFinite(m.netGmt)) acc.netGmt += m.netGmt;
                return acc;
            },
            { totalRewardBtc: 0, totalRewardGmt: 0, costsGmt: 0, netGmt: 0 }
        );

        listEl.innerHTML = `
            <div class="pool-rewards-summary">
                <div><strong>Total Reward:</strong> ${escapeHtml(formatBtc(totals.totalRewardBtc))}</div>
                <div><strong>Total Reward (GMT):</strong> ${escapeHtml(formatGmt(totals.totalRewardGmt))}</div>
                <div><strong>Total Costs (PR + Electricity) (GMT):</strong> ${escapeHtml(formatGmt(totals.costsGmt))}</div>
                <div><strong>Total Net (GMT):</strong> ${escapeHtml(formatGmt(totals.netGmt))}</div>
            </div>
            <div class="pool-rewards-table">
                <div class="pool-rewards-row pool-rewards-header">
                    <div class="pool-rewards-col pool-rewards-date">Date (UTC)</div>
                    <div class="pool-rewards-col">Reward (BTC)</div>
                    <div class="pool-rewards-col">Reward (GMT)</div>
                    <div class="pool-rewards-col">PR+Electricity (c1+c2) (GMT)</div>
                    <div class="pool-rewards-col pool-rewards-net">Net (GMT)</div>
                    <div class="pool-rewards-col pool-rewards-wallet">Wallet</div>
                </div>
                ${rows}
            </div>
        `;
    } catch (error) {
        console.error('Error loading pool rewards:', error);
        const message = error?.message ? escapeHtml(error.message) : 'Unknown error';
        listEl.innerHTML = `<p>Error loading pool rewards: ${message}</p>`;
    }
}

async function loadMarketplaceCheapest() {
    const listEl = document.getElementById('marketplaceList');
    if (!listEl) return;

    listEl.innerHTML = '<p>Loading...</p>';

    try {
        const bearerToken = await getBearerTokenFromCookie();
        const top = readMarketplaceTopN();
        const scanLimit = Math.max(300, top * 30);
        const deals = await fetchCheapestMarketplaceMiners(bearerToken, { top, scanLimit, pageSize: 50 });

        if (!Array.isArray(deals) || deals.length === 0) {
            listEl.innerHTML = '<p>No marketplace deals found (or missing fields).</p>';
            return;
        }

        const rows = deals
            .map((deal, idx) => {
                const name = deal?.name ?? 'Unknown Miner';
                const url = deal?.marketplaceUrl ?? 'https://app.gomining.com/marketplace';
                const imageUrl = deal?.imageUrl;

                const pricePart = typeof deal?.priceUsd === 'number'
                    ? formatMoneyUsd(deal.priceUsd)
                    : (typeof deal?.priceGmt === 'number' ? formatGmt(deal.priceGmt) : '-');

                const efficiencyPart = typeof deal?.energyEfficiencyWPerTh === 'number'
                    ? formatWPerTh(deal.energyEfficiencyWPerTh)
                    : '-';

                const perThPart = typeof deal?.usdPerTh === 'number'
                    ? formatUsdPerTh(deal.usdPerTh)
                    : (typeof deal?.gmtPerTh === 'number' ? formatGmtPerTh(deal.gmtPerTh) : '-');

                return `
                    <div class="marketplace-row">
                        <div class="marketplace-rank">#${idx + 1}</div>
                        <div class="marketplace-thumb">
                            ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}">` : `<div class="marketplace-thumb-placeholder"></div>`}
                        </div>
                        <div class="marketplace-main">
                            <div class="marketplace-name"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a></div>
                            <div class="marketplace-meta">
                                <span>${escapeHtml(pricePart)}</span>
                                <span>•</span>
                                <span>${formatTh(deal?.powerTh)}</span>
                                <span>•</span>
                                <span>${escapeHtml(efficiencyPart)}</span>
                                <span>•</span>
                                <span><strong>${escapeHtml(perThPart)}</strong></span>
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');

        listEl.innerHTML = `<div class="marketplace-table">${rows}</div>`;
    } catch (error) {
        if (error?.status === 403 && chrome?.runtime?.sendMessage) {
            try {
                listEl.innerHTML = '<p>Blocked (403). Retrying via app.gomining.com tab...</p>';
                const bearerToken = await getBearerTokenFromCookie();
                const top = readMarketplaceTopN();
                const deals = await loadMarketplaceCheapestViaTab(bearerToken, { top });
                if (Array.isArray(deals) && deals.length > 0) {
                    const rows = deals
                        .map((deal, idx) => {
                            const name = deal?.name ?? 'Unknown Miner';
                            const url = deal?.marketplaceUrl ?? 'https://app.gomining.com/marketplace';
                            const imageUrl = deal?.imageUrl;

                            const pricePart = typeof deal?.priceUsd === 'number'
                                ? formatMoneyUsd(deal.priceUsd)
                                : (typeof deal?.priceGmt === 'number' ? formatGmt(deal.priceGmt) : '-');

                            const efficiencyPart = typeof deal?.energyEfficiencyWPerTh === 'number'
                                ? formatWPerTh(deal.energyEfficiencyWPerTh)
                                : '-';

                            const perThPart = typeof deal?.usdPerTh === 'number'
                                ? formatUsdPerTh(deal.usdPerTh)
                                : (typeof deal?.gmtPerTh === 'number' ? formatGmtPerTh(deal.gmtPerTh) : '-');

                            return `
                                <div class="marketplace-row">
                                    <div class="marketplace-rank">#${idx + 1}</div>
                                    <div class="marketplace-thumb">
                                        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}">` : `<div class="marketplace-thumb-placeholder"></div>`}
                                    </div>
                                    <div class="marketplace-main">
                                        <div class="marketplace-name"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a></div>
                                        <div class="marketplace-meta">
                                            <span>${escapeHtml(pricePart)}</span>
                                            <span>•</span>
                                            <span>${formatTh(deal?.powerTh)}</span>
                                            <span>•</span>
                                            <span>${escapeHtml(efficiencyPart)}</span>
                                            <span>•</span>
                                            <span><strong>${escapeHtml(perThPart)}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        })
                        .join('');

                    listEl.innerHTML = `<div class="marketplace-table">${rows}</div>`;
                    return;
                }
            } catch (fallbackError) {
                console.error('Marketplace tab retry failed:', fallbackError);
            }
        }
        console.error('Error loading marketplace:', error);
        const message = error?.message ? escapeHtml(error.message) : 'Unknown error';

        const urlHint = error?.url ? `<div class="marketplace-error-hint"><strong>URL:</strong> ${escapeHtml(error.url)}</div>` : '';
        const attempts = Array.isArray(error?.marketplaceAttempts) ? error.marketplaceAttempts : [];
        const attemptsHtml = attempts.length
            ? `
                <details class="marketplace-error-details">
                    <summary>Details</summary>
                    <ul>
                        ${attempts.map((a) => {
                            const status = a?.status ? String(a.status) : '-';
                            const mode = a?.mode ? escapeHtml(a.mode) : 'unknown';
                            const url = a?.url ? escapeHtml(a.url) : '-';
                            const statusText = a?.statusText ? escapeHtml(a.statusText) : '';
                            const responseText = a?.responseText ? escapeHtml(String(a.responseText)).slice(0, 500) : '';
                            return `<li><strong>${mode}</strong> ${status} ${statusText} — ${url}${responseText ? `<div class="marketplace-error-response">${responseText}</div>` : ''}</li>`;
                        }).join('')}
                    </ul>
                </details>
            `
            : '';

        listEl.innerHTML = `<p>Error loading marketplace: ${message}</p>${urlHint}${attemptsHtml}`;
    }
}

async function loadMarketplaceCheapestViaTab(bearerToken, options = {}) {
    const { top = 10 } = options;
    const pageSize = 50;
    const scanLimit = Math.max(300, Number(top) * 30);

    const allOrders = [];
    for (let skip = 0; skip < scanLimit; skip += pageSize) {
        const body = {
            pagination: { skip, limit: pageSize },
            filters: {
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
                currency: "GMT",
            },
            sort: { newest: 1 },
        };

        const result = await chrome.runtime.sendMessage({
            type: 'GM_FETCH_MARKETPLACE_INDEX',
            url: 'https://api.gomining.com/api/nft/marketplace-index',
            body,
            bearerToken,
        });

        if (!result?.ok) {
            const responseText = result?.responseText ? String(result.responseText) : '';
            throw new Error(`Tab fetch failed (${result?.status ?? 0}) ${result?.statusText ?? ''}: ${responseText}`);
        }

        const items =
            result?.json?.data?.array ??
            result?.json?.data?.items ??
            result?.json?.data?.list ??
            result?.json?.data ??
            [];
        if (!Array.isArray(items) || items.length === 0) break;
        allOrders.push(...items);
        if (items.length < pageSize) break;
    }

    return rankMarketplaceDealsFromOrders(allOrders, { top });
}

// Event listener for DOM content loaded
document.addEventListener("DOMContentLoaded", async () => {
    const createdAtElement = document.getElementById("createdAt");
    const manifest = chrome.runtime.getManifest();
    const minerList = document.getElementById('miner-list');
    const showSoldNftsToggle = document.getElementById('showSoldNftsToggle');
    const discountList = document.getElementById('discount-list');
    minerList.innerHTML = '<p>Loading...</p>';
    discountList.innerHTML = '<p>Loading...</p>';
    document.getElementById("version-info").textContent = `Version: ${manifest.version}`;

    // Fetch user information
    try {
        const bearerToken = await getBearerTokenFromCookie();
        const response = await fetch(AUTH_URL, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${bearerToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error(`Request failed: ${response.status}`);

        const userData = (await response.json()).data;
        if (userData) {
            document.getElementById("alias").textContent = userData.alias || "";
            document.getElementById("user-id").textContent = userData.id || "";
            document.getElementById("email").textContent = userData.email || "";

            // Format and display the user's creation date
            const formattedDate = formatDate(userData.createdAt).split(" ")[0];
            createdAtElement.textContent = formattedDate || "";
        } else {
            throw new Error("No user data found.");
        }
    } catch (err) {
        console.error("Error fetching user info:", err);
        document.getElementById("alias").textContent = "Error";
    }

    // Fetch all miners
    try {
        const bearerToken = await getBearerTokenFromCookie();

        const extractArray = (response) => {
            const data = response?.data;
            if (Array.isArray(data)) return data;
            const candidates = [
                data?.array,
                data?.items,
                data?.list,
                data?.nfts,
                data?.miners,
            ];
            const first = candidates.find((v) => Array.isArray(v));
            return first ?? [];
        };

        // 1) Purchased miners (pagination). Keep it bounded to avoid heavy popup load.
        const purchased = [];
        const pageSize = 50;
        const maxPages = 20;
        for (let page = 0; page < maxPages; page++) {
            const response = await fetchNFT(page * pageSize, bearerToken);
            const pageItems = extractArray(response);
            if (!Array.isArray(pageItems) || pageItems.length === 0) break;
            purchased.push(...pageItems);
            if (pageItems.length < pageSize) break;
        }

        // 2) All owned NFTs (includes gifted)
        let owned = [];
        try {
            const ownedResponse = await fetchMyNfts(bearerToken);
            owned = extractArray(ownedResponse);
        } catch (ownedError) {
            // If this endpoint breaks/changes, keep purchased list working.
            console.warn('Failed to fetch /api/nft/get-my; continuing with purchased miners only.', ownedError);
            owned = [];
        }

        const toFiniteNumber = (value) => {
            if (typeof value === 'number') return Number.isFinite(value) ? value : null;
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (!trimmed) return null;
                const parsed = Number(trimmed);
                return Number.isFinite(parsed) ? parsed : null;
            }
            return null;
        };

        const normalizeEntry = (item) => {
            // Purchased shape: { value, nfts: [ { id, name, smallImageUrl, ... } ] }
            // Owned shape (gifted included): often { id, name, smallImageUrl, ... } or { nft: {...} } or { nfts: [...] }
            const nft = item?.nfts?.[0] ?? item?.nft ?? item;
            const id = nft?.id ?? null;

            const valueGmt =
                toFiniteNumber(item?.value) ??
                toFiniteNumber(item?.nftValue) ??
                toFiniteNumber(item?.price) ??
                toFiniteNumber(item?.nft?.value) ??
                null;

            return { id, nft, valueGmt };
        };

        // Merge & dedupe by nft id. Prefer purchased value if present.
        const mergedById = new Map();

        for (const item of purchased) {
            const norm = normalizeEntry(item);
            if (!norm?.id) continue;
            mergedById.set(norm.id, norm);
        }

        for (const item of owned) {
            const norm = normalizeEntry(item);
            if (!norm?.id) continue;

            const existing = mergedById.get(norm.id);
            if (!existing) {
                mergedById.set(norm.id, norm);
            } else if ((existing.valueGmt === null || existing.valueGmt === undefined) && norm.valueGmt !== null) {
                mergedById.set(norm.id, { ...existing, valueGmt: norm.valueGmt });
            }
        }

        const miners = Array.from(mergedById.values());

        // Fetch marketplace orders
        const marketplaceOrders = await fetchMarketplaceOrders(bearerToken);
        const soldNftIds = marketplaceOrders.data.array
            .filter(order => order.status === "success")
            .map(order => getOrderNftId(order));

        const renderMiners = ({ showSold }) => {
            minerList.innerHTML = '';

            let renderedCount = 0;
            miners.forEach((miner) => {
                const minerData = miner?.nft;
                if (!minerData) {
                    console.warn('Miner without NFT data:', miner);
                    return;
                }

                const isSold = soldNftIds.includes(minerData.id);
                if (isSold && !showSold) return;

                const card = document.createElement('div');
                card.className = `miner-card ${isSold ? 'sold' : ''}`;

                card.innerHTML = `
                    <div class="image-container">
                        <img src="${minerData.smallImageUrl}" alt="${minerData.name}">
                        ${isSold ? '<div class="sold-stamp">Sold</div>' : ''}
                    </div>
                    <h4>${minerData.name}</h4>
                    <p>Value: ${miner?.valueGmt ?? 0} GMT</p>
                `;

                // Click event for miner cards
                card.addEventListener('click', () => {
                    displayMinerEvents(minerData.id, bearerToken);
                });

                minerList.appendChild(card);
                renderedCount += 1;
            });

            if (renderedCount === 0) {
                minerList.innerHTML = '<p>No miners to display.</p>';
            }
        };

        // Default: hide sold NFTs
        if (showSoldNftsToggle) {
            showSoldNftsToggle.checked = false;
            showSoldNftsToggle.addEventListener('change', () => {
                renderMiners({ showSold: Boolean(showSoldNftsToggle.checked) });
            });
        }

        renderMiners({ showSold: Boolean(showSoldNftsToggle?.checked) });
    } catch (error) {
        console.error('Error loading miners:', error);
        minerList.innerHTML = '<p>Error loading miners.</p>';
    }

    // Fetch discount information
    try {
        const bearerToken = await getBearerTokenFromCookie();
        const data = await fetchDiscount(bearerToken);
        const discount = data.data;

        if (discount) {
            discountList.innerHTML = ''; 

            document.getElementById("token-discount").textContent = discount.discountAvailableDays || "0";
            document.getElementById("service-discount").textContent = (discount.dailyMaintenanceDiscount * 100).toFixed(2) || "0.00";
            document.getElementById("level-discount").textContent = (discount.levelDiscount * 100).toFixed(2) || "0.00";
            document.getElementById("solo-discount").textContent = (discount.rewardDistributionDiscount * 100).toFixed(2) || "0.00";
            document.getElementById("gmt-balance").textContent = discount.gmtBalance.toFixed(6) || "0.000000";
            document.getElementById("gmt-locked").textContent = discount.gmtLocked.toFixed(6) || "0.000000";
            document.getElementById("active-maintenance-days").textContent = discount.daysCountOfActiveMaintenance || "0";
            document.getElementById("maintenance-without-discount").textContent = discount.maintenanceInGmtWithoutDiscount.toFixed(6) || "0.000000";
            document.getElementById("total-maintenance").textContent = discount.totalMaintenanceBeforeTokenDiscount.toFixed(6) || "0.000000";
        }
    } catch (error) {
        console.error('Error loading discount:', error);
        discountList.innerHTML = '<p>Error loading discount.</p>';
    }

    // fetch maintenance status
    try {
        const bearerToken = await getBearerTokenFromCookie();
        const maintenanceState = await fetchMaintenanceState(bearerToken);
        const { updateAvailableFrom } = maintenanceState.data;

        if (updateAvailableFrom) {
            const updateButton = document.getElementById('update-button');
            const updateTime = new Date(updateAvailableFrom);
            const now = new Date();

            // Format date to "yyyy-mm-dd hh:mm:ss"
            const formattedTime = `${updateTime.getFullYear()}-${String(updateTime.getMonth() + 1).padStart(2, '0')}-${String(updateTime.getDate()).padStart(2, '0')} ${String(updateTime.getHours()).padStart(2, '0')}:${String(updateTime.getMinutes()).padStart(2, '0')}:${String(updateTime.getSeconds()).padStart(2, '0')}`;

            // Display the formatted time on the button
            if (updateButton) {
                updateButton.textContent = `Enable at ${formattedTime}`;
            }

            const delay = updateTime.getTime() - now.getTime();

            if (delay > 0) {
                console.log(`Button will be activated in ${delay / 1000} seconds.`);
                setTimeout(async () => {
                    await handleButtonActivation(updateButton, bearerToken);
                }, delay);
            } else {
                console.log('The specified time has already passed. Activating button immediately.');
                await handleButtonActivation(updateButton, bearerToken);
            }
        }
    } catch (error) {
        console.error('Error managing update button:', error);
    }

    // Fetch user rewards
    try {
        const bearerToken = await getBearerTokenFromCookie();
        const rewardsData = await fetchUserRewards(bearerToken);
        const rewards = rewardsData.data.array;

        const rewardsList = document.getElementById('rewards-list');
        rewardsList.innerHTML = '';
        rewards.forEach(reward => {
            const createdAt = new Date(reward.createdAt);
            const utcCreatedAt = createdAt.toUTCString();

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>Round ID:</strong> ${reward.roundId} <br>
                <strong>Created At (UTC):</strong> ${utcCreatedAt} <br>
                <strong>GMT Value:</strong> ${reward.gmtValue} <br>
                <strong>Multiplier:</strong> ${reward.multiplier} <br>
                <strong>Cycle:</strong> ${reward.cycleId}
            `;
            rewardsList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching user rewards:', error);
        document.getElementById('rewards-list').innerHTML = '<li>Error loading rewards.</li>';
    }

    // Fetch clan members
    try {
        const clanList = document.getElementById('clan-list');
        const clanMemberCount = document.getElementById('clan-member-count');
        const sortSelect = document.getElementById('sort-clan-members');
        const filterSelect = document.getElementById('filter-clan-members');
        const totalSumElement = document.getElementById('total-sum');

        if (!clanList || !clanMemberCount || !sortSelect || !filterSelect || !totalSumElement) {
            throw new Error('Clan UI elements not found.');
        }

        let clanMembers = [];

        const buildAbilityCounts = (member) => {
            const abilities = member?.usedNftGameAbilities || [];
            const counts = {
                "2ec728e7-f31f-4df3-b486-5e82a4976563": 0,
                "44e8af7d-bcfb-4606-a111-5d6ccf1ab463": 0,
                "a1f33226-2b51-4b6e-bbfc-eb0a20f0de1c": 0,
                "ac859dd7-3981-4a10-886b-7c0b03b7a498": 0
            };

            abilities.forEach((ability) => {
                if (counts.hasOwnProperty(ability.nftGameAbilityId)) {
                    counts[ability.nftGameAbilityId] = ability.count;
                }
            });

            return counts;
        };

        const getMemberTotals = (member) => {
            const abilityCounts = buildAbilityCounts(member);
            const redSum = abilityCounts["44e8af7d-bcfb-4606-a111-5d6ccf1ab463"] * 1;
            const purpleSum = abilityCounts["a1f33226-2b51-4b6e-bbfc-eb0a20f0de1c"] * 9;
            const greenSum = abilityCounts["ac859dd7-3981-4a10-886b-7c0b03b7a498"] * 1;
            const total = redSum + purpleSum + greenSum;
            return { abilityCounts, redSum, purpleSum, greenSum, total };
        };

        const renderClanMembers = (members) => {
            clanList.innerHTML = '';
            let totalSum = 0;

            if (!Array.isArray(members) || members.length === 0) {
                clanList.innerHTML = '<li>No clan members found. You are in Solo Mining.</li>';
                totalSumElement.innerHTML = `<strong>Total Sum:</strong> 0 GMT`;
                return;
            }

            members.forEach((member) => {
                const joinDate = new Date(member.joinDate);
                const utcJoinDate = joinDate.toUTCString();
                const isOwner = member.isOwner ? 'clan-owner' : '';

                const { abilityCounts, redSum, purpleSum, greenSum, total } = getMemberTotals(member);
                totalSum += total;

                const listItem = document.createElement('li');
                listItem.className = `clan-member`;
                listItem.innerHTML = `
                    <div class="summary ${isOwner}">
                        <strong>Alias:</strong> ${member.alias}
                    </div>
                    <div class="details">
                        <strong>Power:</strong> ${member.power} <br>
                        <strong>Join Date (UTC):</strong> ${utcJoinDate} <br>
                        <strong>Ability 1:</strong> <span>${abilityCounts["2ec728e7-f31f-4df3-b486-5e82a4976563"]}</span> <br>
                        <strong>Ability 2:</strong> <span class="red">${abilityCounts["44e8af7d-bcfb-4606-a111-5d6ccf1ab463"]} (${redSum} GMT)</span> <br>
                        <strong>Ability 3:</strong> <span class="purple">${abilityCounts["a1f33226-2b51-4b6e-bbfc-eb0a20f0de1c"]} (${purpleSum} GMT)</span> <br>
                        <strong>Ability 4:</strong> <span class="green">${abilityCounts["ac859dd7-3981-4a10-886b-7c0b03b7a498"]} (${greenSum} GMT)</span> <br>
                        <strong>Total:</strong> ${total} GMT
                    </div>
                `;

                listItem.querySelector('.summary').addEventListener('click', () => {
                    listItem.classList.toggle('open');
                });

                clanList.appendChild(listItem);
            });

            totalSumElement.innerHTML = `<strong>Total Sum:</strong> ${totalSum} GMT`;
        };

        const applySortAndFilter = () => {
            const criteria = sortSelect.value;
            const daysRaw = filterSelect.value;
            const days = daysRaw ? parseInt(daysRaw, 10) : null;

            let members = Array.isArray(clanMembers) ? [...clanMembers] : [];

            switch (criteria) {
                case 'alphabetical':
                    members.sort((a, b) => (a.alias || '').localeCompare(b.alias || ''));
                    break;
                case 'joinDate':
                    members.sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
                    break;
                case 'power':
                    members.sort((a, b) => (b.power || 0) - (a.power || 0));
                    break;
                case 'ability1':
                    members.sort((a, b) => (buildAbilityCounts(b)["2ec728e7-f31f-4df3-b486-5e82a4976563"] || 0) - (buildAbilityCounts(a)["2ec728e7-f31f-4df3-b486-5e82a4976563"] || 0));
                    break;
                case 'ability2':
                    members.sort((a, b) => (buildAbilityCounts(b)["44e8af7d-bcfb-4606-a111-5d6ccf1ab463"] || 0) - (buildAbilityCounts(a)["44e8af7d-bcfb-4606-a111-5d6ccf1ab463"] || 0));
                    break;
                case 'ability3':
                    members.sort((a, b) => (buildAbilityCounts(b)["a1f33226-2b51-4b6e-bbfc-eb0a20f0de1c"] || 0) - (buildAbilityCounts(a)["a1f33226-2b51-4b6e-bbfc-eb0a20f0de1c"] || 0));
                    break;
                case 'ability4':
                    members.sort((a, b) => (buildAbilityCounts(b)["ac859dd7-3981-4a10-886b-7c0b03b7a498"] || 0) - (buildAbilityCounts(a)["ac859dd7-3981-4a10-886b-7c0b03b7a498"] || 0));
                    break;
                case 'total':
                    members.sort((a, b) => getMemberTotals(b).total - getMemberTotals(a).total);
                    break;
                default:
                    break;
            }

            if (days) {
                const now = new Date();
                members = members.filter((member) => {
                    const joinDate = new Date(member.joinDate);
                    const diffTime = Math.abs(now - joinDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= days;
                });
            }

            renderClanMembers(members);
        };

        const loadClanMembers = async () => {
            clanList.innerHTML = '<li>Loading...</li>';
            totalSumElement.innerHTML = '';
            clanMemberCount.textContent = '0';

            const bearerToken = await getBearerTokenFromCookie();

            const clanData = await fetchClanMember(bearerToken);

            let members =
                clanData?.data?.usersForClient ??
                clanData?.data?.users ??
                clanData?.data?.array ??
                clanData?.data?.members ??
                [];

            if (!Array.isArray(members)) {
                console.warn('Unexpected clan member payload:', clanData);
                members = [];
            }

            clanMembers = members;
            clanMemberCount.textContent = String(clanMembers.length);
            applySortAndFilter();
        };

        // Wire UI events (once).
        sortSelect.addEventListener('change', applySortAndFilter);
        filterSelect.addEventListener('change', applySortAndFilter);

        // Initial load.
        await loadClanMembers();
    } catch (error) {
        console.error('Error fetching clan members:', error);
        document.getElementById('clan-list').innerHTML = `<li>Error loading clan members.</li>`;
    }

    const marketplaceTopN = document.getElementById('marketplaceTopN');
    if (marketplaceTopN) {
        marketplaceTopN.addEventListener('change', () => {
            void loadMarketplaceCheapest();
        });
    }

    const poolRewardsReloadBtn = document.getElementById('poolRewardsReloadBtn');
    if (poolRewardsReloadBtn) {
        poolRewardsReloadBtn.addEventListener('click', () => {
            void loadPoolRewards();
        });
    }
});

// Event listener for accordion headers
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const targetId = header.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
    
        // Close all other accordion windows
        document.querySelectorAll('.accordion-collapse').forEach(collapse => {
            if (collapse !== targetElement) {
            collapse.classList.remove('show');
            }
        });
    
        // Toggle the clicked accordion element
        targetElement.classList.toggle('show');
    });
});

// Event listener for tab navigation
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Deactivate all tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        // Hide all tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        // Activate the clicked tab and its corresponding panel
        tab.classList.add('active');
        const target = tab.getAttribute('data-target');
        document.querySelector(`.${target}`).classList.add('active');

        if (target === 'marketplace-info') {
            void loadMarketplaceCheapest();
        }

        if (target === 'pool-rewards-info') {
            void loadPoolRewards();
        }

        if (target === 'koinly-info') {
            initKoinlyTab();
        }
    });
});
// ---------------------------------------------------------------------------
// Koinly export
// ---------------------------------------------------------------------------
let koinlyTabInitialized = false;

function initKoinlyTab() {
    if (koinlyTabInitialized) return;
    koinlyTabInitialized = true;

    const fromInput = document.getElementById('koinlyFrom');
    const toInput = document.getElementById('koinlyTo');
    const button = document.getElementById('koinlyExportButton');
    const status = document.getElementById('koinlyStatus');

    const today = new Date();
    const yesterday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
    if (!toInput.value) toInput.value = yesterday.toISOString().slice(0, 10);

    button.addEventListener('click', async () => {
        const from = fromInput.value;
        const to = toInput.value;
        if (!from || !to || from > to) {
            status.textContent = 'Bitte gültigen Zeitraum wählen (Von <= Bis).';
            return;
        }
        button.disabled = true;
        status.textContent = 'Lade Transaktionen...';
        try {
            const bearerToken = await getBearerTokenFromCookie();
            const transactions = await fetchWalletTransactionHistory(bearerToken, { since: `${from}T00:00:00.000Z` });
            const { rows, review, totals } = buildKoinlyRows(transactions, { from, to });
            const csv = toKoinlyCsv(rows.concat(review));
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `GoMining_Koinly_${from}_bis_${to}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            const totalsText = Object.entries(totals).map(([cur, value]) => `${cur}: ${value}`).join(', ');
            status.textContent = `${rows.length} Zeilen exportiert` + (review.length ? `, ${review.length} Zeilen mit "PRÜFEN" (NFT-Vorgänge)` : '') + `. Netto: ${totalsText}`;
        } catch (error) {
            console.error('Koinly export failed:', error);
            status.textContent = `Fehler: ${error.message}`;
        } finally {
            button.disabled = false;
        }
    });
}
