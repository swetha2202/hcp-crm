\# HCP CRM - AI-First CRM for Life Sciences



\## Overview



HCP CRM is a full-stack AI-powered Customer Relationship Management platform built for pharmaceutical field representatives. It allows reps to log Healthcare Professional (HCP) interactions through a structured form or a conversational AI chat interface powered by LangGraph and Groq.



The project is built using:



\* FastAPI for backend APIs

\* React + Redux Toolkit for frontend

\* PostgreSQL for persistent data storage

\* LangGraph for AI agent orchestration

\* Groq (gemma2-9b-it) as the LLM provider

\* Docker Compose for containerized development



\---



\## Current Features



\### Backend Features



\* JWT-ready FastAPI architecture

\* HCP listing and search API

\* Interaction logging API

\* Interaction edit API

\* Interaction history by HCP

\* AI chat endpoint powered by LangGraph

\* PostgreSQL async integration via SQLAlchemy + asyncpg

\* Auto table creation on startup

\* Dockerized backend



\### Frontend Features



\* Responsive dashboard page

\* Dual-mode interaction logging (form + chat)

\* Interaction history view with edit support

\* Redux Toolkit state management

\* Axios API integration

\* Real-time AI chat interface

\* Google Inter font styling



\---



\## Project Structure



hcp-crm/

|

+-- backend/

|   +-- main.py

|   +-- requirements.txt

|   +-- .env.example

|   +-- db/database.py

|   +-- models/

|   |   +-- hcp.py

|   |   +-- interaction.py

|   +-- agents/hcp\_agent.py

|   +-- routers/

|       +-- interactions.py

|       +-- hcp.py

|       +-- chat.py

|

+-- frontend/

|   +-- src/

|   |   +-- components/

|   |   +-- store/slices/

|   |   +-- api/

|   |   +-- styles/

|   +-- public/

|

+-- docker-compose.yml



\---



\## Tech Stack



\### Backend

\* FastAPI

\* SQLAlchemy (async)

\* PostgreSQL + asyncpg

\* LangGraph

\* Groq API

\* python-dotenv



\### Frontend

\* React 18

\* Redux Toolkit

\* Axios

\* CSS (Google Inter font)



\### DevOps

\* Docker

\* Docker Compose



\---



\## AI Agent Tools



| Tool | Purpose |

|---|---|

| log\_interaction | Extracts structured data from natural language and logs it |

| edit\_interaction | Modifies specific fields of an existing interaction |

| get\_hcp\_history | Retrieves past interactions for a given HCP |

| suggest\_follow\_ups | Generates prioritized next-step recommendations |

| analyze\_sentiment | Analyzes HCP sentiment and engagement level |



\---



\## Docker Services



\* backend

\* frontend

\* postgres



\---



\## Run Locally



Start all containers:



docker compose up --build



Backend API Docs: http://localhost:8000/docs



Frontend: http://localhost:3000



\---



\## Run Without Docker



\### Backend



cd backend

python -m venv venv

venv\\Scripts\\activate



pip install -r requirements.txt

uvicorn main:app --reload --port 8000



Create a .env file in backend/:



DATABASE\_URL=postgresql+asyncpg://postgres:your\_password@localhost:5432/hcp\_crm

GROQ\_API\_KEY=your\_groq\_api\_key\_here



\### Frontend



cd frontend

npm install

$env:REACT\_APP\_API\_URL="http://localhost:8000/api"; npm start



\---



\## Environment Variables



| Variable | Description |

|---|---|

| DATABASE\_URL | PostgreSQL async connection string |

| GROQ\_API\_KEY | Groq API key from console.groq.com |

| REACT\_APP\_API\_URL | Backend API base URL |



\---



\## Current Development Status



\### Completed

\* Core backend architecture

\* Core frontend architecture

\* PostgreSQL integration

\* LangGraph AI agent with 5 tools

\* Dual-mode interaction logging (form + chat)

\* Interaction history and edit support

\* Docker setup



\### In Progress

\* AWS deployment

\* WebSocket live updates

\* Advanced dashboard analytics



\### Future Improvements

\* Portfolio tracking

\* Alerts engine

\* Real-time charts

\* Role-based access control

\* Production monitoring



\---



\## Author



Built as a full-stack AI-first CRM platform using FastAPI + React + LangGraph + Groq.

