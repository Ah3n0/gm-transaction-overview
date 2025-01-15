/**
 * Writes data to a CSV file and triggers a download.
 * @param {string} filename - The name of the file to be downloaded.
 * @param {Array<Object>} data - The data to be written to the file.
 * @param {Array<string>} headers - The headers for the CSV file.
 */
export function writeToCSV(filename, data, headers) {
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