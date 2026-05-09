# backend/routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import db, verify_user
from datetime import datetime, timezone

# Group our user-related endpoints together
router = APIRouter(prefix="/users", tags=["Users"])

# --- Pydantic Model for Profile Data ---
class UserProfile(BaseModel):
    username: str = ""
    gender: str = "other"
    bio: str = ""
    role: str = "Student"


# --- 1. EXISTING ENDPOINT: Create/Sync User on Login ---
@router.post("/sync")
async def sync_user_profile(uid: str = Depends(verify_user)):
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        new_user = {
            "uid": uid,
            "created_at": datetime.now(timezone.utc),
            "subscription_tier": "free",
            "total_jobs_run": 0
        }
        user_ref.set(new_user)
        return {"message": "New user profile created", "user": new_user}
    
    return {"message": "User profile synced", "user": user_doc.to_dict()}


# --- 2. NEW ENDPOINT: Get Profile Data for the Edit Form ---
@router.get("/me")
async def get_profile(uid: str = Depends(verify_user)):
    user_ref = db.collection("users").document(uid).get()
    
    if user_ref.exists:
        data = user_ref.to_dict()
        # Return default values if the user hasn't filled their profile yet
        return {
            "username": data.get("username", ""),
            "gender": data.get("gender", "other"),
            "bio": data.get("bio", ""),
            "role": data.get("role", "Student")
        }
        
    raise HTTPException(status_code=404, detail="User not found")


# --- 3. NEW ENDPOINT: Save Edited Profile Data ---
@router.post("/update")
async def update_profile(profile: UserProfile, uid: str = Depends(verify_user)):
    try:
        # merge=True is CRITICAL here! It updates the profile fields WITHOUT 
        # deleting their total_jobs_run or subscription_tier
        db.collection("users").document(uid).set(profile.dict(), merge=True)
        return {"message": "Profile updated successfully!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))