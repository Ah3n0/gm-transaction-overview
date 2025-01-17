/**
 * Writes data to a CSV file and triggers a download.
 * @param {string} filename - The name of the file to be downloaded.
 * @param {Array<Object>} data - The data to be written to the file.
 * @param {Array<string>} headers - The headers for the CSV file.
 */
export function writeToCSV(filename, data, headers) {
    const csvContent = [
        headers.join(","),
        ...data.map(row => headers.map(header => JSON.stringify(row[header] || "")).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export function globally for the worker
self.writeToCSV = writeToCSV;