/**
 * Fetches the bearer token from browser cookies for GoMining.
 * @returns {Promise<string>} A promise resolving to the bearer token.
 */
export async function getBearerTokenFromCookie() {
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