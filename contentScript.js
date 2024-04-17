(() => {
  let youtubeLeftControls, youtubePlayer, analysisInterval, isVideoPlayed;
  let brightOsenseisON = false;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "YOUTUBE") {
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
    youtubePlayer.addEventListener("click", handleYoutubePlayerClick);
  };

  const handleYoutubePlayerClick = () => {
    setInterval(() => {}, 5000);
    isVideoPlayed = document.getElementsByClassName("paused-mode")[0];
    console.log("isVideoPlayed", isVideoPlayed);
    if (brightOsenseisON && isVideoPlayed) {
      console.log("start again");
      analysisInterval = setInterval(analyzePixelData, 1000);
    } else {
      clearInterval(analysisInterval);
    }
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

    if (brightOsenseisON) {
      // Start analyzing pixel data every second
      analysisInterval = setInterval(analyzePixelData, 1000);
    } else {
      // Stop the analysis interval if brightOsenseisON is false
      youtubePlayer.style.opacity = "100%";
      clearInterval(analysisInterval);
    }
  };

  const analyzePixelData = () => {
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

    // Log the color distribution

    if (totalBlackPixels > totalColoredPixels) {
      console.log(
        "Video is black. ---->",
        "Black:",
        totalBlackPixels,
        "Colored:",
        totalColoredPixels
      );
    } else {
      console.log(
        "Video is colored. ---->",
        "Black:",
        totalBlackPixels,
        "Colored:",
        totalColoredPixels
      );
    }

    const isVideoBlack = totalBlackPixels > totalColoredPixels;
    adjustBrightness(isVideoBlack);
  };

  const adjustBrightness = (isVideoBlack) => {
    // Define the brightness value to set based on the video content
    // You can adjust these values according to your preference
    const brightnessLevel = isVideoBlack ? "80%" : "50%";
    console.log(brightnessLevel, isVideoBlack);
    youtubePlayer.style.opacity = brightnessLevel;
  };

  newVideoLoaded();
})();
