chrome.tabs.onUpdated.addListener((tabId, tab) => {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    const queryParams = tab.url.split("?");
    const urlParams = new URLSearchParams(queryParams[1]);
    const videoId = urlParams.get("v");

    chrome.tabs.sendMessage(tabId, { type: "New", videoId });
  }
});
