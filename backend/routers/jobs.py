# routers/jobs.py
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from database import db, verify_user
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
ANAKIN_API_KEY = os.getenv("ANAKIN_API_KEY")

router = APIRouter(prefix="/jobs", tags=["Scraping Jobs"])

@router.post("/create")
async def create_scraping_job(target_url: str, uid: str = Depends(verify_user)):
    """
    User ek target_url bhejega. Hum user verify karenge, Anakin se scrape karwayenge,
    aur Firestore mein result save karenge.
    """
    
    # 1. Anakin API setup (Documentation ke hisaab se endpoints aur headers)
    anakin_url = "https://api.anakin.io/v1/web-scraper" # Example Anakin endpoint
    headers = {
        "Authorization": f"Bearer {ANAKIN_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "url": target_url
        # Tum yahan aur parameters add kar sakte ho if needed (like JS rendering)
    }

    try:
        # 2. Httpx se async request bhej rahe hain Anakin ko
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(anakin_url, json=payload, headers=headers)
            response.raise_for_status() # Agar error aayi toh exception raise karega
            
            scraped_data = response.json()

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Scraping failed: {str(e)}")

    # 3. Agar scraping successful rahi, toh database (Firestore) mein save karo
    new_job = {
        "uid": uid,  # Kis user ne request kiya
        "target_url": target_url,
        "status": "completed",
        "result_data": scraped_data, # Anakin se jo data mila
        "created_at": datetime.now(timezone.utc)
    }

    # Firestore ke 'jobs' collection mein add kar rahe hain
    # .add() use karne se Firestore automatically ek unique ID generate karega is job ke liye
    doc_ref = db.collection("jobs").add(new_job)

    # 4. User stats update karo (Total jobs run counter badhao)
    user_ref = db.collection("users").document(uid)
    user_ref.update({
        "total_jobs_run": firestore.Increment(1)
    })

    return {
        "message": "Scraping job completed successfully!",
        "job_id": doc_ref[1].id, # Naye generated document ki ID
        "data": scraped_data
    }

@router.get("/history")
async def get_user_jobs(uid: str = Depends(verify_user)):
    
    jobs_query = db.collection("jobs").where("uid", "==", uid).order_by("created_at", direction="DESCENDING").get()
    
    user_jobs = []
    for job in jobs_query:
        job_dict = job.to_dict()
        job_dict['id'] = job.id # Document ID bhi bhej do frontend ke liye
        user_jobs.append(job_dict)
        
    return {"jobs": user_jobs}