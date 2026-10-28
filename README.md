# imgConvert

A simple, fast, and 100% offline batch image converter. Easily convert `.jpe`, `.jpg`, and `.png` images in bulk without uploading your files to third-party websites.

Available as a **standalone Windows desktop app (`.exe`)**, a **Python desktop GUI (`gui_app.py`)**, or a **minimal terminal script (`main.py`)**.

---

##  Features

- **100% Local & Private**: No files leave your machine. Zero uploads.
- **Batch Processing**: Convert entire folders in one click.
- **Smart Transparency Handling**: Properly converts transparent images to JPG with clean white backgrounds (no black box artifacts).
- **Format Filtering**: Option to convert only `.jpe` files or all detected images.
- **Lightweight**: Minimal dependencies, runs smoothly on any system.

---

##  Download Pre-built Executable (No Python Required)

If you just want to use the app without touching code:

1. Go to the [**Releases**](../../releases) tab on the right side of this repository.
2. Download `imgConvert.zip` (or `imgConvert.exe`).
3. Extract and double-click `imgConvert.exe` to run!

> **Note for Windows users**: Because this is an open-source project without a paid enterprise certificate, Windows SmartScreen may show a blue prompt *"Windows protected your PC"*. Simply click **More info** &rarr; **Run anyway**.

---

## Running From Source (For Developers)

### 1. Prerequisites
- **Python 3.8+** installed ([Download Python](https://www.python.org/downloads/))
- **Git** (optional, to clone the repo)

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/imgConvert.git
cd imgConvert
