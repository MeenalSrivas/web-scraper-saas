# routers/jobs.py
import os
import json
import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import db, verify_user
from datetime import datetime, timezone
from dotenv import load_dotenv
from firebase_admin import firestore
from groq import AsyncGroq

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq Client
groq_client = AsyncGroq(api_key=GROQ_API_KEY)

router = APIRouter(prefix="/jobs", tags=["Scraping Jobs"])

class ScrapingRequest(BaseModel):
    target_url: str
    instructions: str

@router.post("/create")
async def create_scraping_job(request: ScrapingRequest, uid: str = Depends(verify_user)):
    
    # --- PHASE 1: Data Lana (BeautifulSoup) ---
    try:
        # Website se raw HTML fetch karna (like a normal browser)
        headers = {"User-Agent": "MeenalLearningScraper/1.0 (Student Project; Contact: meenalsrivastav2004@gmail.com)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"}
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(request.target_url, headers=headers)
            response.raise_for_status()
            
            # HTML me se saari faltu cheezein (scripts, styles) hatakar sirf text nikalna
            soup = BeautifulSoup(response.text, 'html.parser')
            for script in soup(["script", "style", "nav", "footer"]):
                script.extract()
            
            raw_text = soup.get_text(separator=" ", strip=True)
            
            # Groq ki limit cross na ho isliye text ko thoda trim kar lenge (approx 20,000 chars)
            scraped_text = raw_text[:20000]

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch website data: {str(e)}")

    # --- PHASE 2: Data Samajhna (Groq API) ---
    try:
        # Groq ko clear system prompt aur user ka data bhej rahe hain
        system_prompt = (
            "You are an expert data extraction AI. Extract EXACTLY what the user asks for from the text and nothing more. "
            "Keep the output concise. DO NOT create infinite loops or deeply nested recursive structures. "
            "You MUST return ONLY a strictly valid JSON object. Ensure all keys have valid values and all brackets are closed."
        )
        
        user_prompt = f"Instructions: {request.instructions}\n\nWebsite Text:\n{scraped_text}"

        chat_completion = await groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile", # Super fast and free Meta model
            temperature=0.1, # Low temperature for accurate data extraction
            response_format={"type": "json_object"} # JSON return karne ke liye force karna
        )

        # Groq ke answer ko string se wapas JSON dictionary mein convert karna
        result_content = chat_completion.choices[0].message.content
        scraped_data = json.loads(result_content)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"AI Processing failed: {str(e)}")

    # --- PHASE 3: Database mein Save Karna ---
    new_job = {
        "uid": uid,  
        "target_url": request.target_url,
        "status": "completed",
        "result_data": scraped_data, 
        "created_at": datetime.now(timezone.utc)
    }

    doc_ref = db.collection("jobs").add(new_job)

    user_ref = db.collection("users").document(uid)
    user_ref.update({
        "total_jobs_run": firestore.Increment(1)
    })

    return {
        "message": "Scraping job completed successfully!",
        "job_id": doc_ref[1].id,
        "data": scraped_data
    }


@router.get("/history")
async def get_user_jobs(uid: str = Depends(verify_user)):
    jobs_query = db.collection("jobs").where("uid", "==", uid).order_by("created_at", direction="DESCENDING").get()
    
    user_jobs = []
    for job in jobs_query:
        job_dict = job.to_dict()
        job_dict['id'] = job.id 
        user_jobs.append(job_dict)
        
    return {"jobs": user_jobs}