import { BASE_URL } from "../config.js";
import { fetchData, fetchUpgradesNFT, pushService, fetchMaintenanceState } from './api.js';

export function updateStatusLabel(statusLabel, message, isError) {
    statusLabel.textContent = message;
    statusLabel.className = `status-label ${isError ? 'error' : 'success'}`;
    statusLabel.style.display = "block";
}

export async function fetchAllEntries(bearerToken, datePicker, progressLabel) {
    const firstResponse = await fetchData(0, bearerToken, BASE_URL);
    const totalEntries = firstResponse.data.count;
    const pages = Math.ceil(totalEntries / 50);
    const allEntries = [];

    for (let page = 1; page <= pages; page++) {
        const skip = (page - 1) * 50;
        progressLabel.textContent = `Fetching page ${page} of ${pages}...`;
        const response = await fetchData(skip, bearerToken, BASE_URL);

        response.data.array.forEach((entry) => {
            if (entry.createdAt) {
                const entryDate = entry.createdAt.split("T")[0];
                const startDateString = datePicker.value;
                if (!startDateString || entryDate >= startDateString) {
                    allEntries.push(entry);
                }
            } else {
                console.warn("Entry without createdAt found:", entry);
            }
        });
    }

    return allEntries;
}

export async function displayMinerEvents(minerId, bearerToken) {
    const eventList = document.getElementById('event-list');
    const minerEventsContainer = document.getElementById('miner-events');
    minerEventsContainer.style.display = 'block';
    eventList.innerHTML = '<li>Loading events...</li>';

    if (!minerId) {
        console.error('Miner ID is undefined or invalid.');
        eventList.innerHTML = '<li>Invalid Miner ID.</li>';
        return;
    }

    try {
        const response = await fetchUpgradesNFT(0, bearerToken);
        const events = response.data.array.filter(event => event.nft?.id === minerId);

        if (events.length === 0) {
            eventList.innerHTML = '<li>No events found for this miner.</li>';
            return;
        }

        eventList.innerHTML = '';
        events.forEach(event => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>Updated At:</strong> ${event.updatedAt} <br>
                <strong>Status:</strong> ${event.status} <br>
                <strong>Upgrade Type:</strong> ${event.upgradeType || 'N/A'} <br>
                <strong>USD Value:</strong> ${event.usdtValue || 0} USD
            `;
            eventList.appendChild(listItem);
        });
        minerEventsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('Error fetching miner events:', error);
        eventList.innerHTML = '<li>Error fetching events.</li>';
    }
}

export async function handleButtonActivation(button, bearerToken) {
    if (button) {
        try {
            const serviceResponse = await pushService(bearerToken);
            const { updateAvailableFrom: newUpdateTime } = serviceResponse.data;

            if (newUpdateTime) {
                const updateTime = new Date(newUpdateTime).getTime();
                const now = new Date().getTime();
                const delay = updateTime - now;

                if (delay > 0) {
                    startCountdown(button, delay, bearerToken);
                } else {
                    button.disabled = false;
                    button.textContent = 'Update Maintenance';
                    console.log('Update button activated.');
                }
            }
        } catch (error) {
            console.error('Error pushing service:', error);
            button.disabled = false;
            button.textContent = 'Retry Update';
        }
    }
}

function startCountdown(button, delay, bearerToken) {
    let remainingTime = delay;

    const interval = setInterval(() => {
        if (remainingTime <= 0) {
            clearInterval(interval);
            button.disabled = false;
            button.textContent = 'Update Maintenance';
            handleButtonActivation(button, bearerToken);
        } else {
            button.disabled = true;
            button.textContent = `Enable in ${Math.ceil(remainingTime / 1000)}s`;
            remainingTime -= 1000;
        }
    }, 1000);

    setTimeout(async () => {
        await handleButtonActivation(button, bearerToken);
    }, delay);

    // Check maintenance state periodically
    setInterval(async () => {
        try {
            const maintenanceState = await fetchMaintenanceState(bearerToken);
            const { updateAvailableFrom } = maintenanceState.data;
            const newUpdateTime = new Date(updateAvailableFrom).getTime();
            const now = new Date().getTime();
            const newDelay = newUpdateTime - now;

            if (newDelay <= 0) {
                clearInterval(interval);
                button.disabled = false;
                button.textContent = 'Update Maintenance';
                handleButtonActivation(button, bearerToken);
            }
        } catch (error) {
            console.error('Error checking maintenance state:', error);
        }
    }, 60000); // Check every minute
}
