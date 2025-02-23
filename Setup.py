import os
import time
import tkinter as tk
from tkinter import simpledialog, messagebox
import pyperclip
import platform
import shutil
import sys
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException, TimeoutException
from webdriver_manager.chrome import ChromeDriverManager

# 🔑 Canvas URLs
CANVAS_URL = "https://fgcu.instructure.com/"
TOKEN_PAGE_URL = "https://fgcu.instructure.com/profile/settings"
DUO_AUTH_URL = "https://api-ed2ef044.duosecurity.com/frame/v4/auth/prompt"

# Prompt user for FGCU login credentials using Tkinter
root = tk.Tk()
root.withdraw()
EMAIL = simpledialog.askstring("Canvas Token Generator", "Enter your FGCU email:")
PASSWORD = simpledialog.askstring("Canvas Token Generator", "Enter your password:", show='*')

if not EMAIL or not PASSWORD:
    messagebox.showerror("Canvas Token Generator", "❌ User cancelled input. Exiting...")
    sys.exit(0)


def get_chrome_path():
    """Finds the Chrome executable path based on OS"""
    system = platform.system()
    paths = {
        "Windows": [
            shutil.which("chrome"),
            r"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            r"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe")
        ],
        "Darwin": [shutil.which("google-chrome"), "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
        "Linux": [shutil.which("google-chrome"), "/usr/bin/google-chrome", "/usr/bin/chromium-browser"]
    }

    for path in paths.get(system, []):
        if path and os.path.exists(path):
            return path

    raise FileNotFoundError("❌ Chrome not found. Install Chrome.")


def login_to_canvas(driver):
    """Handles login process"""
    driver.get(CANVAS_URL)
    time.sleep(1)

    WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "i0116"))).send_keys(EMAIL)
    time.sleep(1)
    WebDriverWait(driver, 15).until(EC.element_to_be_clickable((By.ID, "idSIButton9"))).click()
    time.sleep(1)

    WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "i0118"))).send_keys(PASSWORD)
    time.sleep(1)
    WebDriverWait(driver, 15).until(EC.element_to_be_clickable((By.ID, "idSIButton9"))).click()
    time.sleep(1)

    try:
        stay_signed_in = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, "idSIButton9")))
        stay_signed_in.click()
    except TimeoutException:
        print("No 'Stay Signed In' prompt detected.")
    time.sleep(1)

    # Handle Duo Authentication
    WebDriverWait(driver, 40).until(EC.url_contains("duosecurity.com"))
    WebDriverWait(driver, 20).until(EC.element_to_be_clickable((By.ID, "trust-browser-button"))).click()
    time.sleep(1)

    WebDriverWait(driver, 40).until(EC.url_contains("instructure.com"))
    messagebox.showinfo("Canvas Token Generator",
                        "✅ Successfully logged into Canvas! Starting setup... Do not click anything after pressing ok until all done appears!")


def generate_canvas_tokens():
    """Generates six Canvas API tokens and saves them in the same folder"""
    options = webdriver.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.binary_location = get_chrome_path()

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    try:
        login_to_canvas(driver)
        driver.get(TOKEN_PAGE_URL)
        time.sleep(1)

        token_dir = "canvasPAL_tokens"
        os.makedirs(token_dir, exist_ok=True)

        for i in range(1, 7):
            time.sleep(1)
            WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.CLASS_NAME, "add_access_token_link"))).click()
            time.sleep(1)
            WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.NAME, "purpose"))).send_keys(
                f"CanvasPAL-token {i}")
            time.sleep(1)
            WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@aria-label='Generate Token']"))).click()
            time.sleep(1)

            access_token = WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.XPATH, "//span[@data-testid='visible_token']"))
            ).text.strip()
            time.sleep(1)

            pyperclip.copy(access_token)
            with open(os.path.join(token_dir, f"token_{i}.txt"), "w") as file:
                file.write(access_token)

            WebDriverWait(driver, 20).until(EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(@class, 'css-pa6zs7-view--inlineBlock-baseButton')]"))).click()
            time.sleep(1)

        messagebox.showinfo("Canvas Token Generator", "All done!")
    except Exception as e:
        messagebox.showerror("Error", f"❌ Error: {e}")
    finally:
        driver.quit()


if __name__ == "__main__":
    generate_canvas_tokens()
