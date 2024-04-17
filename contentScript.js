console.log("hey");
(() => {
  let youtubeLeftControls, youtubePlayer;
  let brightOsenseisON = false;
  let currentVideo = "";

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "YOUTUBE") {
      currentVideo = message.videoId;
      newVideoLoaded();
    }
  });

  const newVideoLoaded = async () => {
    const brightOsenseBtnExists =
      document.getElementsByClassName("brightOsense-btn")[0];

    if (!brightOsenseBtnExists) {
      const brightOsenseBtn = document.createElement("button");
      const brightOsenseimg = document.createElement("img");

      brightOsenseimg.src = chrome.runtime.getURL("assets/brightOsenseOff.svg");
      brightOsenseimg.className = `brightOsense-btn`;
      brightOsenseBtn.className = "ytp-button";

      brightOsenseBtn.title = "Auto Brightness";
      brightOsenseimg.style.width = "34px";
      brightOsenseimg.style.height = "48px";

      brightOsenseBtn.appendChild(brightOsenseimg);

      youtubeLeftControls =
        document.getElementsByClassName("ytp-right-controls")[0];

      youtubeLeftControls.appendChild(brightOsenseBtn);
      brightOsenseBtn.addEventListener("click", handleBrightOsenseBtnClick);
    }
    youtubePlayer = document.getElementsByClassName("video-stream")[0];
  };

  const handleBrightOsenseBtnClick = () => {
    brightOsenseisON = !brightOsenseisON;
    const brightOsenseBtn =
      document.getElementsByClassName("brightOsense-btn")[0];
    brightOsenseBtn.src = chrome.runtime.getURL(
      brightOsenseisON
        ? "assets/brightOsenseOn.svg"
        : "assets/brightOsenseOff.svg"
    );

    // Create a canvas element to draw the video frame
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to match the video
    canvas.width = youtubePlayer.videoWidth;
    canvas.height = youtubePlayer.videoHeight;

    // Draw the current video frame onto the canvas
    ctx.drawImage(youtubePlayer, 0, 0, canvas.width, canvas.height);

    // Get pixel data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Analyze pixel data to determine color distribution
    let totalBlackPixels = 0;
    let totalColoredPixels = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      // Extract RGB values of each pixel
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Calculate pixel brightness (luminance)
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

      // Check if pixel is black or white based on luminance threshold
      if (luminance < 0.1 || luminance > 0.9) {
        totalBlackPixels++;
      } else {
        totalColoredPixels++;
      }
    }

    // Determine if the video is predominantly black and white or colored
    if (totalBlackPixels > totalColoredPixels) {
      console.log(
        "Video is predominantly black.",
        totalBlackPixels,
        totalColoredPixels
      );
    } else {
      console.log(
        "Video is predominantly colored.",
        totalBlackPixels,
        totalColoredPixels
      );
    }
  };
})();
