# database.py
import firebase_admin
from firebase_admin import credentials, firestore, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# 1. Initialize Firebase Admin
# We check if it's already initialized to prevent errors if the server reloads
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase-credentials.json")
    firebase_admin.initialize_app(cred)

# 2. Connect to Firestore (Your serverless database)
db = firestore.client()

# 3. Setup the security scheme for FastAPI
security = HTTPBearer()

# 4. The Security Guard Middleware
async def verify_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    This intercepts the token sent by React, asks Firebase if it's real, 
    and returns the user's unique ID (UID).
    """
    token = credentials.credentials
    try:
        # Decode and verify the token
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        # Block the request if the token is fake or expired
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )