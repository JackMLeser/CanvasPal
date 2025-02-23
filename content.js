console.log('Extension loaded!');
console.log('Current URL:', window.location.href);

// Constants for priority calculation
const PRIORITY_WEIGHTS = {
  GRADE_IMPACT: 0.4,
  COURSE_GRADE: 0.3,
  DUE_DATE: 0.3
};

let globalAssignments = [];

// Add debug levels and structured logging
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

let currentLogLevel = LOG_LEVELS.DEBUG;

// Add these constants at the top of content.js
const DEBUG_COLORS = {
  ASSIGNMENT: '#ff69b4',  // Hot pink
  QUIZ: '#87ceeb',       // Sky blue
  DISCUSSION: '#98fb98',  // Pale green
  ANNOUNCEMENT: '#dda0dd' // Plum
};

// Add these constants at the top
const DATE_DEBUG_STYLES = `
  .debug-date {
    background-color: rgba(255, 255, 0, 0.3) !important;
    border: 2px solid #ffd700 !important;
    position: relative !important;
    z-index: 1000;
    padding: 2px !important;
    margin: 2px !important;
    border-radius: 3px !important;
    display: inline-block !important;
  }
  .debug-date::after {
    content: "DATE";
    position: absolute;
    top: -20px;
    left: 0;
    background: #ffd700;
    color: black;
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 2px;
    z-index: 1001;
    pointer-events: none;
    white-space: nowrap;
  }
  .debug-date[title*="Due"]::after,
  .debug-date[aria-label*="Due"]::after {
    content: "DUE DATE";
    background: #ff6b6b;
    color: white;
  }
`;

// Add this CSS to dynamically highlight elements
const debugStyles = `
  .debug-highlight {
    position: relative !important;
    border: 2px solid transparent;
  }
  .debug-highlight::before {
    content: attr(data-debug-type);
    position: absolute;
    top: -20px;
    left: 0;
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 3px;
    color: white;
    z-index: 9999;
  }
  .debug-highlight-assignment {
    border-color: ${DEBUG_COLORS.ASSIGNMENT} !important;
  }
  .debug-highlight-assignment::before {
    background-color: ${DEBUG_COLORS.ASSIGNMENT};
  }
  .debug-highlight-quiz {
    border-color: ${DEBUG_COLORS.QUIZ} !important;
  }
  .debug-highlight-quiz::before {
    background-color: ${DEBUG_COLORS.QUIZ};
  }
  .debug-highlight-discussion {
    border-color: ${DEBUG_COLORS.DISCUSSION} !important;
  }
  .debug-highlight-discussion::before {
    background-color: ${DEBUG_COLORS.DISCUSSION};
  }
  .debug-highlight-announcement {
    border-color: ${DEBUG_COLORS.ANNOUNCEMENT} !important;
  }
  .debug-highlight-announcement::before {
    background-color: ${DEBUG_COLORS.ANNOUNCEMENT};
  }
`;

// Add the debug styles to the page
function injectDebugStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = debugStyles;
  document.head.appendChild(styleElement);
}

// Helper functions for different log levels
function logDebug(msg, data) { log(msg, data, LOG_LEVELS.DEBUG); }
function logInfo(msg, data) { log(msg, data, LOG_LEVELS.INFO); }
function logWarn(msg, data) { log(msg, data, LOG_LEVELS.WARN); }
function logError(msg, data) { log(msg, data, LOG_LEVELS.ERROR); }

function log(message, data = null, level = LOG_LEVELS.INFO) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = getLogPrefix(level);
  
  if (level >= currentLogLevel) {
    if (data) {
      // Pretty print objects, handle DOM elements specially
      const formattedData = formatLogData(data);
      console.log(`[${timestamp}] ${prefix} ${message}:`, formattedData);
    } else {
      console.log(`[${timestamp}] ${prefix} ${message}`);
    }
  }
}

function formatLogData(data) {
  if (data instanceof Element) {
    return {
      tagName: data.tagName,
      id: data.id,
      className: data.className,
      textContent: data.textContent?.substring(0, 100) + '...',
      html: data.outerHTML?.substring(0, 200) + '...'
    };
  } else if (Array.isArray(data)) {
    return data.map(item => formatLogData(item));
  } else if (data && typeof data === 'object') {
    const formatted = {};
    for (const [key, value] of Object.entries(data)) {
      formatted[key] = formatLogData(value);
    }
    return formatted;
  }
  return data;
}

function getLogPrefix(level) {
  switch(level) {
    case LOG_LEVELS.DEBUG: return '🔍 DEBUG:';
    case LOG_LEVELS.INFO: return '📢 INFO:';
    case LOG_LEVELS.WARN: return '⚠️ WARN:';
    case LOG_LEVELS.ERROR: return '❌ ERROR:';
    default: return '📢';
  }
}

function inspectHTML() {
  log('🔍 Starting HTML inspection');
  
  // Log the entire document structure
  log('📄 Document Title:', document.title);
  log('🌐 Current URL:', window.location.href);
  
  // Log main content area
  const mainContent = document.getElementById('content') || document.getElementById('main');
  if (mainContent) {
    log('📋 Main content area HTML:', mainContent.outerHTML);
  }
  
  // Log specific areas we're interested in
  const todoList = document.querySelector('div.todo-list');
  if (todoList) {
    log('📝 Todo List found:', todoList.outerHTML);
    const todos = todoList.querySelectorAll('li.todo');
    log(`Found ${todos.length} todo items`);
    todos.forEach((todo, index) => {
      log(`Todo item ${index + 1}:`, {
        html: todo.outerHTML,
        text: todo.textContent.trim(),
        links: Array.from(todo.querySelectorAll('a')).map(a => ({
          text: a.textContent.trim(),
          href: a.href
        }))
      });
    });
  } else {
    log('❌ No todo list found');
  }
  
  const upcomingEvents = document.querySelector('div.coming_up');
  if (upcomingEvents) {
    log('📅 Upcoming events found:', upcomingEvents.outerHTML);
    const events = upcomingEvents.querySelectorAll('li.upcoming-list-item');
    log(`Found ${events.length} upcoming events`);
    events.forEach((event, index) => {
      log(`Event ${index + 1}:`, {
        html: event.outerHTML,
        text: event.textContent.trim(),
        links: Array.from(event.querySelectorAll('a')).map(a => ({
          text: a.textContent.trim(),
          href: a.href
        }))
      });
    });
  } else {
    log('❌ No upcoming events found');
  }
  
  // Log all assignment-like elements
  const assignmentSelectors = [
    'div.todo-list li.todo',
    'div.coming_up li.upcoming-list-item',
    '.assignment',
    '[id*="assignment_"]',
    '[class*="assignment"]'
  ];
  
  assignmentSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    log(`🔍 Elements matching "${selector}":`, {
      count: elements.length,
      elements: Array.from(elements).map(el => ({
        html: el.outerHTML,
        text: el.textContent.trim()
      }))
    });
  });
}

function injectDateDebugStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = DATE_DEBUG_STYLES;
  document.head.appendChild(styleElement);
}

function cleanAssignmentTitle(fullTitle) {
  // Remove the "Assignment" prefix and extract the actual title
  const titleMatch = fullTitle.match(/Assignment (.*?)(?:, due|$)/);
  return titleMatch ? titleMatch[1] : fullTitle;
}

function extractDueDate(fullTitle) {
  // Extract the due date from the title
  const dateMatch = fullTitle.match(/due (.*?)(?:\.|$)/);
  return dateMatch ? dateMatch[1] : '';
}

// Add this function to send data to the extension popup
function sendAssignmentsToExtension(assignments) {
  chrome.runtime.sendMessage({
    type: 'ASSIGNMENTS_UPDATE',
    data: assignments.map(a => ({
      title: a.title,
      points: a.points,
      pointsText: a.pointsText,
      dueDate: a.dueDate,
      courseName: a.courseName || 'Unknown Course',
      priority: calculateAssignmentPriority(a)
    }))
  });
}

// Add this function for priority calculation
function calculateAssignmentPriority(assignment) {
  try {
    // Default priority if we can't calculate
    let priority = 0.5;

    // Calculate days until due
    const daysLeft = calculateDaysRemaining(assignment.dueDate);
    
    // Points-based priority (max 100 points = 1.0)
    const pointsPriority = Math.min(assignment.points / 100, 1);
    
    // Time-based priority (closer = higher priority)
    let timePriority = 0.5;
    if (daysLeft !== null) {
      if (daysLeft <= 0) timePriority = 1;
      else if (daysLeft <= 1) timePriority = 0.9;
      else if (daysLeft <= 3) timePriority = 0.8;
      else if (daysLeft <= 7) timePriority = 0.6;
      else timePriority = 0.3;
    }

    // Combined priority
    priority = (pointsPriority * 0.4) + (timePriority * 0.6);

    console.log('Priority calculation:', {
      assignment: assignment.title,
      points: assignment.points,
      daysLeft: daysLeft,
      pointsPriority: pointsPriority,
      timePriority: timePriority,
      finalPriority: priority
    });

    return priority;
  } catch (error) {
    console.error('Error calculating priority:', error);
    return 0.5; // Default priority
  }
}

// Update the highlightDates function to send data to extension
function highlightDates() {
  const processedAssignments = new Map();
  const assignmentContainers = document.querySelectorAll('div[data-testid="planner-item-raw"]');
  
  assignmentContainers.forEach(container => {
    const assignmentLink = container.querySelector('a[href*="/assignments/"]');
    const pointsSpan = container.querySelector('span.css-xqopp9-text');
    const ptsSpan = container.querySelector('span.css-1uakmj8-text');
    
    if (assignmentLink && pointsSpan) {
      const assignmentId = assignmentLink.href;
      
      if (processedAssignments.has(assignmentId)) return;

      const points = parseInt(pointsSpan.textContent);
      const pointsText = ptsSpan ? ptsSpan.textContent.trim() : 'pts';
      const fullTitle = assignmentLink.textContent.trim();
      
      if (!isNaN(points)) {
        // Highlight the points spans
        pointsSpan.style.backgroundColor = '#90EE90';
        pointsSpan.style.padding = '0 4px';
        if (ptsSpan) {
          ptsSpan.style.backgroundColor = '#ADD8E6';
          ptsSpan.style.padding = '0 4px';
        }

        // Store assignment info with additional details
        processedAssignments.set(assignmentId, {
          fullTitle: fullTitle,
          title: cleanAssignmentTitle(fullTitle),
          dueDate: extractDueDate(fullTitle),
          points: points,
          pointsText: pointsText,
          element: container,
          courseName: container.querySelector('span[color="secondary"]')?.textContent || ''
        });

        console.log('Found unique assignment:', {
          title: cleanAssignmentTitle(fullTitle),
          dueDate: extractDueDate(fullTitle),
          points: `${points} ${pointsText}`,
          container: container.outerHTML
        });
      }
    }
  });

  // Update debug panel and send to extension
  updateDebugPanel(processedAssignments);
  sendAssignmentsToExtension(Array.from(processedAssignments.values()));
}

// Update the updateDebugPanel function to only handle data without creating a visible panel
function updateDebugPanel(processedAssignments) {
  const assignments = Array.from(processedAssignments.values());
  assignments.sort((a, b) => calculateAssignmentPriority(b) - calculateAssignmentPriority(a));

  // Just log to console instead of creating a visible panel
  console.log('Processed Assignments:', assignments.map(a => ({
    title: a.title,
    points: `${a.points} ${a.pointsText}`,
    dueDate: a.dueDate,
    courseName: a.courseName,
    priority: Math.round(calculateAssignmentPriority(a) * 100) + '%'
  })));
}

// Wait for page to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', highlightDates);
} else {
  highlightDates();
}

// Also try after a short delay for dynamic content
setTimeout(highlightDates, 2000);

// Import priority system (at the top of content.js)
class PriorityCalculator {
  constructor(thresholds = { HIGH: 0.7, MEDIUM: 0.4 }, weights = { DUE_DATE: 0.6, POINTS: 0.3, COURSE_WEIGHT: 0.1 }) {
    this.thresholds = thresholds;
    this.weights = weights;
  }

  calculatePriority(assignment) {
    const timeUrgency = this.calculateTimeUrgency(assignment.dueDate);
    const pointsWeight = this.calculatePointsWeight(assignment.points);
    const courseWeight = this.calculateCourseWeight(assignment.courseWeight);

    const score = 
      timeUrgency * this.weights.DUE_DATE +
      pointsWeight * this.weights.POINTS +
      courseWeight * this.weights.COURSE_WEIGHT;

    return {
      level: this.getPriorityLevel(score),
      score,
      factors: {
        timeUrgency,
        pointsWeight,
        courseWeight
      }
    };
  }

  calculateTimeUrgency(dueDate) {
    try {
      // Parse the date string (e.g., "Feb 24 at 11:59pm")
      const [monthDay, time] = dueDate.split(' at ');
      const [month, day] = monthDay.split(' ');
      
      // Create date object for due date
      const now = new Date();
      const due = new Date(`${month} ${day}, ${now.getFullYear()} ${time}`);
      
      // If the due date appears to be in the past, it's probably for next year
      if (due < now) {
        due.setFullYear(due.getFullYear() + 1);
      }

      // Calculate days until due
      const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

      // Log for debugging
      console.log('Due date calculation:', {
        original: dueDate,
        parsed: due.toLocaleString(),
        daysUntilDue: daysUntilDue
      });

      return daysUntilDue;
    } catch (error) {
      console.error('Error calculating days until due:', error, { dueDate });
      return null;
    }
  }

  calculatePointsWeight(points, maxPoints = 100) {
    return Math.min(1, points / maxPoints);
  }

  calculateCourseWeight(weight = 1) {
    return Math.min(1, weight);
  }

  getPriorityLevel(score) {
    if (score >= this.thresholds.HIGH) return 'high';
    if (score >= this.thresholds.MEDIUM) return 'medium';
    return 'low';
  }
}

// Declare popup variable at the top level
let popup;

// First, declare all styles at the top
const combinedStyles = `
  .assignments-button {
    position: fixed;
    right: 20px;
    top: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(0, 122, 255, 0.95);
    color: white;
    border: none;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
  }

  .assignments-button.has-assignments {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  .assignments-button:hover {
    transform: translateY(-2px);
    background: rgba(0, 122, 255, 1);
    box-shadow: 0 6px 16px rgba(0, 122, 255, 0.4);
  }

  .assignments-popup {
    position: fixed;
    z-index: 2147483646;
    right: 20px;
    top: 75px;
    width: 380px;
    max-height: 600px;
    background: rgba(255, 255, 255, 0.98);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    display: none;
    overflow: hidden;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .assignments-popup.show {
    display: block;
  }

  .popup-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.95);
  }

  .popup-title {
    font-size: 18px;
    font-weight: 600;
    color: #1d1d1f;
  }

  .task-count {
    font-size: 13px;
    color: #666;
    margin-top: 4px;
  }

  .popup-content {
    padding: 16px;
    overflow-y: auto;
    max-height: calc(600px - 70px);
  }
`;

// Add these styles to your combinedStyles
const popupWithSettingsStyles = `
  .popup-content {
    position: relative;
    height: calc(600px - 65px);
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
  }

  .assignments-list {
    padding: 16px;
  }

  .assignment-card {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .assignment-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .assignment-card.urgent {
    border-left: 4px solid #FF453A;
  }

  .assignment-card.soon {
    border-left: 4px solid #FF9F0A;
  }

  .assignment-title {
    color: #007AFF;
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 12px;
    display: block;
  }

  .assignment-title:hover {
    color: #0056b3;
  }

  .due-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .due-date {
    font-size: 13px;
    color: #666;
  }

  .time-remaining {
    font-size: 13px;
    padding: 4px 10px;
    border-radius: 20px;
    background: #F2F2F7;
    color: #666;
  }

  .time-remaining.urgent {
    background: #FF453A15;
    color: #FF453A;
  }

  .time-remaining.soon {
    background: #FF9F0A15;
    color: #FF9F0A;
  }

  .points {
    font-size: 13px;
    color: #666;
    padding: 4px 10px;
    border-radius: 20px;
    background: #F2F2F7;
    display: inline-block;
  }

  .settings-content {
    display: none;
    padding: 24px;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    z-index: 10;
    overflow-y: auto;
  }

  .settings-content.show {
    display: block;
  }

  .settings-header {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .back-button {
    background: none;
    border: none;
    color: #007AFF;
    font-size: 16px;
    cursor: pointer;
    padding: 8px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .back-button:hover {
    color: #0056b3;
  }

  .settings-section {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .settings-section-title {
    font-size: 18px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 20px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .setting-item:last-child {
    border-bottom: none;
  }

  .setting-label-group {
    flex: 1;
  }

  .setting-label {
    font-size: 15px;
    color: #1d1d1f;
    font-weight: 500;
  }

  .setting-description {
    font-size: 13px;
    color: #666;
    margin-top: 4px;
  }

  .setting-control {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 120px;
  }

  .setting-control input[type="checkbox"] {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 2px solid #007AFF;
    appearance: none;
    -webkit-appearance: none;
    outline: none;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
  }

  .setting-control input[type="checkbox"]:checked {
    background: #007AFF;
  }

  .setting-control input[type="checkbox"]:checked::after {
    content: "✓";
    color: white;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
  }

  .setting-control input[type="range"] {
    width: 150px;
    height: 4px;
    border-radius: 2px;
    background: #007AFF;
    outline: none;
    -webkit-appearance: none;
  }

  .setting-control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #007AFF;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .setting-control select {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: white;
    font-size: 14px;
    color: #1d1d1f;
    outline: none;
    cursor: pointer;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .popup-content,
    .settings-content,
    .popup-header {
      background: rgba(28, 28, 30, 0.98);
    }

    .assignment-card {
      background: rgba(44, 44, 46, 0.8);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .popup-title {
      color: #fff;
    }

    .assignment-title {
      color: #0A84FF;
    }

    .assignment-title:hover {
      color: #409CFF;
    }

    .due-date,
    .task-count {
      color: #98989D;
    }

    .time-remaining,
    .points {
      background: rgba(255, 255, 255, 0.1);
      color: #98989D;
    }

    .settings-trigger {
      color: #0A84FF;
    }

    .settings-trigger:hover {
      background: rgba(10, 132, 255, 0.1);
    }

    .settings-content {
      background: rgba(28, 28, 30, 0.98);
    }

    .settings-section {
      background: rgba(44, 44, 46, 0.8);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .settings-section-title,
    .setting-label {
      color: #fff;
    }

    .setting-description {
      color: #98989d;
    }

    .back-button {
      color: #0A84FF;
    }

    .back-button:hover {
      color: #409CFF;
    }

    .setting-control select {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: white;
    }
  }
`;

// Update your styleSheet declaration to include the settings styles
const styleSheet = document.createElement('style');
styleSheet.textContent = combinedStyles + popupWithSettingsStyles;
document.head.appendChild(styleSheet);

// Function to store assignments and completed state
function storeAssignments(assignments) {
  chrome.storage.local.set({ 'canvasAssignments': assignments }, () => {
    console.log('Assignments stored:', assignments);
  });
}

// Function to get stored assignments and completed state
function getStoredAssignments(callback) {
  chrome.storage.local.get(['canvasAssignments', 'completedAssignments'], (data) => {
    const assignments = data.canvasAssignments || [];
    const completedAssignments = data.completedAssignments || [];
    callback(assignments, completedAssignments);
  });
}

// Add visibility toggle functions
function createVisibilityToggle(button) {
  const toggleContainer = document.createElement('div');
  toggleContainer.style.cssText = `
    position: fixed;
    z-index: 9999999;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.9);
    padding: 6px 12px;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 12px;
    transition: all 0.3s ease;
  `;

  toggleContainer.innerHTML = `
    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
      <input type="checkbox" id="extension-visibility" style="margin: 0; cursor: pointer;">
      <span>Follow Outside Canvas</span>
    </label>
  `;

  document.body.appendChild(toggleContainer);

  // Function to update toggle position relative to button
  function updateTogglePosition() {
    const buttonRect = button.getBoundingClientRect();
    toggleContainer.style.left = `${buttonRect.left - toggleContainer.offsetWidth - 10}px`;
    toggleContainer.style.top = `${buttonRect.top + (buttonRect.height - toggleContainer.offsetHeight) / 2}px`;
  }

  // Update toggle position initially and when button moves
  updateTogglePosition();
  
  // Watch for button position changes
  const observer = new MutationObserver(() => {
    updateTogglePosition();
  });
  
  observer.observe(button, {
    attributes: true,
    attributeFilter: ['style']
  });

  // Initialize toggle state from storage
  chrome.storage.local.get('followOutsideCanvas', (data) => {
    const shouldFollow = data.followOutsideCanvas !== false;
    document.getElementById('extension-visibility').checked = shouldFollow;
  });

  // Add toggle event listener
  document.getElementById('extension-visibility').addEventListener('change', (e) => {
    const shouldFollow = e.target.checked;
    chrome.storage.local.set({ followOutsideCanvas: shouldFollow });
  });

  // Only show toggle on Canvas pages
  if (!window.location.href.includes('instructure.com')) {
    toggleContainer.style.display = 'none';
  }

  return toggleContainer;
}

// Function to make the button draggable
function makeButtonDraggable(button) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;

  button.addEventListener('mousedown', startDragging);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDragging);

  function startDragging(e) {
    if (e.target === button) {
      isDragging = true;
      button.style.cursor = 'grabbing';
      button.style.transition = 'none'; // Remove transition during drag
      
      const rect = button.getBoundingClientRect();
      initialX = e.clientX - rect.left;
      initialY = e.clientY - rect.top;
    }
  }

  function drag(e) {
    if (!isDragging) return;

    e.preventDefault();
    
    // Calculate new position
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    // Keep button within window bounds with smooth edge detection
    const maxX = window.innerWidth - button.offsetWidth;
    const maxY = window.innerHeight - button.offsetHeight;
    
    currentX = Math.min(Math.max(0, currentX), maxX);
    currentY = Math.min(Math.max(0, currentY), maxY);

    // Use transform for smoother movement
    button.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    button.style.left = '0';
    button.style.top = '0';
  }

  function stopDragging() {
    if (!isDragging) return;
    
    isDragging = false;
    button.style.cursor = 'grab';
    
    // Update the actual position and reset transform
    button.style.transition = 'transform 0.2s ease-out';
    button.style.left = `${currentX}px`;
    button.style.top = `${currentY}px`;
    button.style.transform = 'none';
  }
}

// Update the initialization code
(function() {
  console.log('Initializing Canvas Assignment Extension...');

  // Create and inject the button with updated styles
  const button = document.createElement('button');
  button.className = 'assignments-button';
  button.textContent = '0';
  button.style.cssText = `
    position: fixed;
    right: 20px;
    top: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(0, 122, 255, 0.95);
    color: white;
    border: none;
    font-size: 16px;
    font-weight: 600;
    cursor: grab;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  document.body.appendChild(button);

  // Make the button draggable
  makeButtonDraggable(button);

  // Create visibility toggle with button reference
  const toggle = createVisibilityToggle(button);

  // Check if we should show the button on non-Canvas pages
  if (!window.location.href.includes('instructure.com')) {
    chrome.storage.local.get('followOutsideCanvas', (data) => {
      const shouldFollow = data.followOutsideCanvas !== false;
      button.style.display = shouldFollow ? 'block' : 'none';
    });
  }

  // Create and inject the popup
  popup = document.createElement('div');
  popup.className = 'assignments-popup';
  popup.innerHTML = `
    <div class="popup-header" style="
      user-select: none;
      background: #f8f9fa;
      padding: 12px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <div class="header-title">
        <div class="popup-title">Assignments</div>
        <div class="task-count">0 Tasks</div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <a href="https://www.google.com" target="_blank" style="text-decoration: none;">
          <button id="desktop-button" style="
            padding: 6px 12px;
            background: #007AFF;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <span>Desktop Application</span>
          </button>
        </a>
        <img 
          src="${chrome.runtime.getURL('iconcanvas.jpg')}" 
          style="
            width: 48px;
            height: 48px;
            object-fit: contain;
          "
        >
      </div>
    </div>
    <div class="popup-content">
      <div class="assignments-list"></div>
    </div>
  `;

  document.body.appendChild(popup);

  // Make popup draggable
  makeDraggable(popup);

  // Update the button click handler
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = popup.style.display === 'block';
    popup.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      updatePopupContent();
    }
  });

  // Function to update assignment count
  const updateAssignmentCount = () => {
    if (window.location.href.includes('instructure.com')) {
      // If on Canvas, collect and store new assignments
      const assignments = collectAssignments();
      if (assignments && assignments.length > 0) {
        button.textContent = assignments.length;
        button.classList.add('has-assignments');
        storeAssignments(assignments);
      }
    } else {
      // If not on Canvas, use stored assignments
      getStoredAssignments((assignments) => {
        if (assignments && assignments.length > 0) {
          button.textContent = assignments.length;
          button.classList.add('has-assignments');
        }
      });
    }
  };

  // Update popup content using stored assignments
  function updatePopupContent() {
    getStoredAssignments((assignments, completedAssignments) => {
      const assignmentsList = popup.querySelector('.assignments-list');
      if (!assignmentsList) {
        console.error('Could not find assignments list element');
        return;
      }

      if (!assignments || assignments.length === 0) {
        assignmentsList.innerHTML = '<div class="no-assignments">No assignments found</div>';
        return;
      }

      // Update task count
      const taskCount = popup.querySelector('.task-count');
      if (taskCount) {
        const incompleteCount = assignments.length - completedAssignments.length;
        taskCount.textContent = `${incompleteCount} Tasks Remaining`;
      }

      // Generate HTML for assignments
      assignmentsList.innerHTML = assignments.map(assignment => {
        const isCompleted = completedAssignments.includes(assignment.link);
        return `
          <div class="assignment-card" style="
            background-color: #ffffff;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0, 0, 0, 0.1);
            opacity: ${isCompleted ? '0.6' : '1'};
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <input 
                type="checkbox" 
                ${isCompleted ? 'checked' : ''} 
                data-id="${assignment.link}"
                style="width: 18px; height: 18px; cursor: pointer;"
              >
              <h3 style="
                font-size: 16px; 
                font-weight: 600; 
                margin: 0 0 8px 0;
                text-decoration: ${isCompleted ? 'line-through' : 'none'};
              ">
                <a href="${assignment.link}" style="color: inherit; text-decoration: none;" target="_blank">
                  ${assignment.title}
                </a>
              </h3>
            </div>
            <div style="
              font-size: 14px; 
              color: #666; 
              display: grid; 
              gap: 8px;
              margin-left: 30px;
            ">
              <div>Due: ${assignment.dueDate}</div>
              <div>Points: ${assignment.points}${assignment.pointsText}</div>
              <div>Course: ${assignment.courseName}</div>
            </div>
          </div>
        `;
      }).join('');

      // Add click handlers for checkboxes
      assignmentsList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          const assignmentId = checkbox.getAttribute('data-id');
          toggleAssignmentComplete(assignmentId);
        });
      });
    });
  }

  // Check for assignments immediately
  updateAssignmentCount();

  // Set up observer only on Canvas pages
  if (window.location.href.includes('instructure.com')) {
    const observer = new MutationObserver(updateAssignmentCount);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (!popup.contains(e.target) && !button.contains(e.target)) {
      popup.style.display = 'none';
    }
  });

  // Check periodically
  setInterval(updateAssignmentCount, 2000);

  // Add click handler for the URL button
  const addUrlButton = popup.querySelector('#add-url-button');
  addUrlButton.addEventListener('click', () => {
    const url = prompt('Enter Canvas URL:');
    if (url && url.includes('instructure.com')) {
      chrome.storage.local.get('canvasUrls', (data) => {
        const urls = data.canvasUrls || [];
        if (!urls.includes(url)) {
          urls.push(url);
          chrome.storage.local.set({ canvasUrls: urls }, () => {
            console.log('URL added:', url);
          });
        }
      });
    } else if (url) {
      alert('Please enter a valid Canvas URL (must include instructure.com)');
    }
  });

  console.log('Canvas Assignment Extension initialized!');
})();

// Update calculateDaysRemaining function
function calculateDaysRemaining(dueDate) {
  if (dueDate === 'No due date set') return null;
  
  try {
    const parts = dueDate.split(',').map(part => part.trim());
    const [dayOfWeek, rest] = parts;
    const [month, day, year, time, period] = rest.split(' ').filter(Boolean);
    
    const due = new Date(`${month} ${day} ${year} ${time} ${period}`);
    const now = new Date();
    
    const daysRemaining = Math.floor((due - now) / (1000 * 60 * 60 * 24));
    
    console.log('Date calculation:', {
      original: dueDate,
      parsed: due.toLocaleString(),
      daysRemaining: daysRemaining
    });

    return daysRemaining;
  } catch (error) {
    console.error('Error calculating days remaining:', error);
    return null;
  }
}

function getTimeStatus(daysRemaining) {
  if (daysRemaining === null) {
    return {
      text: 'No due date',
      bgColor: '#f2f2f7',
      textColor: '#666666'
    };
  }

  if (daysRemaining < 0) {
    return {
      text: '⚠️ Past due!',
      bgColor: '#ff3b3015',
      textColor: '#ff3b30'
    };
  }

  if (daysRemaining === 0) {
    return {
      text: '⚠️ Due today!',
      bgColor: '#ff3b3015',
      textColor: '#ff3b30'
    };
  }

  if (daysRemaining === 1) {
    return {
      text: '⚠️ Due tomorrow!',
      bgColor: '#ff3b3015',
      textColor: '#ff3b30'
    };
  }

  if (daysRemaining <= 3) {
    return {
      text: `⚡ Due in ${daysRemaining} days`,
      bgColor: '#ff950015',
      textColor: '#ff9500'
    };
  }

  return {
    text: `${daysRemaining} days remaining`,
    bgColor: '#34c75915',
    textColor: '#34c759'
  };
}

function collectAssignments() {
  const assignments = [];
  const assignmentContainers = document.querySelectorAll('div[data-testid="planner-item-raw"]');
  
  console.log('Found assignment containers:', assignmentContainers.length);

  assignmentContainers.forEach(container => {
    const assignmentLink = container.querySelector('a[href*="/assignments/"]') || container.querySelector('a[href*="/quizzes/"]');
    // Just get the points text and parse it
    const pointsText = container.textContent.match(/(\d+)\s*pts?/);
    const courseNameElement = container.querySelector('span[color="secondary"]');
    
    if (assignmentLink) {
      const title = assignmentLink.querySelector('span[aria-hidden="true"]')?.textContent.trim() || assignmentLink.textContent.trim();
      const points = pointsText ? parseInt(pointsText[1]) : 0;
      const courseName = courseNameElement ? courseNameElement.textContent.trim() : 'Unknown Course';

      // Get date from the screen reader content
      const screenReaderText = container.querySelector('a[dir="ltr"] .css-1sr5vj2-screenReaderContent')?.textContent || '';
      let dueDate = 'No due date set';
      const dateMatch = screenReaderText.match(/due\s+((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}\s+(?:AM|PM))/i);
      
      if (dateMatch) {
        dueDate = dateMatch[1].trim();
      }

      assignments.push({
        title: title,
        dueDate: dueDate,
        points: points,
        pointsText: 'pts',
        courseName: courseName,
        link: assignmentLink.href
      });
    }
  });

  console.log('Collected assignments:', assignments);
  return assignments;
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
    padding: '20px',
    width: '360px',
    maxHeight: '80vh',
    zIndex: 2147483647,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1c1c1e',
    margin: 0,
  },
  content: {
    fontSize: '15px',
    lineHeight: '1.4',
    color: '#3a3a3c',
    flex: 1,
    overflowY: 'auto',
    paddingRight: '12px',
    marginRight: '-12px',
  },
  '@media (prefers-color-scheme: dark)': {
    container: {
      backgroundColor: '#1c1c1e',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
    },
    title: {
      color: '#ffffff',
    },
    content: {
      color: '#d1d1d6',
    }
  }
};

// Add function to handle completed assignments
function toggleAssignmentComplete(assignmentId) {
  chrome.storage.local.get('completedAssignments', (data) => {
    let completedAssignments = data.completedAssignments || [];
    
    if (completedAssignments.includes(assignmentId)) {
      completedAssignments = completedAssignments.filter(id => id !== assignmentId);
    } else {
      completedAssignments.push(assignmentId);
    }
    
    chrome.storage.local.set({ completedAssignments }, () => {
      console.log('Updated completed assignments:', completedAssignments);
      updatePopupContent();
    });
  });
}

// Function to store popup position
function storePopupPosition(x, y) {
  chrome.storage.local.set({ 'popupPosition': { x, y } });
}

// Function to get stored popup position
function getStoredPopupPosition(callback) {
  chrome.storage.local.get('popupPosition', (data) => {
    callback(data.popupPosition || { x: 20, y: 20 });
  });
}

// Update makeDraggable function
function makeDraggable(popup) {
  const header = popup.querySelector('.popup-header');
  let isDragging = false;
  let startX, startY;
  let initialX, initialY;

  header.addEventListener('mousedown', function(e) {
    isDragging = true;
    header.style.cursor = 'grabbing';
    
    // Get initial positions
    startX = e.clientX;
    startY = e.clientY;
    initialX = popup.offsetLeft;
    initialY = popup.offsetTop;
  });

  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;

    e.preventDefault();

    // Calculate new position
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newX = initialX + dx;
    const newY = initialY + dy;

    // Keep within window bounds
    const maxX = window.innerWidth - popup.offsetWidth;
    const maxY = window.innerHeight - popup.offsetHeight;
    
    popup.style.left = `${Math.min(Math.max(0, newX), maxX)}px`;
    popup.style.top = `${Math.min(Math.max(0, newY), maxY)}px`;
  });

  document.addEventListener('mouseup', function() {
    isDragging = false;
    header.style.cursor = 'grab';
  });
}