import { 
    BASE_URL, 
    AUTH_URL, 
    OUTPUT_CSV_FILE, 
    KOINLY_CSV_FILE, 
    BLOCKPIT_CSV_FILE, 
    CSV_HEADER, 
    KOINLY_HEADER, 
    BLOCKPIT_HEADER 
} from './config.js';

import { writeToCSV } from './utils/file.js';
import { fetchData } from './utils/api.js';
import { formatDate } from './utils/time.js';
import { mapToKoinly, mapToBlockpit } from './utils/mappers.js';
import { getBearerTokenFromCookie } from './utils/cookies.js';

function updateStatusLabel(statusLabel, message, isError) {
    statusLabel.textContent = message;
    statusLabel.className = `status-label ${isError ? 'error' : 'success'}`;
    statusLabel.style.display = "block";
}

async function main() {
    const button = document.getElementById("inspect-cookies");
    const loader = document.getElementById("loader");
    const statusLabel = document.getElementById("status-label");
    const progressLabel = document.createElement("div");
    const datePicker = document.getElementById("start-date-picker");
    progressLabel.id = "progress-label";
    progressLabel.style.marginTop = "10px";
    progressLabel.style.color = "#555";
    progressLabel.style.display = "none";
    document.querySelector(".container").appendChild(progressLabel);

    try {
        const csvChecked = document.getElementById("csv-checkbox").checked;
        const koinlyChecked = document.getElementById("koinly-checkbox").checked;
        const blockpitChecked = document.getElementById("blockpit-checkbox").checked;

        if (!csvChecked && !koinlyChecked && !blockpitChecked) {
            updateStatusLabel(statusLabel, "Please select at least one option.", true);
            return;
        }

        // Get the selected start date
        const startDate = datePicker.value
            ? new Date(`${datePicker.value}T00:00:00`)
            : null;

        const bearerToken = await getBearerTokenFromCookie().catch((error) => {
            throw new Error("No access_token found. Please log in to GoMining (https://app.gomining.com) and try again.");
        });

        button.style.display = "none";
        button.disabled = true;
        loader.style.display = "inline-block";
        statusLabel.style.display = "none";
        progressLabel.style.display = "block";

        const firstResponse = await fetchData(0, bearerToken, BASE_URL);
        const totalEntries = firstResponse.data.count;
        const pages = Math.ceil(totalEntries / 50);
        const allEntries = [];

        for (let page = 1; page <= pages; page++) {
            const skip = (page - 1) * 50;
            progressLabel.textContent = `Fetching page ${page} of ${pages}...`;
            const response = await fetchData(skip, bearerToken, BASE_URL);

            // Include only entries starting from the selected date
            response.data.array.forEach((entry) => {
                if (entry.createdAt) { // Check if createdAt exists
                    // Extract the date part (YYYY-MM-DD) from the ISO format
                    const entryDate = entry.createdAt.split("T")[0]; 
                    const startDateString = datePicker.value; // DatePicker gives YYYY-MM-DD format
            
                    // Compare only the date parts
                    if (!startDateString || entryDate >= startDateString) {
                        allEntries.push(entry);
                    }
                } else {
                    console.warn("Entry without createdAt found:", entry); // Log problematic entries for debugging
                }
            });                      
        }

        progressLabel.style.display = "none";

        if (csvChecked) writeToCSV(OUTPUT_CSV_FILE, allEntries, CSV_HEADER);
        if (koinlyChecked) writeToCSV(KOINLY_CSV_FILE, allEntries.map(mapToKoinly), KOINLY_HEADER);
        if (blockpitChecked) writeToCSV(BLOCKPIT_CSV_FILE, allEntries.map(mapToBlockpit), BLOCKPIT_HEADER);

        updateStatusLabel(statusLabel, "Download successful!", false);
    } catch (error) {
        console.error("Error:", error);
        updateStatusLabel(statusLabel, error.message || "Error during download!", true);
    } finally {
        button.style.display = "inline-block";
        button.disabled = false;
        loader.style.display = "none";
        progressLabel.style.display = "none";
    }
}

document.getElementById("inspect-cookies").addEventListener("click", main);

document.addEventListener("DOMContentLoaded", async () => {
    const datePicker = document.getElementById("start-date-picker");
    const clearDateLink = document.getElementById("clear-date");
    const createdAtElement = document.getElementById("createdAt");
    const manifest = chrome.runtime.getManifest();
    document.getElementById("version-info").textContent = `Version: ${manifest.version}`;

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

            // createdAt formatting
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