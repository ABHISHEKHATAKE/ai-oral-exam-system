from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.models.schemas import Token, SignUp
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token
)
from app.core.config import get_settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()

# In-memory user database (replace with real database)
users_db = {
    "instructor@university.edu": {
        "username": "instructor@university.edu",
        "hashed_password": "$2b$12$example_bcrypt_hash",
        "role": "instructor"
    }
}

@router.post("/signup")
def signup(request: SignUp):
    """Register a new user"""
    if request.username in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    if request.role not in ["instructor", "student"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'instructor' or 'student'"
        )
    
    hashed_password = get_password_hash(request.password)
    users_db[request.username] = {
        "username": request.username,
        "hashed_password": hashed_password,
        "role": request.role
    }
    
    return {"message": "User created successfully", "username": request.username}

@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get access token"""
    user = users_db.get(form_data.username)
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}