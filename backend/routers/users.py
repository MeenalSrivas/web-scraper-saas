# routers/users.py
from fastapi import APIRouter, Depends
from database import db, verify_user
from datetime import datetime, timezone

# Group our user-related endpoints together
router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/sync")
async def sync_user_profile(uid: str = Depends(verify_user)):
    
    user_ref = db.collection("users").document(uid)
    
    # 2. Fetch the document from Firestore
    user_doc = user_ref.get()
    
    # 3. If they don't exist, create a new profile document
    if not user_doc.exists:
        new_user = {
            "uid": uid,
            "created_at": datetime.now(timezone.utc),
            "subscription_tier": "free",
            "total_jobs_run": 0
        }
        user_ref.set(new_user)
        return {"message": "New user profile created", "user": new_user}
    
    # 4. If they do exist, just return their existing data
    return {"message": "User profile synced", "user": user_doc.to_dict()}