# 🕌 Twitter Auto Tweet - Islamic Adia with Unique Stamp 💻

## ⭐ Project Overview

This project is a **UserScript** designed to run within browser extensions like **Tampermonkey** or **Greasemonkey**.

The goal of this script is to **automate the process of posting tweets/posts** on the X platform (formerly Twitter). It randomly selects an Islamic supplication (Dua/Adia) from a predefined list and appends a **Unique Random Stamp** to it.

### 💡 Core Features and Purpose:

* **Dhikr & Adia Publication:** Helps automate the regular posting of Islamic supplications and remembrance (Dhikr).
* **Anti-Duplication Mechanism:** The unique stamp ensures that every single post is **completely unique**, even if the supplication text repeats. This is critical for preventing detection by platform algorithms as duplicate content or spam.
* **Aesthetic CMD-Style Interface:** Integrates a retro-themed Command Line Interface (CLI) control panel with a cool **"Neon Green"** aesthetic for easy monitoring and control.

---

## 🛠️ Installation Guide

To run this script, you must have a UserScript manager extension installed on your web browser.

### 1. Install a UserScript Manager:

| Browser | Recommended Extension |
| :---: | :---: |
| **Chrome** / **Edge** | [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| **Firefox** | [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) |

### 2. Install the Script:

1.  **Direct Installation:** Click the link below. If your UserScript manager is installed, it will prompt you to install the script immediately.
    > [Insert Link to your **`.user.js`** file here, e.g., `https://github.com/YourUsername/RepoName/raw/main/twitter-auto-tweet-adia.user.js`]
2.  **Manual Installation (Alternative):**
    * Open your Tampermonkey dashboard.
    * Create a new script (usually a `+` sign).
    * Copy the **entire code** from the `twitter-auto-tweet-adia.user.js` file and paste it.
    * Save and enable the script.

---

## 🚀 Usage Instructions

Once the script is installed and you navigate to the Twitter/X website, the **CMD-Style Control Panel** will appear in the bottom-right corner.

### 1. CMD Control Panel

* **Quick Toggle:** You can quickly show or hide the panel using the keyboard shortcut: **`Ctrl + Alt + C`**.

### 2. Available Commands

| Command (Button) | Function | Details |
| :---: | :---: | :---: |
| **RUN: publish\_tweet.exe** | **Single Post** | Publishes one random supplication immediately. |
| **EXEC: auto\_mode.bat** | **Toggle Automation** | Starts or stops the automatic posting mode. |
| **RESET** | **Reset Counter** | Resets the published tweet count to zero. |
| **CLEAR LOG** | **Clear Log** | Clears the command and activity log in the console. |

### 3. Automatic Operation Logic

When auto-posting is active, the script selects a random Adia, adds the `#أدعية_إسلامية` hashtag, appends a unique 10-character stamp, and posts the tweet every **10 seconds** (`POST_INTERVAL_MS`).

---

## ⚙️ Code Structure Highlights

### Anti-Duplication Feature: `generateUniqueStamp()`

The core mechanism for avoiding duplicate content is adding a randomly generated string of 10 characters, numbers, and symbols:

```javascript
/* Example Tweet: */
// اللهم صل وسلم على نبينا محمد وعلى آله وصحبه. #أدعية_إسلامية [G^&t9s(2!L]
