chrome.runtime.onUpdateAvailable.addListener((details) => {
    console.log("A new version of the extension is available: ", details.version);
    chrome.runtime.reload();
});