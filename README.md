# PatternGuard — Aho-Corasick Content Scanner

A full-stack content moderation / text scanning tool powered by a **from-scratch Aho-Corasick algorithm** implementation.

---

## 🧠 Algorithm Explanation

### What is Aho-Corasick?

The **Aho-Corasick algorithm** (Aho & Corasick, 1975) is a multi-pattern string search algorithm. Instead of searching for each keyword one at a time, it finds **all occurrences of all patterns simultaneously** in a single pass through the text.

Think of it as a turbo-charged `grep` for multiple patterns at once.

---

### How It Works — Step by Step

#### Phase 1: Build a Trie (Prefix Tree)

Insert every keyword into a Trie. Each node represents a character; paths from root to a leaf spell out a keyword.

```
Keywords: ["spam", "scam", "sc"]

         (root)
         /    \
        s      ...
        |
        p — a — m   ← "spam" ends here
        |
        c — a — m   ← "scam" ends here
        |
       [output: "sc"]  ← "sc" ends here
```

#### Phase 2: Build Failure Links (BFS)

This is the clever part. For each node N, compute a **failure link** — a pointer to the longest proper suffix of the path (root → N) that is also a prefix of some pattern.

- Failure links are computed bottom-up via **BFS (Breadth-First Search)**.
- If we're at a node and the next character doesn't match, we follow the failure link instead of restarting from root.
- This guarantees we never miss an overlapping match.

**Output propagation:** If a failure link chain leads to a node that marks the end of a pattern, we propagate those outputs upward so matches are never missed.

#### Phase 3: Search

Walk through the text character by character:
- Follow the `goto` transition if the character matches a child.
- If no match, follow the `failure_link` (repeat until root).
- At each position, collect any patterns in the `output` list.

This gives us **all matches in a single O(n) pass**.

---

### Time & Space Complexity

| Operation | Complexity | What It Means |
|-----------|-----------|---------------|
| Build (insert keywords) | O(Σ\|kᵢ\|) | Proportional to total keyword characters |
| Build (failure links) | O(Σ\|kᵢ\|) | One BFS pass over the trie |
| **Search** | **O(n + m + z)** | n = text length, m = total keyword length, z = matches |
| Space | O(Σ\|kᵢ\| × Σ) | Σ = alphabet size |

**vs Naïve approach:** Searching k patterns naïvely costs O(n × k). Aho-Corasick reduces this to O(n) — the number of patterns no longer affects search time!

---

### Real-World Applications

| Domain | Use Case |
|--------|----------|
| Email security | Spam / phishing detection |
| Content moderation | Chat filters, comment moderation |
| Cybersecurity | Malware/intrusion signature scanning (e.g. Snort IDS) |
| Bioinformatics | DNA sequence scanning for multiple gene patterns |
| Search engines | Keyword indexing and highlighting |
| Log monitoring | Real-time log analysis for error patterns |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│         (HTML/CSS/JS — index.html)           │
│                                              │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Keyword Panel │  │   Text Input + UI    │ │
│  └──────────────┘  └──────────────────────┘ │
│           │                 │                │
│           └────── REST ──────┘               │
└─────────────────────────────────────────────┘
                    │
                    │ HTTP (localhost:8000)
                    ▼
┌─────────────────────────────────────────────┐
│              FastAPI Backend                 │
│                  main.py                     │
│                                              │
│  POST /keywords  →  Add patterns             │
│  GET  /keywords  →  List patterns            │
│  DELETE /keywords → Reset                    │
│  POST /search    →  Run Aho-Corasick         │
│  GET  /health    →  Status check             │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│         aho_corasick.py (Pure Python)        │
│                                              │
│  AhoCorasickNode  — Trie node                │
│  AhoCorasick      — Automaton                │
│    .add_keywords()  — Trie insertion         │
│    .build()         — BFS failure links      │
│    .search()        — Single-pass scan       │
└─────────────────────────────────────────────┘
```

---

## 🚀 Setup & Running

### Prerequisites

- Python 3.9+
- A web browser (for the frontend)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.

Interactive docs: `http://localhost:8000/docs`

### Frontend

Just open `frontend/index.html` in your browser. No build step needed.

> **Note:** The frontend includes a built-in browser fallback. Even if the backend is offline, pattern matching still works locally in JavaScript.

---

## 📡 API Reference

### `GET /health`

Returns service status.

```json
{
  "status": "ok",
  "keywords_loaded": 5,
  "uptime_seconds": 42.3,
  "version": "1.0.0"
}
```

---

### `POST /keywords`

Add keywords to the automaton.

**Request:**
```json
{
  "keywords": ["spam", "scam", "fraud"]
}
```

**Response:**
```json
{
  "keywords": ["spam", "scam", "fraud"],
  "count": 3,
  "automaton_built": true
}
```

---

### `POST /search`

Search text for all loaded patterns.

**Request:**
```json
{
  "text": "This message contains spam and fraud."
}
```

**Response:**
```json
{
  "matches": [
    { "keyword": "spam", "position": 22, "end": 26, "length": 4 },
    { "keyword": "fraud", "position": 31, "end": 36, "length": 5 }
  ],
  "total_matches": 2,
  "unique_keywords_found": ["fraud", "spam"],
  "text_length": 37,
  "keywords_searched": 3,
  "time_ms": 0.021
}
```

---

## 🧪 Running Tests

```bash
cd backend
python test_aho_corasick.py
```

---

## 🐳 Docker (Bonus)

```bash
# From project root
docker build -t patterngard-backend ./backend
docker run -p 8000:8000 patterngard-backend
```

---

## 💡 Assumptions & Design Decisions

1. **Lowercase normalization** — All keywords and search text are lowercased for case-insensitive matching. Original text casing is preserved for display.
2. **In-memory state** — The automaton lives in memory. For production, use Redis or a database for persistence across restarts.
3. **Pure Python** — The algorithm is implemented from scratch without any library (like `pyahocorasick`) to demonstrate understanding.
4. **Browser fallback** — The frontend includes a JS fallback that works even without the backend running.

---

## 🔮 Future Improvements

- [ ] Persistent keyword storage (SQLite / Redis)
- [ ] Multi-language / Unicode support improvements
- [ ] Batch file upload (scan PDFs, CSVs)
- [ ] Severity levels per keyword
- [ ] Export results as JSON/CSV
- [ ] WebSocket for real-time streaming scan
- [ ] Docker Compose for one-command startup
- [ ] Async endpoint with background processing for large texts

---

## 📁 Project Structure

```
aho-corasick-project/
├── backend/
│   ├── aho_corasick.py      # Core algorithm (pure Python)
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── test_aho_corasick.py # Unit tests
├── frontend/
│   └── index.html           # Single-file frontend
└── README.md
```
