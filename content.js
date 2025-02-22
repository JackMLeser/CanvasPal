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

// Add priority calculation function
function calculateAssignmentPriority(assignment) {
  const priorityCalculator = new PriorityCalculator();
  
  const priorityAssignment = {
    title: assignment.title,
    dueDate: assignment.dueDate,
    points: assignment.points,
    maxPoints: 100, // You might want to get this from the assignment data
    courseWeight: 1, // You might want to get this from course settings
    courseName: assignment.courseName
  };

  const priority = priorityCalculator.calculatePriority(priorityAssignment);
  return priority.score; // This maintains compatibility with existing code
}

// Update the highlightDates function to send data to extension
function highlightDates() {
  const processedAssignments = new Map();
  const assignmentContainers = document.querySelectorAll('div[data-testid="planner-item-raw"]');
  
  assignmentContainers.forEach(container => {
    const assignmentLink = container.querySelector('a[href*="/assignments/"]');
    const pointsSpan = container.querySelector('span.css-mum2ig-text[wrap="normal"][letter-spacing="normal"]');
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
          courseName: container.querySelector('[class*="PlannerItem__Course"]')?.textContent || ''
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

// Create and inject the button and popup
(function() {
  // Create a global variable to store assignments
  let assignmentData = [];

  // Function to collect assignments
  function collectAssignments() {
    const assignments = [];
    const assignmentContainers = document.querySelectorAll('div[data-testid="planner-item-raw"]');
    
    console.log('Found assignment containers:', assignmentContainers.length);

    assignmentContainers.forEach(container => {
      const assignmentLink = container.querySelector('a[href*="/assignments/"]');
      const pointsSpan = container.querySelector('span.css-mum2ig-text[wrap="normal"][letter-spacing="normal"]');
      const ptsSpan = container.querySelector('span.css-1uakmj8-text');
      
      // Get date from the screenreader content
      const screenReaderSpan = container.querySelector('.css-1sr5vj2-screenReaderContent');

      if (assignmentLink && pointsSpan) {
        const points = parseInt(pointsSpan.textContent);
        const pointsText = ptsSpan ? ptsSpan.textContent.trim() : 'pts';
        const fullTitle = assignmentLink.textContent.trim();
        
        // Get course name
        const courseSpan = container.querySelector('span.css-xqopp9-text');
        let courseName = 'Unknown Course';
        if (courseSpan) {
          const courseText = courseSpan.textContent;
          const courseMatch = courseText.split(' - ');
          if (courseMatch.length >= 3) {
            courseName = courseMatch[2]
              .replace(/(Quiz|Assignment|Discussion)$/i, '')
              .trim();
          }
        }

        // Extract date from screen reader content
        let dueDate = '';
        if (screenReaderSpan) {
          const text = screenReaderSpan.textContent;
          // Look for date pattern in the text
          const dateMatch = text.match(/due\s+([^\.]+)/i);
          if (dateMatch) {
            dueDate = dateMatch[1].trim();
            console.log('Extracted date:', {
              fullText: text,
              match: dateMatch[0],
              dueDate: dueDate
            });
          }
        }

        // Get the assignment URL
        const link = assignmentLink.href;

        if (!isNaN(points)) {
          const assignment = {
            title: cleanAssignmentTitle(fullTitle),
            dueDate: dueDate || 'No due date set',
            daysRemaining: dueDate ? calculateDaysRemaining(dueDate) : null,
            points: points,
            pointsText: pointsText,
            courseName: courseName,
            link: link // Add the link to the assignment object
          };

          console.log('Processed assignment:', assignment);
          assignments.push(assignment);
        }
      }
    });

    return assignments;
  }

  // Function to update popup content
  function updatePopupContent() {
    const content = popup.querySelector('.popup-content');
    if (!content) return;

    const assignments = collectAssignments();
    console.log('Assignments for popup:', assignments);

    if (assignments.length === 0) {
      content.innerHTML = '<div class="no-assignments">No assignments found</div>';
      return;
    }

    // Sort assignments by due date
    assignments.sort((a, b) => {
      const dateA = new Date(a.dueDate.replace(/^Due\s+/i, ''));
      const dateB = new Date(b.dueDate.replace(/^Due\s+/i, ''));
      return dateA - dateB;
    });

    // Update button count
    button.textContent = assignments.length;

    // Generate HTML for assignments with clickable links
    content.innerHTML = assignments.map(assignment => {
      // Get the href from the original link
      const assignmentLink = assignment.link || '#';

      return `
        <div class="assignment-card">
          <a href="${assignmentLink}" class="assignment-title" target="_blank">${assignment.title}</a>
          <div class="assignment-details">
            <div class="due-info">
              <div class="due-date">
                ${assignment.dueDate}
              </div>
              <div class="time-remaining ${assignment.daysRemaining <= 2 ? 'urgent' : ''}">
                ${
                  assignment.daysRemaining === null ? '' :
                  assignment.daysRemaining < 0 ? '⚠️ Past due!' :
                  assignment.daysRemaining === 0 ? '⚠️ Due today!' :
                  assignment.daysRemaining === 1 ? '⚠️ Due tomorrow!' :
                  assignment.daysRemaining === 2 ? '⚡ Due in 2 days!' :
                  `${assignment.daysRemaining} days remaining`
                }
              </div>
            </div>
            <div class="course-info">
              <div class="course">${assignment.courseName}</div>
              <div class="points">Points: ${assignment.points} ${assignment.pointsText}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add styles for the links
    const style = document.createElement('style');
    style.textContent = `
      .assignment-title {
        color: #2d3b45;
        text-decoration: none;
        font-weight: bold;
        display: block;
        margin-bottom: 8px;
        transition: color 0.2s;
      }
      .assignment-title:hover {
        color: #0055a2;
        text-decoration: underline;
      }
      .dark-theme .assignment-title {
        color: #fff;
      }
      .dark-theme .assignment-title:hover {
        color: #66b0ff;
      }
    `;
    document.head.appendChild(style);
  }

  // Styles for both button and popup
  const styles = document.createElement('style');
  styles.textContent = `
    #canvas-assignment-button {
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      width: 40px !important;
      height: 40px !important;
      background-color: #0374B5 !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: white !important;
      font-weight: bold !important;
      font-family: Arial, sans-serif !important;
      cursor: pointer !important;
      z-index: 999999 !important;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
    }

    #canvas-assignment-popup {
      position: fixed;
      right: 20px;
      top: 70px;
      width: 300px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.2);
      z-index: 999999;
      overflow: hidden;
      display: none;
    }

    #canvas-assignment-popup.visible {
      display: block;
    }

    .popup-header {
      padding: 15px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .popup-header h2 {
      margin: 0;
      font-size: 16px;
      color: #333;
    }

    .popup-content {
      padding: 15px;
      overflow-y: auto;
      max-height: 400px;
    }

    .assignment-card {
      padding: 15px;
      margin-bottom: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #0374B5;
      transition: transform 0.2s ease;
    }

    .assignment-card:hover {
      transform: translateX(5px);
    }

    .assignment-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
    }

    .assignment-details {
      font-size: 13px;
    }

    .due-info {
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }

    .due-date {
      color: #0374B5;
      margin-bottom: 4px;
    }

    .due-label {
      font-weight: 500;
    }

    .due-datetime {
      color: #333;
    }

    .time-remaining {
      font-size: 12px;
      color: #666;
    }

    .time-remaining.urgent {
      color: #dc3545;
      font-weight: 500;
    }

    .course-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #666;
    }

    .course {
      font-weight: 500;
    }

    .points {
      color: #0374B5;
    }

    .priority-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      color: white;
    }

    .high-priority {
      border-left-color: #dc3545;
    }

    .medium-priority {
      border-left-color: #ffc107;
    }

    .low-priority {
      border-left-color: #28a745;
    }

    .high-badge {
      background: #dc3545;
    }

    .medium-badge {
      background: #ffc107;
      color: #000;
    }

    .low-badge {
      background: #28a745;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      color: #666;
      padding: 5px;
    }

    .close-button:hover {
      color: #333;
    }

    .header-controls {
      display: flex;
      gap: 8px;
    }

    .icon-button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      color: #666;
      padding: 5px;
      border-radius: 4px;
    }

    .icon-button:hover {
      background: rgba(0,0,0,0.1);
      color: #333;
    }

    .assignment-card.high-priority {
      border-left-color: #dc3545;
      background: rgba(220, 53, 69, 0.05);
    }

    .assignment-card.medium-priority {
      border-left-color: #ffc107;
      background: rgba(255, 193, 7, 0.05);
    }

    .assignment-card.low-priority {
      border-left-color: #28a745;
      background: rgba(40, 167, 69, 0.05);
    }

    .popup-content, .settings-panel {
      transition: transform 0.3s ease;
    }

    .settings-panel {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      display: none;
    }

    .settings-panel.visible {
      display: block;
    }

    .popup-content.hidden {
      transform: translateX(-100%);
    }

    .settings-header {
      padding: 15px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .back-button {
      padding: 8px;
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
    }

    .back-button:hover {
      color: #333;
    }

    .settings-content {
      padding: 15px;
      overflow-y: auto;
      max-height: 400px;
    }

    .settings-section {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .settings-section h4 {
      color: #0374B5;
      margin: 0 0 15px 0;
      font-size: 14px;
    }

    .setting-item {
      margin-bottom: 15px;
    }

    input[type="range"] {
      width: 100%;
      margin-bottom: 5px;
    }

    .value-display {
      text-align: right;
      color: #666;
      font-size: 12px;
    }

    select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .priority-info {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(0,0,0,0.1);
    }

    .priority-details {
      display: flex;
      gap: 10px;
      margin-top: 5px;
      font-size: 11px;
      color: #666;
    }

    .priority-factor {
      background: rgba(0,0,0,0.05);
      padding: 2px 6px;
      border-radius: 3px;
    }

    .high-priority {
      border-left-color: #dc3545 !important;
      background: linear-gradient(to right, rgba(220,53,69,0.1), transparent) !important;
    }

    .medium-priority {
      border-left-color: #ffc107 !important;
      background: linear-gradient(to right, rgba(255,193,7,0.1), transparent) !important;
    }

    .low-priority {
      border-left-color: #28a745 !important;
      background: linear-gradient(to right, rgba(40,167,69,0.1), transparent) !important;
    }

    .priority-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: bold;
    }

    .high-priority .priority-badge {
      background: #dc3545;
      color: white;
    }

    .medium-priority .priority-badge {
      background: #ffc107;
      color: black;
    }

    .low-priority .priority-badge {
      background: #28a745;
      color: white;
    }
  `;
  document.head.appendChild(styles);

  // Create button
  const button = document.createElement('div');
  button.id = 'canvas-assignment-button';
  button.textContent = '0';

  // Create the popup structure with both assignments and settings panels
  const popup = document.createElement('div');
  popup.id = 'canvas-assignment-popup';
  popup.innerHTML = `
    <div class="popup-header">
      <h2>Assignment Priorities</h2>
      <div class="header-controls">
        <button class="icon-button settings-button" title="Settings">⚙️</button>
        <button class="close-button" title="Close">×</button>
      </div>
    </div>

    <!-- Main assignments panel -->
    <div class="popup-content" id="assignments-panel">
      <div id="assignments-list"></div>
    </div>

    <!-- Settings panel -->
    <div class="settings-panel" id="settings-panel">
      <div class="settings-header">
        <button class="back-button">← Back</button>
        <h3>Settings</h3>
      </div>
      <div class="settings-content">
        <div class="settings-section">
          <h4>Text Size</h4>
          <div class="setting-item">
            <input type="range" id="textSize" min="12" max="24" value="16">
            <div class="value-display"><span id="textSizeValue">16</span>px</div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Window Transparency</h4>
          <div class="setting-item">
            <input type="range" id="transparency" min="50" max="100" value="100">
            <div class="value-display"><span id="transparencyValue">100</span>%</div>
          </div>
        </div>

        <div class="settings-section">
          <h4>High Contrast</h4>
          <div class="setting-item">
            <input type="range" id="contrast" min="100" max="200" value="100">
            <div class="value-display"><span id="contrastValue">100</span>%</div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Theme</h4>
          <div class="setting-item">
            <select id="theme">
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add elements to page
  document.body.appendChild(button);
  document.body.appendChild(popup);

  // Add event listeners
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.classList.toggle('visible');
    if (popup.classList.contains('visible')) {
      updatePopupContent(); // Update content when showing popup
    }
  });

  popup.querySelector('.close-button').addEventListener('click', (e) => {
    e.stopPropagation();
    popup.classList.remove('visible');
  });

  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (!popup.contains(e.target) && !button.contains(e.target)) {
      popup.classList.remove('visible');
    }
  });

  // Prevent popup from closing when clicking inside
  popup.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Update the settings button click handler
  popup.querySelector('.settings-button').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('assignments-panel').classList.add('hidden');
    document.getElementById('settings-panel').classList.add('visible');
  });

  // Add back button handler
  popup.querySelector('.back-button').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('assignments-panel').classList.remove('hidden');
    document.getElementById('settings-panel').classList.remove('visible');
  });

  // Add settings change handlers
  document.getElementById('textSize').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('textSizeValue').textContent = value;
    popup.style.fontSize = value + 'px';
    saveSettings({ textSize: value });
  });

  document.getElementById('transparency').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('transparencyValue').textContent = value;
    popup.style.opacity = value / 100;
    saveSettings({ transparency: value });
  });

  document.getElementById('theme').addEventListener('change', (e) => {
    const isDark = e.target.value === 'dark';
    popup.classList.toggle('dark-theme', isDark);
    saveSettings({ theme: e.target.value });
  });

  document.getElementById('contrast').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('contrastValue').textContent = value;
    updateContrast(value);
    saveSettings({ contrast: value });
  });

  // Function to save settings
  function saveSettings(changes) {
    chrome.storage.sync.get(null, (currentSettings) => {
      const newSettings = { ...currentSettings, ...changes };
      chrome.storage.sync.set(newSettings);
    });
  }

  // Load saved settings
  chrome.storage.sync.get({
    textSize: 16,
    transparency: 100,
    theme: 'light',
    contrast: 100
  }, (settings) => {
    document.getElementById('textSize').value = settings.textSize;
    document.getElementById('textSizeValue').textContent = settings.textSize;
    popup.style.fontSize = settings.textSize + 'px';

    document.getElementById('transparency').value = settings.transparency;
    document.getElementById('transparencyValue').textContent = settings.transparency;
    popup.style.opacity = settings.transparency / 100;

    document.getElementById('theme').value = settings.theme;
    popup.classList.toggle('dark-theme', settings.theme === 'dark');

    document.getElementById('contrast').value = settings.contrast;
    document.getElementById('contrastValue').textContent = settings.contrast;
    updateContrast(settings.contrast);
  });

  // Call updatePopupContent when assignments change
  highlightDates();
  updatePopupContent();

  console.log('Assignment button and popup injected');
})();

// Update calculateDaysRemaining function
function calculateDaysRemaining(dueDate) {
  try {
    // Parse the date string (e.g., "Monday, February 24, 2025 11:59 PM")
    const parts = dueDate.split(/[,\s]+/).filter(part => part); // Remove empty strings
    
    // Log the parts for debugging
    console.log('Date parts:', parts);

    // Extract components - parts should be [Monday, February, 24, 2025, 11:59, PM]
    const month = parts[1];
    const day = parseInt(parts[2]);
    const year = parseInt(parts[3]);
    const time = `${parts[4]} ${parts[5]}`;

    // Create date string in a format that Date constructor can parse
    const dateStr = `${month} ${day}, ${year} ${time}`;
    const due = new Date(dateStr);
    const now = new Date();

    // Calculate days remaining
    const daysRemaining = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    console.log('Date calculation:', {
      original: dueDate,
      parts: parts,
      dateString: dateStr,
      parsed: {
        month,
        day,
        year,
        time,
        fullDate: due.toLocaleString()
      },
      daysRemaining
    });

    return daysRemaining;
  } catch (error) {
    console.error('Error calculating days remaining:', error, {
      dueDate: dueDate,
      stack: error.stack
    });
    return null;
  }
}