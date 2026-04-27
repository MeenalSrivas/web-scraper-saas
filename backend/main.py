# main.py
from fastapi import FastAPI
from routers import users

# Initialize the API
app = FastAPI(title="Web Scraper SaaS API (Firebase Edition)")

# Plug in the users router
app.include_router(users.router)

# A simple health-check endpoint
@app.get("/")
async def root():
    return {"message": "Firebase backend is running securely!"}