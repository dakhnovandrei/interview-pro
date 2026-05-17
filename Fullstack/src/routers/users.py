import logging
import os
from datetime import timedelta

import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session
from starlette import status

from src.database import get_db
from src.models import Users
from src.routers.auth import check_admin, create_access_token, create_refresh_token, decode_token, get_current_user, pwd_context
from src.schemas import (
    AssignRoleRequest,
    AuthResponse,
    PhotoDeleteResponse,
    PhotoUploadResponse,
    RegResponse,
    RoleAssignmentResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from src.storage import delete_photo, ensure_bucket_exists, upload_photo

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "30"))

router = APIRouter()
logger = logging.getLogger("uvicorn")
logger.setLevel(logging.INFO)


@router.post("/reg", tags=["Auth"])
def register(user: UserCreate, db: Session = Depends(get_db)):
    exist_user = db.query(Users).filter(Users.email == user.email).first()
    if exist_user:
        raise HTTPException(status_code=401, detail="Пользователь уже зарегистрирован")

    password_bytes = user.password.encode('utf-8')[:72]
    password_truncated = password_bytes.decode('utf-8', errors='ignore')
    new_user = Users(
        email=user.email,
        username=user.username,
        password=pwd_context.hash(password_truncated),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "User_id": new_user.user_id}


@router.post("/login", summary="login in account")
def login(users: UserLogin, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(Users).filter(Users.email == users.email).first()
    if not user or not pwd_context.verify(users.password, user.password):
        raise HTTPException(status_code=401, detail="Неправильная почта или пароль")

    access_token = create_access_token(
        data={
            'sub': user.email,
            'id': user.user_id,
            'role': user.role.value if user.role else 'guest',
            'username': user.username,
            'email': user.email,
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(
        data={
            'sub': user.email,
            'id': user.user_id,
            'role': user.role.value if user.role else 'guest',
            'username': user.username,
        },
        expires_delta=timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES),
    )
    response.set_cookie("access_token", f"Bearer {access_token}", httponly=True, max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, secure=False, samesite="lax")
    response.set_cookie("refresh_token", f"Bearer {refresh_token}", httponly=True, max_age=REFRESH_TOKEN_EXPIRE_MINUTES * 60, secure=False, samesite="lax")
    return AuthResponse(access_token=access_token, refresh_token=refresh_token)


@router.get("/profile", summary="get current user profile", response_model=UserResponse)
def get_current_profile(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.user_id == current_user.user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/profile/{user_id}", summary="profile base page", response_model=UserResponse)
def profile(user_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.user_id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post('/retry', summary="create new access from refresh token", response_model=AuthResponse)
def retry(response: Response, refresh_token: str = Cookie(..., alias='refresh_token')):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token не найден")

    try:
        payload = decode_token(refresh_token)
        email = payload.get('sub')
        user_id = payload.get('id')
        if not email or not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неправильный рефреш токен")

        db_session = next(get_db())
        user = db_session.query(Users).filter(Users.user_id == user_id).first()
        role = user.role.value if user and user.role else 'guest'
        username = user.username if user else email.split('@')[0]

        access_token = create_access_token(
            data={"sub": email, "id": user_id, "role": role, "username": username, "email": email},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        new_refresh_token = create_refresh_token(
            data={"sub": email, "id": user_id, "role": role, "username": username},
            expires_delta=timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES),
        )
        response.set_cookie("access_token", f"Bearer {access_token}", httponly=True, secure=False, samesite='lax', max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        response.set_cookie("refresh_token", f"Bearer {new_refresh_token}", httponly=True, secure=False, samesite='lax', max_age=REFRESH_TOKEN_EXPIRE_MINUTES * 60)
        return AuthResponse(access_token=access_token, refresh_token=new_refresh_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Рефреш токен просрочен")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Невалидный рефреш токен")


@router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.get('/me')
def me(user=Depends(get_current_user)):
    return user


@router.post("/admin/assign-role", summary="Assign role to user (Admin only)", response_model=RoleAssignmentResponse)
def assign_role(request: AssignRoleRequest, current_admin: Users = Depends(check_admin), db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.user_id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user.role = request.role
    db.commit()
    db.refresh(user)
    logger.info(f"Admin {current_admin.email} assigned role {request.role.value} to user {user.email}")
    return RoleAssignmentResponse(
        message="Роль успешно назначена",
        user_id=user.user_id,
        new_role=request.role.value,
        assigned_by=current_admin.email,
    )


@router.get("/admin/users", summary="Get all users (Admin only)", tags=["Admin"])
def get_all_users(current_admin: Users = Depends(check_admin), db: Session = Depends(get_db)):
    users = db.query(Users).all()
    return [
        {
            "user_id": user.user_id,
            "email": user.email,
            "username": user.username,
            "role": user.role.value if user.role else "guest",
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
        for user in users
    ]


@router.get("/admin/user/{user_id}", summary="Get user details (Admin only)", tags=["Admin"])
def get_user_details(user_id: int, current_admin: Users = Depends(check_admin), db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    return {
        "user_id": user.user_id,
        "email": user.email,
        "username": user.username,
        "role": user.role.value if user.role else "guest",
        "subscription_type": user.subscription_type,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


@router.post("/upload-photo", summary="Upload user profile photo", response_model=PhotoUploadResponse)
async def upload_user_photo(file: UploadFile = File(...), current_user: Users = Depends(get_current_user), db: Session = Depends(get_db)):
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File size exceeds 5MB limit")
    if file.content_type not in {"image/jpeg", "image/png", "image/jpg"}:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only JPG and PNG files are allowed")

    try:
        ensure_bucket_exists()
        photo_url = upload_photo(contents, file.filename, current_user.user_id)
        user = db.query(Users).filter(Users.user_id == current_user.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.photo_url = photo_url
        db.commit()
        db.refresh(user)
        return PhotoUploadResponse(message="Photo uploaded successfully", photo_url=photo_url, user_id=current_user.user_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to upload photo: {str(e)}")


@router.delete("/delete-photo", summary="Delete user profile photo", response_model=PhotoDeleteResponse)
async def delete_user_photo(current_user: Users = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        ensure_bucket_exists()
        delete_photo(current_user.user_id)
        user = db.query(Users).filter(Users.user_id == current_user.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.photo_url = None
        db.commit()
        db.refresh(user)
        return PhotoDeleteResponse(message="Photo deleted successfully", user_id=current_user.user_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete photo: {str(e)}")
