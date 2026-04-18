# HCP CRM – AI-First CRM System for Life Sciences

An AI-First Customer Relationship Management (CRM) system focused on the **Healthcare Professional (HCP) Module**, built for pharmaceutical field representatives. This system allows reps to log HCP interactions via a **structured form** or a **conversational AI chat interface** powered by LangGraph and Groq.

---

## 🏗️ Architecture Overview

```
┌─────────────────────┐        ┌──────────────────────────────────────────────┐
│  React Frontend     │        │         FastAPI Backend                       │
│  (Redux State Mgmt) │◄──────►│  ┌──────────────┐   ┌─────────────────────┐  │
│                     │  REST  │  │   Routers     │   │  LangGraph Agent    │  │
│  • LogInteraction   │  API   │  │  /interactions│   │  ┌───────────────┐  │  │
│  • HistoryView      │        │  │  /hcp         │   │  │ log_interact  │  │  │
│  • Dashboard        │        │  │  /chat        │   │  │ edit_interact │  │  │
└─────────────────────┘        │  └──────────────┘   │  │ get_hcp_hist  │  │  │
                               │                      │  │ suggest_fups  │  │  │
                               │  ┌──────────────┐   │  │ analyze_sent  │  │  │
                               │  │  PostgreSQL  │   │  └───────────────┘  │  │
                               │  │  (Async ORM) │   └─────────────────────┘  │
                               │  └──────────────┘         ▲                  │
                               └──────────────────────────  │ Groq API ────────┘
                                                          gemma2-9b-it
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Redux Toolkit |
| Backend | Python 3.11 + FastAPI |
| AI Agent | LangGraph (StateGraph) |
| LLM | Groq — `gemma2-9b-it` (primary), `llama-3.3-70b-versatile` (fallback) |
| Database | PostgreSQL (async via SQLAlchemy + asyncpg) |
| Font | Google Inter |
| Containerization | Docker + Docker Compose |

---

## 🤖 LangGraph Agent — 5 Tools Explained

The LangGraph agent (`agents/hcp_agent.py`) uses a `StateGraph` with a `ToolNode` and 5 registered tools:

### 1. `log_interaction` *(Required)*
**Purpose:** Captures structured interaction data from natural language input.

**How it works:**
- Accepts HCP name, interaction type, date/time, topics, materials, samples, outcomes, follow-up actions, and raw freeform notes
- Sends a structured prompt to **Groq gemma2-9b-it** requesting a JSON response with:
  - `summary` — 2–3 sentence AI-generated summary
  - `entities` — extracted drug names, clinical terms
  - `sentiment` — inferred from tone (Positive/Neutral/Negative)
  - `suggested_follow_ups` — 2–3 actionable next steps
- Returns a fully structured dict ready for PostgreSQL insert

**Example trigger:**
> *"Met Dr. Priya at Apollo Hospital, discussed OncoPrime efficacy and Phase III trial data, she seemed interested, shared two brochures"*

---

### 2. `edit_interaction` *(Required)*
**Purpose:** Allows modification of specific fields in an already-logged interaction.

**How it works:**
- Takes `interaction_id`, `field` name, and `new_value`
- Validates field is in the allowed editable set: `topics_discussed`, `outcomes`, `follow_up_actions`, `sentiment`, `materials_shared`, `samples_distributed`, `attendees`
- Returns an edit confirmation object; the backend router (`PUT /interactions/{id}`) executes the actual DB update
- Prevents arbitrary field modification (e.g., timestamps, IDs cannot be changed)

**Example trigger:**
> *"Edit interaction #12, change follow_up_actions to 'Schedule CME webinar in 2 weeks'"*

---

### 3. `get_hcp_history`
**Purpose:** Retrieves past interactions for a given HCP to brief a rep before a visit.

**How it works:**
- Takes HCP name and optional limit (default: 5)
- Returns structured list of past interactions: dates, types, AI summaries, open follow-ups
- Enables the agent to surface context like: *"Last time you met Dr. Sharma, she raised concerns about pricing"*
- Used to prime the AI for follow-up suggestions

**Example trigger:**
> *"Show me the last 5 interactions with Dr. Mehta"*

---

### 4. `suggest_follow_ups`
**Purpose:** Generates AI-powered, prioritized next-step recommendations for a sales rep.

**How it works:**
- Calls **Groq gemma2-9b-it** with the last interaction summary and product focus area
- Prompts the model to act as a *pharmaceutical sales coach*
- Returns a JSON array of follow-up actions with `action`, `priority` (High/Medium/Low), and `timeframe`
- Examples: *"Send OncoPrime clinical trial PDF within 3 days"*, *"Invite to advisory board — High priority"*

**Example trigger:**
> *"Suggest follow-ups for my meeting with Dr. Kumar about CardioMax"*

---

### 5. `analyze_sentiment`
**Purpose:** Deeply analyzes the sentiment and engagement level of an HCP from interaction notes.

**How it works:**
- Sends interaction notes to **Groq gemma2-9b-it** with a CRM-context system prompt
- Returns structured JSON:
  - `sentiment` — Positive/Neutral/Negative
  - `confidence` — 0.0 to 1.0 score
  - `key_concerns` — list of objections or concerns raised by HCP
  - `interest_level` — High/Medium/Low
  - `recommended_approach` — one-sentence strategy for next visit
- Used for CRM tagging and rep coaching

**Example trigger:**
> *"Analyze the sentiment of: Dr. Singh seemed reluctant, kept asking about side effects and insurance coverage"*

---

## 📁 Project Structure

```
hcp-crm/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── db/
│   │   └── database.py          # Async PostgreSQL connection
│   ├── models/
│   │   ├── hcp.py               # HCP SQLAlchemy model
│   │   └── interaction.py       # Interaction SQLAlchemy model
│   ├── agents/
│   │   └── hcp_agent.py         # LangGraph agent + 5 tools
│   └── routers/
│       ├── interactions.py      # CRUD for interactions
│       ├── hcp.py               # HCP search and listing
│       └── chat.py              # AI chat endpoint
│
├── frontend/
│   ├── package.json
│   ├── Dockerfile
│   ├── public/
│   │   └── index.html           # Google Inter font loaded here
│   └── src/
│       ├── App.js               # Router + Sidebar + Layout
│       ├── index.js
│       ├── api/
│       │   └── axios.js         # Axios instance
│       ├── store/
│       │   ├── store.js         # Redux configureStore
│       │   └── slices/
│       │       ├── interactionSlice.js
│       │       ├── chatSlice.js
│       │       └── hcpSlice.js
│       ├── components/
│       │   ├── LogInteractionScreen.jsx  # Main dual-mode screen
│       │   ├── HistoryView.jsx           # Interaction history + edit
│       │   └── Dashboard.jsx             # Overview + stats
│       └── styles/
│           └── global.css               # All styles, Inter font
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Option A: Docker (Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/hcp-crm.git
cd hcp-crm

# 2. Set your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env

# 3. Start all services
docker-compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option B: Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env from example
cp .env.example .env
# Edit .env with your PostgreSQL URL and Groq API key

uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000/api npm start
```

---

## 🔑 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL async connection string | `postgresql+asyncpg://postgres:password@localhost:5432/hcp_crm` |
| `GROQ_API_KEY` | Groq API key from console.groq.com | `gsk_...` |
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:8000/api` |

Get a free Groq API key at: https://console.groq.com

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/interactions` | List all interactions |
| `POST` | `/api/interactions` | Create new interaction |
| `PUT` | `/api/interactions/{id}` | Update a field |
| `GET` | `/api/interactions/hcp/{hcp_id}` | Get interactions by HCP |
| `GET` | `/api/hcp` | List all HCPs |
| `GET` | `/api/hcp/search?q=` | Search HCPs by name |
| `POST` | `/api/chat` | Chat with LangGraph agent |
| `GET` | `/docs` | Swagger UI |

---

## 🎥 Demo Walkthrough

The video demonstrates:
1. **Log Interaction via Form** — filling all fields and submitting
2. **Log Interaction via Chat** — natural language → AI fills form automatically
3. **All 5 LangGraph tools** firing with real Groq API calls
4. **Edit Interaction** — modifying a logged record
5. **History View** — browsing and editing past interactions
6. **Dashboard** — stats and tool overview

---

## 🧠 What I Understood from This Task

This task challenged me to design a real-world AI-first CRM system for the life sciences domain. Key learnings:

- **LangGraph** enables stateful, multi-step AI agents where each tool call is a node in a graph — ideal for CRM workflows that need sequential reasoning (understand → extract → log → follow up)
- **Groq's gemma2-9b-it** provides very fast inference for structured JSON extraction tasks, making it practical for CRM use where reps need immediate feedback
- **HCP interactions** have nuanced structure — sentiment, entity extraction (drug names, indications), and follow-up scheduling are all domain-specific AI tasks
- A **dual-mode interface** (form + chat) is essential for pharma reps: experienced reps prefer forms for compliance, while on-the-go logging benefits from conversational AI
- **Redux** effectively separates UI state (chat history, form fields) from server state (fetched interactions), making the app scalable

---

## 📜 License

MIT License — built for educational/assignment purposes.
