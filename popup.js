let minBrightness;

chrome.storage.sync.get(
  ["minBrightness"],
  (result) => {
    minBrightness = result.minBrightness; // Minimum brightness level
  }
);

// Function to send message to content script with updated values
const sendMessageToContentScript = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const message = {
      type: "UPDATE_VARIABLES",
      minBrightness: minBrightness,
    };
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
};

// Get range inputs and value spans
const minBrightnessInput = document.getElementById("minBrightness");
const minBrightnessValue = document.getElementById("minBrightnessValue");

// Load values from storage or set default values
chrome.storage.sync.get(
  ["minBrightness"],
  (result) => {
    // Update inputs and value spans
    minBrightnessInput.value = result.minBrightness || 40;
    minBrightnessValue.textContent = result.minBrightness || 40;
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
