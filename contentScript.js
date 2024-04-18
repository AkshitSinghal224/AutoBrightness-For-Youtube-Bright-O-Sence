(() => {
  let youtubeLeftControls,
    youtubePlayer,
    analysisInterval,
    isVideoPlaying,
    minBrightness;
  let brightOsenseisON = false;
  let previousOpacity = 100;
  let isSpacebarPressed = false;
  let SkipFrames = 0;

  chrome.storage.sync.get(
    ["minBrightness"],
    (result) => {
      minBrightness = result.minBrightness; // Minimum brightness level
    }
  );

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "YOUTUBE") {
      newVideoLoaded();
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "UPDATE_VARIABLES") {
      minBrightness = message.minBrightness || 40;
    }
  });

  // Create a MutationObserver to watch for changes in the video player container
  const observer = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
      if (
        mutation.type === "childList" &&
        mutation.target.classList.contains("video-stream")
      ) {
        // Reset the script when a new video starts
        clearInterval(analysisInterval);
        // Reinitialize the script for the new video
        newVideoLoaded();
        break;
      }
    }
  });

  observer.observe(document.body, { subtree: true, childList: true });

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
      brightOsenseimg.style.width = "27px";
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
    isVideoPlaying = document.getElementsByClassName("paused-mode")[0];
    if (brightOsenseisON && isVideoPlaying) {
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

    isVideoPlaying = document.getElementsByClassName("paused-mode")[0];
    if (isVideoPlaying) {
      return;
    }

    // Check if the youtubePlayer is ready
    if (youtubePlayer.readyState >= youtubePlayer.HAVE_CURRENT_DATA) {
      // Create a canvas element to draw the video frame
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      SkipFrames = 0;

      // Set canvas dimensions to match the video
      canvas.width = youtubePlayer.videoWidth;
      canvas.height = youtubePlayer.videoHeight;

      // Draw the current video frame onto the canvas
      ctx.drawImage(youtubePlayer, 0, 0, canvas.width, canvas.height);

      try {
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

        adjustBrightness(totalDullPixels, totalBrightPixels);
      } catch (error) {
        console.error("Error analyzing pixel data:", error);
      }
    } else {
      console.log("youtubePlayer is not ready yet. Skipping frame.");
      SkipFrames++;
      if (SkipFrames === 4) {
        clearInterval(analysisInterval);
        brightOsenseisON = false;
        const brightOsenseBtn =
          document.getElementsByClassName("brightOsense-btn")[0];
        brightOsenseBtn.src = chrome.runtime.getURL(
          brightOsenseisON
            ? "assets/brightOsenseOn.svg"
            : "assets/brightOsenseOff.svg"
        );
      }
    }
  };

  const adjustBrightness = (totalDullPixels, totalBrightPixels) => {
    console.log(minBrightness);

    // Calculate the ratio of dull pixels to the total pixels
    const totalPixels = totalDullPixels + totalBrightPixels;
    const dullRatio = totalDullPixels / totalPixels;

    // Interpolate brightness based on the dull ratio
    const brightnessLevel =
      minBrightness + (100 - minBrightness) * dullRatio;

    // Calculate the difference between the current and previous opacity
    const opacityDifference = brightnessLevel - previousOpacity;

    // Cap the change in brightness b/w 15
    const cappedOpacityDifference =
      Math.min(Math.abs(opacityDifference), 15) *
      Math.sign(opacityDifference);

    previousOpacity += cappedOpacityDifference;
    // Update the previous opacity based on the capped difference

    // if (totalDullPixels > totalBrightPixels) {
    //   console.log(
    //     "Video is dull. ---->",
    //     "D:",
    //     totalDullPixels,
    //     "B:",
    //     totalBrightPixels,
    //     "brightness ->",
    //     previousOpacity
    //   );
    // } else {
    //   console.log(
    //     "Video is bright. ---->",
    //     "D:",
    //     totalDullPixels,
    //     "B:",
    //     totalBrightPixels,
    //     "brightness ->",
    //     previousOpacity
    //   );
    // }

    // Set the brightness level as opacity percentage for the video player
    youtubePlayer.style.opacity = previousOpacity + "%";
  };

  newVideoLoaded();
})();
