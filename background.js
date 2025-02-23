// Store for our assignments
let storedAssignments = [];

// Listen for assignment updates from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ASSIGNMENTS_UPDATE') {
    storedAssignments = message.data;
    // Store in chrome.storage for persistence
    chrome.storage.local.set({ 'canvasAssignments': storedAssignments });
    // Update the action badge
    chrome.action.setBadgeText({ text: storedAssignments.length.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#007AFF' });
  }
  
  if (message.type === 'GET_ASSIGNMENTS') {
    sendResponse({ assignments: storedAssignments });
  }
});

// Initialize from storage when extension loads
chrome.storage.local.get('canvasAssignments', (data) => {
  if (data.canvasAssignments) {
    storedAssignments = data.canvasAssignments;
    chrome.action.setBadgeText({ text: storedAssignments.length.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#007AFF' });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SETTINGS') {
    chrome.windows.create({
      url: 'settings.html',
      type: 'popup',
      width: 440,
      height: 600
    });
  }
}); 