document.addEventListener('DOMContentLoaded', async () => {
  // First load stored assignments from background script
  chrome.runtime.sendMessage({ type: 'GET_ASSIGNMENTS' }, (response) => {
    if (response && response.assignments) {
      displayAssignments(response.assignments);
    }
  });

  // Then try to get fresh assignments if we're on Canvas
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    if (tabs[0].url.includes('instructure.com')) {
      try {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getAssignments"}, (response) => {
          if (response && response.assignments) {
            displayAssignments(response.assignments);
          }
        });
      } catch (error) {
        console.error('Error getting assignments:', error);
      }
    }
  });
});

function getPriorityClass(priority) {
  if (priority > 0.7) return 'high-priority';
  if (priority > 0.4) return 'medium-priority';
  return 'low-priority';
}

function formatDate(dateString) {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Listen for assignment updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ASSIGNMENTS_UPDATE') {
    displayAssignments(message.data);
  }
});

function displayAssignments(assignments) {
  const container = document.getElementById('assignments-container');
  if (!container) return;

  Object.assign(container.style, {
    padding: '20px',
    paddingBottom: '60px',
  });

  // Log assignments for debugging
  console.log('Displaying assignments:', assignments);

  assignments.sort((a, b) => b.priority - a.priority);

  container.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h2 style="font-size: 24px; font-weight: 600; margin: 0;">Assignments</h2>
    </div>
    ${assignments.map(a => {
      // Log each assignment's due date
      console.log('Processing assignment:', {
        title: a.title,
        dueDate: a.dueDate
      });
      
      const priorityLevel = getPriorityLevel(a.priority);
      const daysRemaining = calculateDaysRemaining(a.dueDate);
      const timeStatus = getTimeStatus(daysRemaining);
      
      // Log calculation results
      console.log('Calculation results:', {
        title: a.title,
        daysRemaining: daysRemaining,
        timeStatus: timeStatus
      });

      return `
        <div class="assignment-card" style="
          background-color: #ffffff;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-left: 4px solid ${
            priorityLevel === 'high' ? '#ff3b30' :
            priorityLevel === 'medium' ? '#ff9500' : '#34c759'
          };
        ">
          <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">${a.title}</h3>
          <div style="font-size: 14px; color: #666; display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>📅 Due: ${a.dueDate}</div>
              <div style="
                background: ${timeStatus.bgColor};
                color: ${timeStatus.textColor};
                padding: 4px 8px;
                border-radius: 6px;
                font-weight: 500;
              ">${timeStatus.text}</div>
            </div>
            <div>📊 Points: ${a.points}${a.pointsText}</div>
            <div>📚 ${a.courseName}</div>
            <div style="
              background: ${
                priorityLevel === 'high' ? '#ff3b3015' :
                priorityLevel === 'medium' ? '#ff950015' : '#34c75915'
              };
              color: ${
                priorityLevel === 'high' ? '#ff3b30' :
                priorityLevel === 'medium' ? '#ff9500' : '#34c759'
              };
              padding: 4px 8px;
              border-radius: 6px;
              display: inline-block;
            ">
              Priority: ${Math.round(a.priority * 100)}%
            </div>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function getPriorityLevel(priority) {
  if (priority > 0.7) return 'high';
  if (priority > 0.4) return 'medium';
  return 'low';
}

function calculateDaysRemaining(dueDate) {
  if (!dueDate || dueDate === 'No due date set') return null;
  
  try {
    // Extract date from Canvas format
    const dateMatch = dueDate.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);
    if (!dateMatch) {
      console.log('Could not parse date:', dueDate);
      return null;
    }

    const month = dateMatch[1];
    const day = parseInt(dateMatch[2]);
    
    // Create dates for comparison
    const now = new Date();
    const due = new Date(now.getFullYear(), getMonthNumber(month), day);
    due.setHours(23, 59, 59);
    
    // If the due date is in the past, assume it's for next year
    if (due < now) {
      due.setFullYear(due.getFullYear() + 1);
    }
    
    // Calculate days remaining
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.ceil((due - now) / msPerDay);
    
    console.log('Date calculation:', {
      original: dueDate,
      month: month,
      day: day,
      parsed: due.toLocaleString(),
      daysRemaining: daysRemaining,
      now: now.toLocaleString()
    });

    return daysRemaining;
  } catch (error) {
    console.error('Error calculating days remaining:', error, { dueDate });
    return null;
  }
}

// Helper function to convert month name to number
function getMonthNumber(monthName) {
  const months = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
  };
  return months[monthName.toLowerCase().substring(0, 3)];
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

// First, set the body styles
document.body.style.width = '400px';
document.body.style.height = '600px';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'auto';

const styles = {
  container: {
    padding: '20px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '16px',
    padding: '0 4px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1c1c1e',
    margin: '0 0 8px 0',
  },
  assignmentsContainer: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '8px', // Space for scrollbar
    marginRight: '-8px', // Compensate for padding
  },
  assignmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: '8px',
  },
  cardDetails: {
    fontSize: '14px',
    color: '#666',
    display: 'grid',
    gap: '8px',
  },
  priorityHigh: {
    borderLeft: '4px solid #ff3b30',
  },
  priorityMedium: {
    borderLeft: '4px solid #ff9500',
  },
  priorityLow: {
    borderLeft: '4px solid #34c759',
  }
}; 