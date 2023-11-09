import { getCurrentTab } from "./utils.js";

const viewBookmarks = (currentBookmarks = []) => {
  const bookmarksWrapper = document.querySelector(".bookmarks");

  bookmarksWrapper.innerHTML = "";

  if (currentBookmarks.length) {
    currentBookmarks.forEach((bookmark) => {
      addBookmark(bookmarksWrapper, bookmark);
    });
  } else {
    handleNoBookmarks(bookmarksWrapper);
  }

  return;
};

const addBookmark = (bookmarksWrapper, bookmark) => {
  const bookmarkWrapper = document.createElement("div");

  bookmarkWrapper.classList.add("bookmark");
  bookmarkWrapper.id = `bookmark-${bookmark.timestamp}`;
  bookmarkWrapper.setAttribute("data-timestamp", bookmark.timestamp);

  const bookmarkTitle = document.createElement("p");

  bookmarkTitle.classList.add("bookmark-title");
  bookmarkTitle.innerText = bookmark.title;

  const bookmarkControls = document.createElement("div");
  bookmarkControls.classList.add("bookmark-controls");
  bookmarkControls.setAttribute("data-timestamp", bookmark.timestamp);

  addBookmarkButtons("play", handlePlay, bookmarkControls);
  addBookmarkButtons("delete", handleDelete, bookmarkControls);

  bookmarkWrapper.appendChild(bookmarkTitle);
  bookmarkWrapper.appendChild(bookmarkControls);
  bookmarksWrapper.appendChild(bookmarkWrapper);
};

const handleNoBookmarks = (bookmarksWrapper) => {
  const noBookmarks = document.createElement("i");
  noBookmarks.classList.add("no-bookmarks");
  noBookmarks.innerText = "No bookmarks yet";

  bookmarksWrapper.appendChild(noBookmarks);
};

const handlePlay = async (e) => {
  const timestamp =
    e.currentTarget.parentElement.getAttribute("data-timestamp");

  const activeTab = await getCurrentTab();

  chrome.tabs.sendMessage(activeTab.id, { type: "Play", timestamp });
};

const handleDelete = async (e) => {
  const timestamp =
    e.currentTarget.parentElement.getAttribute("data-timestamp");
  const activeTab = await getCurrentTab();

  const bookmark = document.getElementById(`bookmark-${timestamp}`);
  bookmark.parentNode.removeChild(bookmark);

  // get the current video id
  const queryParams = activeTab.url.split("?")[1];
  const urlParams = new URLSearchParams(queryParams);
  const currentVideo = urlParams.get("v");

  // get the current video bookmarks
  chrome.storage.sync.get([currentVideo], (result) => {
    const currentVideoBookmarks = result[currentVideo]
      ? typeof result[currentVideo] === "string"
        ? JSON.parse(result[currentVideo])
        : result[currentVideo]
      : [];

    // remove the bookmark from the current video bookmarks
    const newBookmarks = currentVideoBookmarks.filter(
      (bookmark) => bookmark.timestamp !== Number(timestamp)
    );

    // update the current video bookmarks
    chrome.storage.sync.set({
      [currentVideo]: newBookmarks,
    });

    // update the bookmarks view
    viewBookmarks(newBookmarks);

    // send message to content script to remove bookmark marker
    chrome.tabs.sendMessage(activeTab.id, {
      type: "Delete",
      timestamp,
    });
  });
};

const addBookmarkButtons = (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("button");
  controlElement.classList.add("bookmark-action", `bookmark-${src}`);
  controlElement.title = src;

  const controlElementIcon = document.createElement("img");

  controlElementIcon.src = `assets/${src}.svg`;

  controlElement.addEventListener("click", eventListener);

  controlElement.appendChild(controlElementIcon);
  controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getCurrentTab();
  const queryParams = activeTab.url.split("?")[1];
  const urlParams = new URLSearchParams(queryParams);

  const currentVideo = urlParams.get("v");

  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    chrome?.storage.sync.get([currentVideo], (result) => {
      const currentVideoBookmarks = result[currentVideo]
        ? typeof result[currentVideo] === "string"
          ? JSON.parse(result[currentVideo])
          : result[currentVideo]
        : [];

      viewBookmarks(currentVideoBookmarks);
    });
  } else {
    const container = document.querySelector(".container");

    container.innerHTML = `
      <h3>YT Bookmarks</h3>
        <p>This is not a YouTube video page.</p>
      <p>Open a YouTube video page to start bookmarking!</p>
    `;
  }
});
