# PatternGuard — Spam & Content Detector

A keyword detection tool powered by the **Aho-Corasick algorithm** — capable of scanning text for multiple keywords simultaneously in linear time, regardless of how many keywords are loaded.

---
<img width="1897" height="907" alt="image" src="https://github.com/user-attachments/assets/2cb0c564-448c-4e34-bb0e-be2bead5b29a" />


---

## What It Does

- Add keywords manually or load preset packs (spam, phishing, profanity, resume skills)
- Paste any text and scan it instantly
- See every match highlighted in-place, with position, context snippet, and stats
- Works fully in the browser even when the backend is offline (JS fallback)

---

## Project Structure

```
patternguard/
├── backend/
│   ├── aho_corasick.py        # Aho-Corasick trie implementation
│   ├── main.py                # FastAPI REST API
│   ├── requirements.txt       # Python dependencies
│   └── test_aho_corasick.py   # Unit tests
├── frontend/
│   └── index.html             # Single-file frontend (vanilla HTML/CSS/JS)
└── README.md
```

---

## How the Algorithm Works

[Aho-Corasick](https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm) builds a trie from all keywords, then adds **failure links** — shortcuts that let the search engine fall back to the longest matching suffix when a character doesn't match. This means:

- **O(n + m + z)** time complexity — where `n` is text length, `m` is total keyword length, and `z` is the number of matches
- All keywords are searched in a **single pass** over the text
- Overlapping matches (e.g. `he`, `she`, `hers` inside `ushers`) are all found correctly

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Check API status and loaded keyword count |
| `POST` | `/keywords` | Add keywords `{ "keywords": ["spam", "fraud"] }` |
| `GET` | `/keywords` | List all loaded keywords |
| `DELETE` | `/keywords` | Clear all keywords |
| `POST` | `/search` | Scan text `{ "text": "your text here" }` |

---

## Setup & Running

### Prerequisites

- Python 3.10 or higher
- A modern web browser (Chrome, Firefox, Safari, Edge)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/patternguard.git
cd patternguard
```

---

### 2. Set Up the Backend

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload
```

The API will be live at **http://localhost:8000**.  
Interactive docs are available at **http://localhost:8000/docs**.

---

### 3. Open the Frontend

No build step needed — just open the file in your browser:

```bash
# macOS
open frontend/index.html

# Linux
xdg-open frontend/index.html

# Windows
start frontend/index.html
```

Or drag `frontend/index.html` into any browser tab.

> **Note:** The frontend will automatically detect whether the backend is running. If the API is offline, it falls back to a JavaScript implementation of the same search logic — so the app remains fully usable either way.

---

### 4. Run the Tests

```bash
cd backend
python test_aho_corasick.py
```

All 8 test groups should pass, covering basic matches, overlapping keywords, case-insensitivity, edge cases, and reset behavior.

---

## Usage Example

**Via the UI:**
1. Click a preset (e.g. **Spam**) or type a keyword and press Enter
2. Paste text into the input area (or click **Load Sample**)
3. Click **⚡ Scan**
4. Matches are highlighted in the text with position and context details

**Via the API directly:**

```bash
# Load keywords
curl -X POST http://localhost:8000/keywords \
  -H "Content-Type: application/json" \
  -d '{"keywords": ["spam", "fraud", "free money"]}'

# Scan text
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"text": "This is totally not spam or fraud, just free money!"}'
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.115.0 | REST API framework |
| `uvicorn` | 0.30.6 | ASGI server |
| `pydantic` | 2.9.2 | Request/response validation |

The frontend has no dependencies — it uses plain HTML, CSS, and JavaScript.
