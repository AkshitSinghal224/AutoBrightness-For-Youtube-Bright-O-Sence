let minBrightness, maxBrightness, differenceThreshold;

chrome.storage.sync.get(
  ["minBrightness", "maxBrightness", "differenceThreshold"],
  (result) => {
    minBrightness = result.minBrightness; // Minimum brightness level
    maxBrightness = result.maxBrightness; // Maximum brightness level
    differenceThreshold = result.differenceThreshold;
  }
);

// Function to send message to content script with updated values
const sendMessageToContentScript = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const message = {
      type: "UPDATE_VARIABLES",
      minBrightness: minBrightness,
      maxBrightness: maxBrightness,
      differenceThreshold: differenceThreshold,
    };
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
};

// Get range inputs and value spans
const minBrightnessInput = document.getElementById("minBrightness");
const maxBrightnessInput = document.getElementById("maxBrightness");
const differenceThresholdInput = document.getElementById("differenceThreshold");
const minBrightnessValue = document.getElementById("minBrightnessValue");
const maxBrightnessValue = document.getElementById("maxBrightnessValue");
const differenceThresholdValue = document.getElementById(
  "differenceThresholdValue"
);

// Load values from storage or set default values
chrome.storage.sync.get(
  ["minBrightness", "maxBrightness", "differenceThreshold"],
  (result) => {
    // Update inputs and value spans
    minBrightnessInput.value = result.minBrightness || 40;
    maxBrightnessInput.value = result.maxBrightness || 80;
    differenceThresholdInput.value = result.differenceThreshold || 15;
    minBrightnessValue.textContent = result.minBrightness || 40;
    maxBrightnessValue.textContent = result.maxBrightness || 80;
    differenceThresholdValue.textContent = result.differenceThreshold || 15;
  }
);

// Event listeners to send message when input values change
// Save the updated value to storage
minBrightnessInput.addEventListener("input", () => {
  minBrightness = parseInt(minBrightnessInput.value);
  minBrightnessValue.textContent = minBrightnessInput.value;
  chrome.storage.sync.set({ minBrightness: minBrightness });
  sendMessageToContentScript();
});

maxBrightnessInput.addEventListener("input", () => {
  // Save the updated value to storage
  maxBrightness = parseInt(maxBrightnessInput.value);
  maxBrightnessValue.textContent = maxBrightnessInput.value;
  chrome.storage.sync.set({ maxBrightness: maxBrightness });
  sendMessageToContentScript();
});

differenceThresholdInput.addEventListener("input", () => {
  // Save the updated value to storage
  differenceThreshold = parseInt(differenceThresholdInput.value);
  differenceThresholdValue.textContent = differenceThresholdInput.value;
  chrome.storage.sync.set({ differenceThreshold: differenceThreshold });
  sendMessageToContentScript();
});
