from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import interactions, hcp, chat
from db.database import init_db

app = FastAPI(title="HCP CRM - AI-First", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(interactions.router, prefix="/api/interactions", tags=["Interactions"])
app.include_router(hcp.router, prefix="/api/hcp", tags=["HCP"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/")
def root():
    return {"message": "HCP CRM API running"}
