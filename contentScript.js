(() => {
  let currentVideo = "";
  let controls;
  let videoPlayer;

  let currentVideoBookmarks = [];

  chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    const { type, timestamp, videoId } = message;

    if (type === "New") {
      currentVideo = videoId;
      videoLoaded();
    } else if (type === "Play") {
      // check if an ad is playing
      const adPlaying = document.querySelector(".ytp-ad-preview-container");

      if (adPlaying) return;

      videoPlayer.currentTime = timestamp;
    } else if (type === "Delete") {
      const bookmarkMarker = document.getElementById(`marker-${timestamp}`);

      bookmarkMarker && bookmarkMarker.remove();
    }
  });

  const videoLoaded = async () => {
    const bookmarkButtonExists = document.querySelector(".ytp-bookmark-it");
    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkButtonExists) {
      // create bookmark button
      const bookmarkButton = document.createElement("button");
      bookmarkButton.classList.add("ytp-bookmark-it", "ytp-button");
      bookmarkButton.title = "Bookmark this timestamp";
      bookmarkButton.setAttribute("data-priority", "0");

      // styles
      bookmarkButton.style.background = "none";
      bookmarkButton.style.border = "none";
      bookmarkButton.style.display = "inline-flex";
      bookmarkButton.style.justifyContent = "center";
      bookmarkButton.style.alignItems = "center";
      bookmarkButton.style.padding = "1rem";
      bookmarkButton.style.marginRight = "0.5rem";

      // append icon to button
      const icon = document.createElement("img");
      icon.src = chrome.runtime.getURL("assets/bookmark.svg");
      icon.classList.add("ytp-bookmark-it-icon");
      icon.style.width = "100%";
      icon.style.height = "100%";

      bookmarkButton.appendChild(icon);

      // insert bookmark button in left controls
      controls = document.querySelector(".ytp-left-controls");
      controls.appendChild(bookmarkButton);

      // select video player
      videoPlayer = document.querySelector(".video-stream");

      // add event listener to bookmark button
      bookmarkButton.addEventListener("click", handleAddBookmark);
    }

    if (currentVideoBookmarks) {
      const adPlaying = document.querySelector(".ytp-ad-preview-container");

      if (adPlaying) return;

      currentVideoBookmarks.forEach((bookmark) => {
        addBookmarkMarker(bookmark.timestamp);
      });
    }
  };

  const handleAddBookmark = async () => {
    // check if an ad is playing
    const adPlaying = document.querySelector(".ytp-ad-preview-container");

    if (adPlaying) return;

    const currentTime = videoPlayer.currentTime;

    const bookmark = {
      timestamp: currentTime,
      title: `Bookmark at ${getTime(currentTime)}`,
    };

    currentVideoBookmarks = await fetchBookmarks();

    addBookmarkMarker(currentTime);

    // render other bookmarks as well in case they were not rendered due to an ad playing
    currentVideoBookmarks.forEach((bookmark) => {
      addBookmarkMarker(bookmark.timestamp);
    });

    chrome?.storage.sync.set({
      [currentVideo]: [...currentVideoBookmarks, bookmark].sort(
        (a, b) => a.timestamp - b.timestamp
      ),
    });
  };

  const addBookmarkMarker = (timestamp) => {
    const progressContainer = document.querySelector(".ytp-chapters-container");
    const id = `marker-${timestamp}`;

    // check if bookmark marker already exists
    if (document.getElementById(id)) return;

    const bookmarkMarker = document.createElement("div");

    bookmarkMarker.classList.add("bookmark-marker");
    bookmarkMarker.id = id;

    bookmarkMarker.style.position = "absolute";
    bookmarkMarker.style.top = "0";
    bookmarkMarker.style.left = `${(timestamp / videoPlayer.duration) * 100}%`;
    bookmarkMarker.style.width = "2px";
    bookmarkMarker.style.height = "100%";
    bookmarkMarker.style.background = "yellow";
    bookmarkMarker.style.zIndex = "1000";

    progressContainer.appendChild(bookmarkMarker);
  };

  const fetchBookmarks = async () => {
    const bookmarks = await chrome?.storage.sync.get([currentVideo]);

    return bookmarks[currentVideo] ? bookmarks[currentVideo] : [];
  };

  const trail = "&ytExt=ON";

  if (
    !window.location.href.includes(trail) &&
    !window.location.href.includes("ab_channel") &&
    window.location.href.includes("youtube.com/watch")
  ) {
    window.location.href += trail;
  }
})();

const getTime = (timestamp) => {
  const date = new Date(timestamp);
  date.setSeconds(timestamp);

  return date.toISOString().substring(11, 19);
};
