import { BASE_URL } from "../config.js";
import { fetchData, fetchUpgradesNFT } from './api.js';

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
        button.disabled = false;
        button.textContent = 'Update Maintenance';
        console.log('Update button activated.');

        try {
            const serviceResponse = await pushService(bearerToken);
            const { updateAvailableFrom: newUpdateTime } = serviceResponse.data;

            if (newUpdateTime) {
                const formattedNewTime = new Date(newUpdateTime).toISOString().replace('T', ' ').slice(0, 19);
                console.log(`New update time received: ${formattedNewTime}`);

                button.disabled = true;
                button.textContent = `Enable at ${formattedNewTime}`;

                const newUpdateDelay = new Date(newUpdateTime).getTime() - new Date().getTime();
                if (newUpdateDelay > 0) {
                    setTimeout(async () => {
                        await handleButtonActivation(button, bearerToken);
                    }, newUpdateDelay);
                } else {
                    console.log('New update time has already passed. Keeping button enabled for manual action.');
                    button.disabled = false;
                    button.textContent = 'Update Maintenance';
                }
            }
        } catch (error) {
            console.error('Error pushing service:', error);
            button.disabled = false;
            button.textContent = 'Retry Update';
        }
    }
}
