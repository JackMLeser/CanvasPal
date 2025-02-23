import os
import requests
import json
from itertools import cycle
from datetime import datetime
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QVBoxLayout, QWidget, QTableWidget,
    QTableWidgetItem, QPushButton, QLabel, QTextEdit,
    QSplitter, QLineEdit
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal, QTimer

# Configuration
CANVAS_URL = "https://canvas.instructure.com"
ENDPOINT = "/api/v1/users/self/courses"
TOKEN_FOLDER = "canvasPAL_tokens"

# Load tokens from folder
def load_tokens(token_folder):
    """Loads all API tokens from the specified folder."""
    tokens = []
    if os.path.exists(token_folder):
        for file in sorted(os.listdir(token_folder)):
            if file.endswith(".txt"):
                with open(os.path.join(token_folder, file), "r") as f:
                    token = f.read().strip()
                    if token:
                        tokens.append(token)
    return tokens

# Initialize round-robin token cycling
api_tokens = load_tokens(TOKEN_FOLDER)
if not api_tokens:
    raise Exception("No API tokens found in the folder!")

token_cycle = cycle(api_tokens)

def get_next_token():
    """Returns the next API token in the round-robin sequence."""
    return next(token_cycle)

params = {"enrollment_state": "active", "include[]": ["term"], "per_page": 100}

def fetch_all(url, params=None):
    """Fetches all pages of data from a Canvas API endpoint."""
    all_data = []
    while url:
        token = get_next_token()
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(url, headers=headers, params=params if '?' not in url else {})
        if response.status_code == 200:
            all_data.extend(response.json())
            url = None
        else:
            return None
    return all_data

def format_due_date(date_str):
    """Formats due dates into a more readable format."""
    if not date_str:
        return "No Due Date"
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%SZ")
        return dt.strftime("%B %d, %Y at %I:%M %p")
    except ValueError:
        return date_str

class FetchCoursesThread(QThread):
    finished = pyqtSignal(list)

    def run(self):
        courses = self.fetch_all_courses()
        self.finished.emit(courses)

    def fetch_all_courses(self):
        """Fetches all enrolled courses."""
        url = f"{CANVAS_URL}{ENDPOINT}"
        all_courses = []
        while url:
            token = get_next_token()
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(url, headers=headers, params=params if '?' not in url else {})
            if response.status_code == 200:
                courses = response.json()
                for course in courses:
                    if "id" in course and course.get("workflow_state") == "available":
                        details = self.fetch_course_details(course["id"])
                        all_courses.append({
                            "course_name": course["name"],
                            "course_id": course["id"],
                            "term": course.get("term", {}).get("name", "N/A"),
                            "assignments": "\n".join([f"- {a['name']} (Due: {format_due_date(a['due_at'])})" for a in
                                                      details["assignments"]]) or "No Assignments",
                            "modules": "\n".join([f"- {m['name']} (Items: {m['items_count']})" for m in
                                                  details["modules"]]) or "No Modules",
                        })
                url = None
        return all_courses

    def fetch_course_details(self, course_id):
        """Fetches assignments and modules for a course."""
        base_url = f"{CANVAS_URL}/api/v1/courses/{course_id}"
        assignments = fetch_all(f"{base_url}/assignments", {})
        modules = fetch_all(f"{base_url}/modules", {})
        return {
            "assignments": [
                {"name": a.get("name", "Unknown"), "due_at": a.get("due_at", "No Due Date")} for a in assignments or []
            ],
            "modules": [
                {"name": m.get("name", "Unknown"), "items_count": m.get("items_count", "N/A")} for m in modules or []
            ]
        }

class CanvasApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Canvas Course Manager")
        self.setGeometry(100, 100, 475, 475)
        self.initUI()
        self.setup_timer()

    def initUI(self):
        self.main_widget = QWidget()
        self.layout = QVBoxLayout()

        self.search_bar = QLineEdit()
        self.search_bar.setPlaceholderText("Search courses...")
        self.search_bar.textChanged.connect(self.update_course_table)
        self.layout.addWidget(self.search_bar)

        self.table = QTableWidget()
        self.table.setColumnCount(4)
        self.table.setHorizontalHeaderLabels(["Course Name", "Course ID", "Term", "Assignments", "Modules"])
        self.table.cellClicked.connect(self.display_course_details)
        self.layout.addWidget(self.table)

        self.details_text = QTextEdit()
        self.details_text.setReadOnly(True)
        self.layout.addWidget(self.details_text)

        self.fetch_info_label = QLabel("Auto refreshes every hour and on startup")
        self.fetch_info_label.setAlignment(Qt.AlignmentFlag.AlignCenter)  # Center align the text
        self.fetch_info_label.setStyleSheet("font-size: 12px; color: gray;")  # Optional styling
        self.layout.addWidget(self.fetch_info_label)

        self.main_widget.setLayout(self.layout)
        self.setCentralWidget(self.main_widget)
        self.courses = []

    def setup_timer(self):
        """Sets up a QTimer to fetch courses every hour and also fetch immediately at startup."""
        self.load_courses()  # Fetch courses immediately on startup
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.load_courses)
        self.timer.start(3600000)  # 1 hour in milliseconds

    def load_courses(self):
        """Fetches the courses in a separate thread."""
        self.fetch_thread = FetchCoursesThread()
        self.fetch_thread.finished.connect(self.update_course_table_with_data)
        self.fetch_thread.start()

    def update_course_table_with_data(self, courses):
        """Updates the course table with new data."""
        self.courses = courses
        self.update_course_table()

    def update_course_table(self):
        """Updates the displayed table based on the current course list."""
        self.table.setRowCount(0)
        search_text = self.search_bar.text().lower()
        for course in self.courses:
            if search_text in course["course_name"].lower():
                row_position = self.table.rowCount()
                self.table.insertRow(row_position)
                self.table.setItem(row_position, 0, QTableWidgetItem(course["course_name"]))
                self.table.setItem(row_position, 1, QTableWidgetItem(str(course["course_id"])))
                self.table.setItem(row_position, 2, QTableWidgetItem(course["term"]))
                self.table.setItem(row_position, 3, QTableWidgetItem(course["assignments"]))
                self.table.setItem(row_position, 4, QTableWidgetItem(course["modules"]))

    def display_course_details(self, row, column):
        """Displays detailed information about a selected course."""
        course = self.courses[row]
        details = f"Course: {course['course_name']}\n\nTerm: {course['term']}\n\nAssignments:\n{course['assignments']}\n\nModules:\n{course['modules']}"
        self.details_text.setText(details)

if __name__ == "__main__":
    import sys

    app = QApplication(sys.argv)
    window = CanvasApp()
    window.show()
    sys.exit(app.exec())
