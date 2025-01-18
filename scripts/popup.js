import { 
    AUTH_URL, 
    OUTPUT_CSV_FILE, 
    KOINLY_CSV_FILE, 
    BLOCKPIT_CSV_FILE, 
    CSV_HEADER, 
    KOINLY_HEADER, 
    BLOCKPIT_HEADER 
} from './config.js';

import { writeToCSV } from './utils/file.js';
import { fetchDiscount, fetchNFT, fetchMaintenanceState, fetchUserRewards, fetchClanMember, fetchMarketplaceOrders } from './utils/api.js';
import { formatDate } from './utils/time.js';
import { mapToKoinly, mapToBlockpit } from './utils/mappers.js';
import { getBearerTokenFromCookie } from './utils/cookies.js';
import { updateStatusLabel, fetchAllEntries, displayMinerEvents, handleButtonActivation } from './utils/ui.js';

// Main function to handle the button click event
async function main() {
    const button = document.getElementById("inspect-cookies");
    const loader = document.getElementById("loader");
    const statusLabel = document.getElementById("status-label");
    const datePicker = document.getElementById("start-date-picker");
    const progressLabel = document.createElement("div");
    progressLabel.id = "progress-label";
    progressLabel.style.marginTop = "10px";
    progressLabel.style.color = "#555";
    progressLabel.style.display = "none";
    document.querySelector(".container").appendChild(progressLabel);

    try {
        const csvChecked = document.getElementById("csv-checkbox").checked;
        const koinlyChecked = document.getElementById("koinly-checkbox").checked;
        const blockpitChecked = document.getElementById("blockpit-checkbox").checked;

        // Ensure at least one option is selected
        if (!csvChecked && !koinlyChecked && !blockpitChecked) {
            updateStatusLabel(statusLabel, "Please select at least one option.", true);
            return;
        }

        // Get the selected start date
        const startDate = datePicker.value ? new Date(`${datePicker.value}T00:00:00`) : null;

        // Get bearer token from cookies
        const bearerToken = await getBearerTokenFromCookie().catch((error) => {
            throw new Error("No access_token found. Please log in to GoMining (https://app.gomining.com) and try again.");
        });

        // Update UI elements to show loading state
        button.style.display = "none";
        button.disabled = true;
        loader.style.display = "inline-block";
        statusLabel.style.display = "none";
        progressLabel.style.display = "block";

        // Fetch all entries
        const allEntries = await fetchAllEntries(bearerToken, datePicker, progressLabel);

        progressLabel.style.display = "none";

        // Write data to CSV files based on selected options
        if (csvChecked) writeToCSV(OUTPUT_CSV_FILE, allEntries, CSV_HEADER);
        if (koinlyChecked) writeToCSV(KOINLY_CSV_FILE, allEntries.map(mapToKoinly), KOINLY_HEADER);
        if (blockpitChecked) writeToCSV(BLOCKPIT_CSV_FILE, allEntries.map(mapToBlockpit), BLOCKPIT_HEADER);

        updateStatusLabel(statusLabel, "Download successful!", false);
    } catch (error) {
        console.error("Error:", error);
        updateStatusLabel(statusLabel, error.message || "Error during download!", true);
    } finally {
        // Reset UI elements to initial state
        button.style.display = "inline-block";
        button.disabled = false;
        loader.style.display = "none";
        progressLabel.style.display = "none";
    }
}

// Add event listener to the button
document.getElementById("inspect-cookies").addEventListener("click", main);

// Event listener for DOM content loaded
document.addEventListener("DOMContentLoaded", async () => {
    const datePicker = document.getElementById("start-date-picker");
    const clearDateLink = document.getElementById("clear-date");
    const createdAtElement = document.getElementById("createdAt");
    const manifest = chrome.runtime.getManifest();
    const minerList = document.getElementById('miner-list');
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

            // Set the initial value of the date picker to the user's creation date
            if (datePicker && formattedDate) {
                const formattedPickerDate = new Date(formattedDate).toISOString().split('T')[0];
                datePicker.value = formattedPickerDate;
            }
        } else {
            throw new Error("No user data found.");
        }
    } catch (err) {
        console.error("Error fetching user info:", err);
        document.getElementById("alias").textContent = "Error";
    }

    // Toggle user-info section
    const userInfo = document.querySelector('.user-info');
    const toggleIcon = userInfo.querySelector('.toggle-icon');

    userInfo.querySelector('.toggle-container').addEventListener('click', () => {
        userInfo.classList.toggle('collapsed');
        toggleIcon.textContent = userInfo.classList.contains('collapsed') ? '>' : '<';

        // Adjust the width of other containers
        document.querySelectorAll('.container, .nft-info, .discount-info, .mw-info, .rewards-info, .clan-info').forEach(container => {
            container.style.width = userInfo.classList.contains('collapsed') ? '600px' : '500px';
        });
    });

    // Fetch all miners
    try {
        const bearerToken = await getBearerTokenFromCookie();
        const data = await fetchNFT(0, bearerToken);
        const miners = data.data.array;

        // Fetch marketplace orders
        const marketplaceOrders = await fetchMarketplaceOrders(bearerToken);
        const soldNftIds = marketplaceOrders.data.array
            .filter(order => order.status === "success")
            .map(order => order.nftId);

        minerList.innerHTML = '';
        miners.forEach(miner => {
            const minerData = miner.nfts[0];
            if (!minerData) {
                console.warn('Miner without NFT data:', miner);
                return;
            }

            const isSold = soldNftIds.includes(minerData.id);

            const card = document.createElement('div');
            card.className = `miner-card ${isSold ? 'sold' : ''}`;

            card.innerHTML = `
                <div class="image-container">
                    <img src="${minerData.smallImageUrl}" alt="${minerData.name}">
                    ${isSold ? '<div class="sold-stamp">Sold</div>' : ''}
                </div>
                <h4>${minerData.name}</h4>
                <p>Value: ${miner.value || 0} GMT</p>
            `;

            // Click event for miner cards
            card.addEventListener('click', () => {
                displayMinerEvents(minerData.id, bearerToken);
            });

            minerList.appendChild(card);
        });
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
                <strong>Multiplier:</strong> ${reward.multiplier}
            `;
            rewardsList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching user rewards:', error);
        document.getElementById('rewards-list').innerHTML = '<li>Error loading rewards.</li>';
    }

    // Fetch clan members
    try {
        const bearerToken = await getBearerTokenFromCookie();
        const clanData = await fetchClanMember(bearerToken);
        let clanMembers = clanData.data.usersForClient;

        const clanList = document.getElementById('clan-list');
        const clanMemberCount = document.getElementById('clan-member-count');
        const sortSelect = document.getElementById('sort-clan-members');
        const filterSelect = document.getElementById('filter-clan-members');
        const totalSumElement = document.getElementById('total-sum');
        clanList.innerHTML = '';
        clanMemberCount.textContent = clanMembers.length;

        if (clanMembers.length === 0) {
            clanList.innerHTML = '<li>No clan members found. You are in Solo Mining.</li>';
        } else {
            function renderClanMembers(members) {
                clanList.innerHTML = '';
                let totalSum = 0;
                members.forEach(member => {
                    const joinDate = new Date(member.joinDate);
                    const utcJoinDate = joinDate.toUTCString();
                    const isOwner = member.isOwner ? 'clan-owner' : '';

                    const abilities = member.usedNftGameAbilities || [];
                    const abilityCounts = {
                        "2ec728e7-f31f-4df3-b486-5e82a4976563": 0,
                        "44e8af7d-bcfb-4606-a111-5d6ccf1ab463": 0,
                        "a1f33226-2b51-4b6e-bbfc-eb0a20f0de1c": 0,
                        "ac859dd7-3981-4a10-886b-7c0b03b7a498": 0
                    };

                    abilities.forEach(ability => {
                        if (abilityCounts.hasOwnProperty(ability.nftGameAbilityId)) {
                            abilityCounts[ability.nftGameAbilityId] = ability.count;
                        }
                    });

                    const redSum = abilityCounts["44e8af7d-bcfb-4606-a111-5d6ccf1ab463"] * 1;
                    const purpleSum = abilityCounts["a1f33226-2b51-4b6e-bbfc-eb0a20f0de1c"] * 9;
                    const greenSum = abilityCounts["ac859dd7-3981-4a10-886b-7c0b03b7a498"] * 1;
                    const totalMemberSum = redSum + purpleSum + greenSum;
                    totalSum += totalMemberSum;

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
                            <strong>Total:</strong> ${totalMemberSum} GMT
                        </div>
                    `;

                    listItem.querySelector('.summary').addEventListener('click', () => {
                        listItem.classList.toggle('open');
                    });

                    clanList.appendChild(listItem);
                });
                totalSumElement.innerHTML = `<strong>Total Sum:</strong> ${totalSum} GMT`;
            }

            function sortClanMembers(criteria) {
                let sortedMembers;
                switch (criteria) {
                    case 'alphabetical':
                        sortedMembers = clanMembers.sort((a, b) => a.alias.localeCompare(b.alias));
                        break;
                    case 'joinDate':
                        sortedMembers = clanMembers.sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
                        break;
                    case 'power':
                        sortedMembers = clanMembers.sort((a, b) => b.power - a.power);
                        break;
                    case 'ability1':
                        sortedMembers = clanMembers.sort((a, b) => b.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "2ec728e7-f31f-4df3-b486-5e82a4976563")?.count - a.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "2ec728e7-f31f-4df3-b486-5e82a4976563")?.count);
                        break;
                    case 'ability2':
                        sortedMembers = clanMembers.sort((a, b) => b.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "44e8af7d-bcfb-4606-a111-5d6ccf1ab463")?.count - a.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "44e8af7d-bcfb-4606-a111-5d6ccf1ab463")?.count);
                        break;
                    case 'ability3':
                        sortedMembers = clanMembers.sort((a, b) => b.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "a1f33226-2b51-4b6e-bbfc-eb0a20f0de1c")?.count - a.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "a1f33226-2b51-4b6e-bbfc-eb0a20f0de1c")?.count);
                        break;
                    case 'ability4':
                        sortedMembers = clanMembers.sort((a, b) => b.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "ac859dd7-3981-4a10-886b-7c0b03b7a498")?.count - a.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "ac859dd7-3981-4a10-886b-7c0b03b7a498")?.count);
                        break;
                    case 'total':
                        sortedMembers = clanMembers.sort((a, b) => {
                            const aTotal = (a.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "44e8af7d-bcfb-4606-a111-5d6ccf1ab463")?.count || 0) * 1 +
                                           (a.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "a1f33226-2b51-4b6e-bbfc-eb0a20f0de1c")?.count || 0) * 9 +
                                           (a.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "ac859dd7-3981-4a10-886b-7c0b03b7a498")?.count || 0) * 1;
                            const bTotal = (b.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "44e8af7d-bcfb-4606-a111-5d6ccf1ab463")?.count || 0) * 1 +
                                           (b.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "a1f33226-2b51-4b6e-bbfc-eb0a20f0de1c")?.count || 0) * 9 +
                                           (b.usedNftGameAbilities?.find(a => a.nftGameAbilityId === "ac859dd7-3981-4a10-886b-7c0b03b7a498")?.count || 0) * 1;
                            return bTotal - aTotal;
                        });
                        break;
                    default:
                        sortedMembers = clanMembers;
                }
                renderClanMembers(sortedMembers);
            }

            function filterClanMembers(days) {
                if (!days) {
                    renderClanMembers(clanMembers);
                    return;
                }
                const now = new Date();
                const filteredMembers = clanMembers.filter(member => {
                    const joinDate = new Date(member.joinDate);
                    const diffTime = Math.abs(now - joinDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= days;
                });
                renderClanMembers(filteredMembers);
            }

            sortSelect.addEventListener('change', (event) => {
                sortClanMembers(event.target.value);
            });

            filterSelect.addEventListener('change', (event) => {
                filterClanMembers(event.target.value ? parseInt(event.target.value) : null);
            });

            sortClanMembers(sortSelect.value);
        }
    } catch (error) {
        console.error('Error fetching clan members:', error);
        document.getElementById('clan-list').innerHTML = '<li>Error loading clan members.</li>';
    }

    // Event handler to clear the date picker
    clearDateLink.addEventListener("click", (event) => {
        event.preventDefault();
        if (datePicker) {
            const createdAtElement = document.getElementById("createdAt");
            const createdAt = createdAtElement?.textContent.trim();
            if (createdAt) {
                const formattedDate = new Date(createdAt).toISOString().split('T')[0];
                datePicker.value = formattedDate;
                console.log(`Date picker reset to createdAt date: ${formattedDate}`);
            } else {
                console.error("CreatedAt date not found.");
            }
        }
    });    
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
    });
});