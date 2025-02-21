document.addEventListener('DOMContentLoaded', async () => {
  const assignmentsDiv = document.getElementById('assignments');

  // Query the active tab to get assignments
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    try {
      // Send message to content script to get assignments
      chrome.tabs.sendMessage(tabs[0].id, {action: "getAssignments"}, (response) => {
        if (chrome.runtime.lastError) {
          assignmentsDiv.innerHTML = '<div class="no-assignments">Please navigate to a Canvas page</div>';
          return;
        }

        if (!response || !response.assignments || response.assignments.length === 0) {
          assignmentsDiv.innerHTML = '<div class="no-assignments">No assignments found</div>';
          return;
        }

        // Display assignments
        assignmentsDiv.innerHTML = response.assignments
          .map(assignment => `
            <div class="assignment ${getPriorityClass(assignment.priority)}">
              <div class="title">${assignment.title}</div>
              <div class="course">${assignment.courseName || 'Unknown Course'}</div>
              <div class="due-date">Due: ${formatDate(assignment.dueDate)}</div>
            </div>
          `)
          .join('');
      });
    } catch (error) {
      assignmentsDiv.innerHTML = '<div class="no-assignments">Error loading assignments</div>';
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