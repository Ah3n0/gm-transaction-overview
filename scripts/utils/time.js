/**
 * Formats a date string or Date object to a standardized format.
 * Optionally adjusts the time by a specified number of hours.
 * @param {string|Date} date - The original date.
 * @param {number} [hourOffset=0] - Number of hours to adjust the time by.
 * @returns {string} The formatted date string.
 */
export function formatDate(date, hourOffset = 0) {
    const originalDate = new Date(date);
    const adjustedDate = new Date(originalDate.getTime() + hourOffset * 60 * 60 * 1000);
    return adjustedDate.toISOString().replace("T", " ").split(".")[0];
}
