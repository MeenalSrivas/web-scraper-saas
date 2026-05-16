# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, jobs

# Initialize the API
app = FastAPI(title="Web Scraper SaaS API (Firebase Edition)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://web-scraper-saas-h33x2ul2w-meenal-srivastavs-projects.vercel.app"], # Tumhara React Vite ka URL
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, etc.)
    allow_headers=["*"], # Allow all headers (like Authorization)
)

# Plug in the users router
app.include_router(users.router)
app.include_router(jobs.router)

# A simple health-check endpoint
@app.get("/")
async def root():
    return {"message": "Firebase backend is running securely!"}