# routers/jobs.py
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import db, verify_user
from datetime import datetime, timezone
from dotenv import load_dotenv
from firebase_admin import firestore # NAYA: Increment function use karne ke liye import zaroori hai

# Load environment variables
load_dotenv()
ANAKIN_API_KEY = os.getenv("ANAKIN_API_KEY")

router = APIRouter(prefix="/jobs", tags=["Scraping Jobs"])

class ScrapingRequest(BaseModel):
    target_url: str
    instructions: str

@router.post("/create")
async def create_scraping_job(request: ScrapingRequest, uid: str = Depends(verify_user)):
    """
    User ek target_url bhejega. Hum user verify karenge, Anakin se scrape karwayenge,
    aur Firestore mein result save karenge.
    """
    
    # 1. Sahi Anakin API URL (Web url ki jagah API url lagaya hai)
    anakin_url = "https://api.anakin.ai/v1/quickapps/43192/runs" 
    
    headers = {
        "Authorization": f"Bearer {ANAKIN_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # 2. Sahi Payload Format (Anakin ke inputs structure ke hisaab se)
    payload = {
        "inputs": {
            "url": request.target_url,
            "instructions": request.instructions
        },
        "stream": False
    }

    try:
        # NAYA: follow_redirects=True add kiya hai
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.post(anakin_url, json=payload, headers=headers)
            
            # Terminal me print karega ki exactly kya text aaya hai
            print("🚀 STATUS CODE:", response.status_code)
            print("🕵️ RAW RESPONSE:", response.text)
            
            # Agar error status hai toh direct except block me bhej dega
            response.raise_for_status() 
            
            # Ab safely JSON me convert karega
            scraped_data = response.json()

    except httpx.HTTPStatusError as e:
        print(f"❌ Anakin API Error: {e.response.text}") 
        raise HTTPException(status_code=400, detail=f"Anakin rejected the request: {e.response.text}")
        
    except Exception as e:
        # Yeh wahi error hai jo tumhe abhi screen par dikha tha
        raise HTTPException(status_code=400, detail=f"Scraping failed: {str(e)}")

    # 3. Agar scraping successful rahi, toh database (Firestore) mein save karo
    new_job = {
        "uid": uid,  
        "target_url": request.target_url, # FIX: Pura object 'request' se aayega
        "status": "completed",
        "result_data": scraped_data, 
        "created_at": datetime.now(timezone.utc)
    }

    # Firestore ke 'jobs' collection mein add kar rahe hain
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