<p align="center">
  <h1 align="center">🎓 StudyAgent</h1>
  <p align="center">
    <strong>Universal AI-Powered Syllabus Study Companion</strong><br>
    Any subject. Any syllabus. Get AI explanations for every topic → Export beautiful study notes
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama">
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  </p>
</p>

---

## ✨ What is StudyAgent?

**StudyAgent** is a universal AI-powered study assistant with a modern web UI. Enter **any subject**, paste your exam syllabus, and get detailed AI-generated explanations for every topic — powered by local LLMs via [Ollama](https://ollama.com).

> Think of it as a knowledgeable professor who sits with you and explains every topic of *any* subject — with definitions, step-by-step breakdowns, real-life examples, and key takeaways — then hands you a polished set of notes.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 📚 **Any Subject** | Works with any subject — AI, Data Structures, Physics, Economics, you name it |
| 📋 **Smart Syllabus Parser** | Auto-detects units, chapters, bullet points, and numbered lists |
| 🧠 **Subject-Aware AI** | Dynamic prompts tailored to your specific subject for accurate, relevant explanations |
| 📝 **Auto Note Generation** | All explanations compiled into structured study notes |
| 📥 **Multi-Format Export** | Export notes as **Markdown (.md)**, **PDF (.pdf)**, or **Word (.docx)** |
| ⏭️ **Auto-Proceed** | Automatically moves to the next topic with a countdown timer |
| 📊 **Progress Tracking** | Visual progress bar tracks your study session completion |
| 🔌 **Offline Fallback** | Falls back to generated explanations if the API server is unreachable |

---

## 📸 How It Works

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  📚 Enter Your   │ ──▶ │  📋 Paste Your   │ ──▶ │  🧠 AI Explains  │ ──▶ │  📥 Export Notes  │
│    Subject       │     │    Syllabus      │     │  Each Topic      │     │  PDF / DOCX / MD  │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

1. **Name** your subject (e.g., "Data Structures", "Physics", "Machine Learning")
2. **Paste** your exam syllabus (supports bullet points, numbered lists, units/modules)
3. **Parse** — StudyAgent auto-detects all topics and organizes them by unit
4. **Study** — AI explains each topic with subject-specific definitions, examples, and key takeaways
5. **Export** — Download your notes in Markdown, PDF, or Word format

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.10+, FastAPI |
| **AI / LLM** | Ollama (local inference) |
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Styling** | Glassmorphic dark theme, Inter font |
| **PDF Export** | html2pdf.js |
| **DOCX Export** | docx.js |

---

## 📂 Project Structure

```
StudyAgent/
├── server.py            # FastAPI backend (API + static file server)
├── frontend/
│   ├── index.html       # Web UI (landing, study dashboard, notes viewer)
│   ├── index.css        # Glassmorphic dark theme styles
│   └── app.js           # Frontend logic (parsing, API calls, export)
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

- **Python 3.10+**
- **[Ollama](https://ollama.com)** installed and running
- An Ollama model pulled (e.g., `ollama pull gemma3:27b`)

### 1. Clone the Repository

```bash
git clone https://github.com/harshendrak/StudyAgent.git
cd StudyAgent
```

### 2. Install Dependencies

```bash
pip install fastapi uvicorn ollama pydantic
```

### 3. Start Ollama

Make sure Ollama is running with a model available:

```bash
ollama serve
ollama pull gemma3:27b
```

### 4. Run the App

```bash
uvicorn server:app --reload --port 8000
```

Then open **http://localhost:8000** in your browser.

> 💡 **Quick preview:** You can also open `frontend/index.html` directly in your browser for a UI preview (AI features require the server).

---

## 🖥️ Usage

1. Open `http://localhost:8000` in your browser
2. Click **"Start Studying"** or **"See How It Works"** (loads a demo syllabus)
3. Enter your **subject name** (e.g., "AI for Engineers", "Operating Systems")
4. Paste your syllabus in the text area
5. Select your preferred AI model from the dropdown
6. Click **"Parse Syllabus"** → topics are detected and listed
7. Click **"Start Study Session"** → AI explains each topic with subject-aware context
8. Topics auto-proceed after a 5-second countdown, or navigate manually
9. When done, export your notes as **Markdown**, **PDF**, or **Word**

---

## 📋 Supported Syllabus Formats

StudyAgent's parser recognizes these formats:

```
Unit 1: Introduction                  ← Unit/Module/Chapter headers
- Topic one                            ← Bullet points (-, •, *, ◦)
- Topic two
* Topic three                          ← Asterisk bullets

Module 2: Advanced Concepts
1. Topic four                          ← Numbered lists (1. or 1)
2. Topic five
3. Topic six
```

---

## 🤖 Supported Models

| Model | Description |
|---|---|
| `gemma4:31b-cloud` | Google Gemma 4 31B (default) |
| `gemma3:27b` | Google Gemma 3 27B |
| `llama3:8b` | Meta LLaMA 3 8B |
| `mistral:7b` | Mistral 7B |
| `gpt-oss:120b-cloud` | GPT-OSS 120B Cloud |

> You can use any model available in your local Ollama instance by selecting it in the web UI dropdown.

---

## 📥 Export Formats

| Format | Description | Use Case |
|---|---|---|
| **Markdown (.md)** | Raw text, easy to edit | GitHub, Obsidian, Notion |
| **PDF (.pdf)** | Print-ready, beautifully formatted | Printing, sharing |
| **Word (.docx)** | Editable in MS Word/Google Docs | Editing, submitting |

---

## 🧠 Subject-Aware AI Prompts

StudyAgent dynamically generates system prompts tailored to your subject. The AI adapts its:

- **Examples** — Uses relatable, subject-specific real-life analogies
- **Depth** — Adjusts technical depth based on the field
- **Formulas** — Explains formulas/algorithms in plain words first, then shows them
- **Structure** — Follows a consistent 5-part format for every topic:

```
1. 📖 Simple Definition — Plain English explanation
2. ⚙️ How It Works — Step-by-step breakdown
3. 🌍 Real-Life Examples — At least 2 relatable examples
4. 💡 Why It Matters — Relevance to the subject and real world
5. 🔑 Key Takeaway — Quick summary for revision
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with 💜 by <strong>Harshendra</strong><br>
  <em>Study smarter, not harder.</em> 🍀
</p>
