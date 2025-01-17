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
import { fetchDiscount, fetchNFT, fetchMaintenanceState, fetchUserRewards, fetchClanMember } from './utils/api.js';
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

    // Fetch all miners
    try {
        const bearerToken = await getBearerTokenFromCookie();
        const data = await fetchNFT(0, bearerToken);
        const miners = data.data.array;

        minerList.innerHTML = '';
        miners.forEach(miner => {
            const minerData = miner.nfts[0];
            if (!minerData) {
                console.warn('Miner without NFT data:', miner);
                return;
            }

            const card = document.createElement('div');
            card.className = 'miner-card';

            card.innerHTML = `
                <img src="${minerData.smallImageUrl}" alt="${minerData.name}">
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
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>Round ID:</strong> ${reward.roundId} <br>
                <strong>Created At:</strong> ${reward.createdAt} <br>
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
        const clanMembers = clanData.data.usersForClient;

        const clanList = document.getElementById('clan-list');
        const clanMemberCount = document.getElementById('clan-member-count');
        clanList.innerHTML = '';
        clanMemberCount.textContent = clanMembers.length;

        clanMembers.forEach(member => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>Alias:</strong> ${member.alias} <br>
                <strong>Power:</strong> ${member.power} <br>
                <strong>Join Date:</strong> ${member.joinDate}
            `;
            clanList.appendChild(listItem);
        });
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