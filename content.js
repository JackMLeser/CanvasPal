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

// Simple date highlighting function
function highlightDates() {
  // Enhanced style to handle assignments and dates
  const style = document.createElement('style');
  style.textContent = `
    .date-highlight {
      background-color: yellow !important;
      outline: 2px solid orange !important;
      position: relative !important;
    }
    .assignment-highlight {
      background-color: #e6f3ff !important;
      outline: 2px solid #0066cc !important;
      position: relative !important;
    }
    .date-highlight::before, .assignment-highlight::before {
      content: attr(data-date-type);
      position: absolute;
      top: -20px;
      left: 0;
      font-size: 10px;
      padding: 2px 4px;
      border-radius: 2px;
      z-index: 9999;
    }
    .date-highlight::before {
      background: orange;
      color: black;
    }
    .assignment-highlight::before {
      background: #0066cc;
      color: white;
    }
    .due-date {
      background-color: #ffcccb !important;
      outline: 2px solid red !important;
    }
    .due-date::before {
      background: red;
      color: white;
    }
  `;
  document.head.appendChild(style);

  // Enhanced patterns to capture assignments and dates
  const patterns = [
    {
      pattern: /\bDue:?\s.*(?:am|pm)\b/i,
      type: 'DUE DATE'
    },
    {
      pattern: /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}\b/i,
      type: 'DATE'
    },
    {
      pattern: /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
      type: 'DAY'
    },
    {
      pattern: /\b\d{1,2}:\d{2}(?:am|pm)?\b/i,
      type: 'TIME'
    }
  ];

  // Canvas selectors for both dates and assignments
  const selectors = [
    // Date selectors
    '[data-testid="not-today"]',
    '.Day-styles__secondary',
    '.PlannerItem-styles__due',
    
    // Assignment selectors
    'a[href*="/assignments/"]',
    'a[href*="/quizzes/"]',
    '.css-6t42ud-view-link',
    '.PlannerItem__Title'
  ];

  // Process each selector
  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      console.log(`Found ${elements.length} elements for ${selector}`);
      
      elements.forEach(element => {
        // Check if it's an assignment link
        if (element.href && element.href.includes('/assignments/')) {
          // Get the visible title
          const visibleTitle = element.querySelector('[aria-hidden="true"]')?.textContent || 
                             element.textContent;
          
          // Get the full description (including due date) from screen reader text
          const srContent = element.querySelector('.css-1sr5vj2-screenReaderContent')?.textContent || '';
          
          element.classList.add('assignment-highlight');
          element.setAttribute('data-date-type', 'ASSIGNMENT');
          element.setAttribute('data-assignment-title', visibleTitle.trim());
          
          // Extract due date if present in screen reader content
          const dueMatch = srContent.match(/due\s+(.*?)\./i);
          if (dueMatch) {
            element.setAttribute('data-assignment-due', dueMatch[1].trim());
          }
          
          console.log('Found assignment:', {
            title: visibleTitle.trim(),
            fullText: srContent,
            dueDate: dueMatch ? dueMatch[1].trim() : 'No due date found'
          });
        }
        
        // Check for dates
        const text = element.textContent;
        patterns.forEach(({pattern, type}) => {
          if (pattern.test(text)) {
            element.classList.add('date-highlight');
            if (type === 'DUE DATE') {
              element.classList.add('due-date');
            }
            element.setAttribute('data-date-type', type);
            console.log(`Found ${type}:`, text);
          }
        });
      });
    } catch (err) {
      console.error('Error processing selector:', selector, err);
    }
  });

  // Update the debug panel with both dates and assignments
  updateDebugPanel();
}

function updateDebugPanel() {
  let panel = document.getElementById('debug-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      max-height: 300px;
      overflow-y: auto;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(panel);
  }

  const assignments = Array.from(document.querySelectorAll('.assignment-highlight'))
    .map(el => ({
      title: el.getAttribute('data-assignment-title'),
      dueDate: el.getAttribute('data-assignment-due')
    }));

  const dates = Array.from(document.querySelectorAll('.date-highlight'))
    .map(el => ({
      text: el.textContent.trim(),
      type: el.getAttribute('data-date-type')
    }));

  panel.innerHTML = `
    <div style="margin-bottom: 10px; color: #ffd700; font-weight: bold;">
      🔍 Debug Panel
    </div>
    <div style="margin-bottom: 10px;">
      <div style="color: #0066cc; margin-bottom: 5px;">Assignments Found: ${assignments.length}</div>
      ${assignments.map(a => `
        <div style="margin-left: 10px; font-size: 11px;">
          📚 ${a.title}${a.dueDate ? ` (Due: ${a.dueDate})` : ''}
        </div>
      `).join('')}
    </div>
    <div>
      <div style="color: orange; margin-bottom: 5px;">Dates Found: ${dates.length}</div>
      ${dates.map(d => `
        <div style="margin-left: 10px; font-size: 11px;">
          📅 ${d.type}: ${d.text}
        </div>
      `).join('')}
    </div>
  `;
}

// Wait for page to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', highlightDates);
} else {
  highlightDates();
}

// Also try after a short delay for dynamic content
setTimeout(highlightDates, 2000);

class AssignmentPrioritizer {
  constructor() {
    this.assignments = [];
  }

  async initialize() {
    logInfo('🚀 Initializing AssignmentPrioritizer');
    
    try {
      // Add debug styles and highlight dates
      injectDateDebugStyles();
      highlightDates();
      
      // Create a debug panel for dates
      this.createDateDebugPanel();
      
      // Wait for API data to load
      await this.waitForAPIData();
      
      // Get assignments from multiple sources
      const assignments = await Promise.all([
        this.fetchPlannerItems(),
        this.fetchMissingSubmissions(),
        this.parseDashboardCards()
      ]);

      this.assignments = assignments.flat().filter(Boolean);
      
      if (this.assignments.length > 0) {
        this.calculatePriorities();
        this.displayPriorities();
        globalAssignments = this.assignments; // Update global assignments
      }

      logInfo('✅ Initialization complete');
    } catch (error) {
      logError('Error during initialization:', error);
    }
  }

  async waitForAPIData() {
    logInfo('⏳ Waiting for API data to load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async fetchPlannerItems() {
    try {
      const response = await fetch('/api/v1/planner/items?per_page=50', {
        headers: {
          'Accept': 'application/json+canvas-string-ids, application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const items = await response.json();
      logDebug('Planner items retrieved:', items);

      return items.map(item => {
        let type = 'unknown';
        let weight = 0.2;
        let debugClass = '';

        switch(item.plannable_type?.toLowerCase()) {
          case 'quiz':
          case 'quizzes/quiz':
            type = 'quiz';
            weight = 0.3;
            debugClass = 'debug-highlight-quiz';
            break;
          case 'assignment':
            type = 'assignment';
            weight = 0.4;
            debugClass = 'debug-highlight-assignment';
            break;
          case 'discussion_topic':
            type = 'discussion';
            weight = 0.2;
            debugClass = 'debug-highlight-discussion';
            break;
          case 'announcement':
            type = 'announcement';
            weight = 0.1;
            debugClass = 'debug-highlight-announcement';
            break;
        }

        // Get and highlight the element
        const element = document.querySelector(
          `[data-item-id="${item.plannable_id}"], ` +
          `[data-assignment-id="${item.plannable_id}"], ` +
          `[data-quiz-id="${item.plannable_id}"]`
        );

        if (element) {
          element.classList.add('debug-highlight', debugClass);
          element.setAttribute('data-debug-type', type.toUpperCase());
        }

        // Extract points from the HTML element if available
        let points = item.plannable?.points_possible;
        if (element) {
          const pointsText = element.textContent.match(/(\d+)\s*(?:points?|pts)/i);
          if (pointsText) {
            points = parseInt(pointsText[1]);
          }
        }

        return {
          title: item.plannable?.title || item.plannable?.name,
          dueDate: item.plannable_date ? new Date(item.plannable_date) : null,
          courseName: item.context_name,
          points: points,
          type: type,
          weight: weight,
          url: item.html_url,
          element: element,
          priority: 0,
          details: {
            submissionType: item.plannable?.submission_types,
            isCompleted: item.planner_override?.marked_complete || false,
            isLocked: item.plannable?.locked_for_user || false,
            description: item.plannable?.description
          }
        };
      }).filter(item => item.title && item.dueDate);
    } catch (error) {
      logError('Error fetching planner items:', error);
      return [];
    }
  }

  async fetchMissingSubmissions() {
    try {
      const response = await fetch('/api/v1/users/self/missing_submissions?include[]=planner_overrides', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const submissions = await response.json();
      logDebug('Missing submissions retrieved:', submissions);

      return submissions.map(submission => ({
        title: submission.name || submission.assignment?.name,
        dueDate: submission.due_at ? new Date(submission.due_at) : null,
        courseName: submission.course?.name,
        points: submission.points_possible,
        type: 'missing_submission',
        url: submission.html_url,
        element: document.querySelector(`[data-assignment-id="${submission.id}"]`),
        priority: 0
      })).filter(item => item.title && item.dueDate);
    } catch (error) {
      logError('Error fetching missing submissions:', error);
      return [];
    }
  }

  async parseDashboardCards() {
    try {
      const response = await fetch('/api/v1/dashboard/dashboard_cards', {
        headers: {
          'Accept': 'application/json+canvas-string-ids, application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const cards = await response.json();
      logDebug('Dashboard cards retrieved:', cards);

      // Process assignments from dashboard cards
      const assignments = [];
      for (const card of cards) {
        if (card.assignments) {
          assignments.push(...card.assignments.map(assignment => {
            // Determine assignment type from HTML elements
            const element = document.querySelector(`[data-assignment-id="${assignment.id}"]`);
            let type = 'assignment';
            let weight = 0.4;

            if (element) {
              const iconElement = element.querySelector('.icon-quiz, .icon-assignment, .icon-discussion');
              if (iconElement) {
                if (iconElement.classList.contains('icon-quiz')) {
                  type = 'quiz';
                  weight = 0.3;
                } else if (iconElement.classList.contains('icon-discussion')) {
                  type = 'discussion';
                  weight = 0.2;
                }
              }
            }

            return {
              title: assignment.name,
              dueDate: assignment.due_at ? new Date(assignment.due_at) : null,
              courseName: card.shortName,
              points: assignment.points_possible,
              type: type,
              weight: weight,
              url: assignment.html_url,
              element: element,
              priority: 0,
              details: {
                submissionType: assignment.submission_types,
                isCompleted: assignment.has_submitted_submissions,
                isLocked: assignment.locked_for_user,
                description: assignment.description
              }
            };
          }));
        }
      }

      return assignments.filter(item => item.title && item.dueDate);
    } catch (error) {
      logError('Error parsing dashboard cards:', error);
      return [];
    }
  }

  async getAssignmentWeight(element) {
    // Try to get weight from assignment groups
    const groupName = element.querySelector('.assignment-group-name')?.textContent;
    if (groupName) {
      // You might want to store these weights in extension storage
      const commonWeights = {
        'Homework': 0.3,
        'Quizzes': 0.2,
        'Exams': 0.4,
        'Participation': 0.1
      };
      
      for (const [category, weight] of Object.entries(commonWeights)) {
        if (groupName.toLowerCase().includes(category.toLowerCase())) {
          return weight;
        }
      }
    }
    
    return 0.2; // Default weight if not found
  }

  async getCourseGrade(element) {
    // Try to get grade from the course card or grades page
    const gradeElement = element.closest('.course-card')?.querySelector('.grade') ||
                        document.querySelector(`a[href*="${element.dataset.courseId}"] .grade`);
    
    if (gradeElement) {
      const gradeText = gradeElement.textContent.trim();
      const gradeMatch = gradeText.match(/(\d+\.?\d*)%?/);
      if (gradeMatch) {
        return parseFloat(gradeMatch[1]) / 100;
      }
    }
    
    return 0.85; // Default grade if not found
  }

  isValidAssignment(assignment) {
    return assignment.title && 
           assignment.dueDate && 
           !isNaN(assignment.weight);
  }

  calculatePriorities() {
    for (const assignment of this.assignments) {
      const daysUntilDue = this.calculateDaysUntilDue(assignment.dueDate);
      const gradeImpact = assignment.weight / 100;
      const courseGradeImpact = 1 - assignment.courseGrade;

      assignment.priority = (
        (gradeImpact * PRIORITY_WEIGHTS.GRADE_IMPACT) +
        (courseGradeImpact * PRIORITY_WEIGHTS.COURSE_GRADE) +
        (1 / Math.max(daysUntilDue, 1) * PRIORITY_WEIGHTS.DUE_DATE)
      );
    }

    // Sort assignments by priority
    this.assignments.sort((a, b) => b.priority - a.priority);
  }

  calculateDaysUntilDue(dueDate) {
    const now = new Date();
    const diffTime = dueDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  displayPriorities() {
    this.assignments.forEach((assignment, index) => {
      const priorityLabel = this.createPriorityLabel(assignment);
      assignment.element.insertBefore(priorityLabel, assignment.element.firstChild);
    });
  }

  createPriorityLabel(assignment) {
    const label = document.createElement('div');
    label.className = 'priority-label';
    
    const priority = assignment.priority;
    if (priority > 0.7) {
      label.classList.add('high-priority');
      label.textContent = 'High Priority';
    } else if (priority > 0.4) {
      label.classList.add('medium-priority');
      label.textContent = 'Medium Priority';
    } else {
      label.classList.add('low-priority');
      label.textContent = 'Low Priority';
    }

    return label;
  }

  createDateDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'date-debug-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      max-height: 300px;
      overflow-y: auto;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    `;

    // Add content to the panel
    panel.innerHTML = `
      <div style="margin-bottom: 10px; color: #ffd700; font-weight: bold;">
        📅 Date Detection Debug
      </div>
      <div id="date-debug-content"></div>
    `;

    document.body.appendChild(panel);
    this.updateDateDebugPanel();
  }

  // Add method to update the debug panel
  updateDateDebugPanel() {
    const content = document.getElementById('date-debug-content');
    if (!content) return;

    const dateElements = document.querySelectorAll('.debug-date');
    const dates = Array.from(dateElements).map(el => ({
      text: el.textContent.trim(),
      type: el.getAttribute('data-date-type') || 'unknown'
    }));

    content.innerHTML = `
      <div>Found ${dates.length} dates</div>
      ${dates.map(date => `
        <div style="margin-top: 5px; font-size: 11px;">
          <span style="color: #ffd700;">${date.type}:</span> ${date.text}
        </div>
      `).join('')}
    `;
  }
}