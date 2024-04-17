(() => {
  let youtubeLeftControls, youtubePlayer, analysisInterval, isVideoPlaying;
  let brightOsenseisON = false;
  let previousOpacity = 100;
  let isSpacebarPressed = false;
  let lastClickTime = new Date().getTime();
  const clickDelay = 200; // Adjust the delay (in milliseconds) as needed

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

    document.addEventListener("keydown", function (event) {
      if (event.code === "Space" && !isSpacebarPressed) {
        isSpacebarPressed = true;
        handleYoutubePlayerClick();
      }
    });

    document.addEventListener("keyup", function (event) {
      if (event.code === "Space") {
        isSpacebarPressed = false;
      }
    });
  };

  const handleYoutubePlayerClick = () => {
    const currentTime = new Date().getTime();
    if (currentTime - lastClickTime < clickDelay) {
      return; // Ignore the click if it's within the delay threshold
    }

    lastClickTime = currentTime; // Update the last click time

    isVideoPlaying = document.getElementsByClassName("paused-mode")[0];
    console.log("isVideoPlaying", isVideoPlaying);
    if (brightOsenseisON && isVideoPlaying) {
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
    let totalDullPixels = 0;
    let totalBrightPixels = 0;

    for (let i = 0; i < pixels.length; i += 64 * 4) {
      // Extract RGB values of each pixel
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Calculate pixel brightness (luminance)
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

      // Check if pixel is black or white based on luminance threshold
      if (luminance < 0.1 || luminance > 0.9) {
        totalDullPixels++;
      } else {
        totalBrightPixels++;
      }
    }

    // Log the color distribution

    if (totalDullPixels > totalBrightPixels) {
      console.log(
        "Video is black. ---->",
        "Dull:",
        totalDullPixels,
        "Bright:",
        totalBrightPixels
      );
    } else {
      console.log(
        "Video is colored. ---->",
        "Dull:",
        totalDullPixels,
        "Bright:",
        totalBrightPixels
      );
    }

    adjustBrightness(totalDullPixels, totalBrightPixels);
  };

  const adjustBrightness = (totalDullPixels, totalBrightPixels) => {
    // Calculate the ratio of dull pixels to the total pixels
    const totalPixels = totalDullPixels + totalBrightPixels;
    const dullRatio = totalDullPixels / totalPixels;

    // Map the dull ratio to the desired brightness range (40% to 95%)
    const minBrightness = 40; // Minimum brightness level
    const maxBrightness = 95; // Maximum brightness level
    const differenceThreshold = 8;

    // Interpolate brightness based on the dull ratio
    const brightnessLevel =
      minBrightness + (maxBrightness - minBrightness) * dullRatio;

    console.log("current brightness ->", brightnessLevel);

    // Calculate the difference between the current and previous opacity
    const opacityDifference = brightnessLevel - previousOpacity;

    // Cap the change in brightness b/w differenceThreshold
    const cappedOpacityDifference =
      Math.min(Math.abs(opacityDifference), differenceThreshold) *
      Math.sign(opacityDifference);

    previousOpacity += cappedOpacityDifference;
    console.log("diff ->", cappedOpacityDifference);
    // Update the previous opacity based on the capped difference

    console.log("new brightness ->", previousOpacity);
    // Set the brightness level as opacity percentage for the video player
    youtubePlayer.style.opacity = previousOpacity + "%";
  };

  newVideoLoaded();
})();
