import { 
    BASE_URL, 
    AUTH_URL,
    OUTPUT_CSV_FILE, 
    KOINLY_CSV_FILE, 
    BLOCKPIT_CSV_FILE, 
    CSV_HEADER, 
    KOINLY_HEADER, 
    BLOCKPIT_HEADER,
    mapToKoinly,
    mapToBlockpit
} from './config.js';

// Fetch the Bearer Token from cookies
async function getBearerTokenFromCookie() {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({ name: "access_token" }, (cookies) => {
            const gominingToken = cookies.find(cookie => cookie.domain.includes("gomining.com"));
            if (!gominingToken) {
                reject("No access_token cookie found for GoMining (gomining.com). Please log in to continue.");
            } else {
                resolve(gominingToken.value);
            }
        });
    });
}

// Fetch data from the API
async function fetchData(skip, bearerToken) {
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
            throw new Error("Unauthorized. Please ensure you are logged in to GoMining.");
        }
        throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
}

// Write data to CSV
function writeToCSV(filename, data, headers) {
    const rows = [headers.join(",")]; // Add CSV header
    data.forEach((entry) => {
        const row = headers.map((key) => JSON.stringify(entry[key] || "")).join(",");
        rows.push(row);
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}

// Main logic
async function main() {
    const button = document.getElementById("inspect-cookies");
    const loader = document.getElementById("loader");
    const statusLabel = document.getElementById("status-label");
    const progressLabel = document.createElement("div");
    progressLabel.id = "progress-label";
    progressLabel.style.marginTop = "10px";
    progressLabel.style.color = "#555";
    progressLabel.style.display = "none";
    document.querySelector(".container").appendChild(progressLabel);

    try {
        // Check if at least one checkbox is selected
        const csvChecked = document.getElementById("csv-checkbox").checked;
        const koinlyChecked = document.getElementById("koinly-checkbox").checked;
        const blockpitChecked = document.getElementById("blockpit-checkbox").checked;

        if (!csvChecked && !koinlyChecked && !blockpitChecked) {
            statusLabel.textContent = "Please select at least one option.";
            statusLabel.className = "status-label error";
            statusLabel.style.display = "block";
            return; // Exit the function if no checkbox is selected
        }

        console.log("Fetching Bearer Token...");
        const bearerToken = await getBearerTokenFromCookie().catch((error) => {
            throw new Error("No access_token found. Please log in to GoMining (https://app.gomining.com) and try again.");
        });

        // Hide and disable the button, show the loader
        button.style.display = "none";
        button.disabled = true;
        loader.style.display = "inline-block";
        statusLabel.style.display = "none";
        progressLabel.style.display = "block";

        console.log("Fetching data...");
        const firstResponse = await fetchData(0, bearerToken);
        const totalEntries = firstResponse.data.count;
        const pages = Math.ceil(totalEntries / 50);

        const allEntries = [];

        for (let page = 1; page <= pages; page++) {
            const skip = (page - 1) * 50;
            progressLabel.textContent = `Fetching page ${page} of ${pages}...`;
            console.log(`Fetching page ${page} of ${pages} (skip=${skip})...`);
            const response = await fetchData(skip, bearerToken);
            allEntries.push(...response.data.array);
        }

        console.log(`Total entries fetched: ${allEntries.length}`);
        progressLabel.style.display = "none";

        if (csvChecked) {
            console.log("Writing output.csv...");
            writeToCSV(OUTPUT_CSV_FILE, allEntries, CSV_HEADER);
        }

        if (koinlyChecked) {
            console.log("Converting to Koinly format...");
            const koinlyEntries = allEntries.map(mapToKoinly);
            writeToCSV(KOINLY_CSV_FILE, koinlyEntries, KOINLY_HEADER);
        }

        if (blockpitChecked) {
            console.log("Converting to Blockpit format...");
            const blockpitEntries = allEntries.map(mapToBlockpit);
            writeToCSV(BLOCKPIT_CSV_FILE, blockpitEntries, BLOCKPIT_HEADER);
        }

        console.log("Selected files downloaded successfully!");
        statusLabel.textContent = "Download successful!";
        statusLabel.className = "status-label success";
    } catch (error) {
        console.error("Error:", error);
        statusLabel.textContent = error.message || "Error during download!";
        statusLabel.className = "status-label error";
    } finally {
        // Re-enable and show the button, hide the loader
        button.style.display = "inline-block";
        button.disabled = false;
        loader.style.display = "none";
        progressLabel.style.display = "none";
        statusLabel.style.display = "block";
    }
}

// Add event listener for the button in popup.html
document.getElementById("inspect-cookies").addEventListener("click", main);

document.addEventListener("DOMContentLoaded", async () => {
    // set version
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;
    const versionDiv = document.getElementById("version-info");
    versionDiv.textContent = `Version: ${currentVersion}`;
  
    // grep bearer
    console.log("Fetching Bearer Token...");
    let bearerToken;
    try {
        bearerToken = await getBearerTokenFromCookie(); 
    } catch (error) {
        console.error("No access_token found:", error);
    }
  
    // request user information
    if (bearerToken) {
        try {
            const header = {
                Authorization: `Bearer ${bearerToken}`,
                "Content-Type": "application/json"
            };
  
            const response = await fetch(AUTH_URL, {
                method: "GET",
                headers: header
            });

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }
  
            const data = await response.json();
    
            const userData = data.data;
            if (!userData) {
                throw new Error("No user data found.");
            }
  
            document.getElementById("alias").textContent = userData.alias || "";
            document.getElementById("user-id").textContent = userData.id || "";
            document.getElementById("email").textContent = userData.email || "";
            document.getElementById("createdAt").textContent = userData.createdAt || "";
        } catch (err) {
            console.error("Error fetching user info:", err);
            document.getElementById("alias").textContent = "Error";
        }
    }
});
  
  
  
