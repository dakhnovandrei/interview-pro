import datetime
import os

from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import ValidationError
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Users
from src.schemas import UserRoles

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_refresh_token(data: dict, expires_delta: datetime.timedelta | None = None):
    to_encode = data.copy()
    to_encode.update({"type": "refresh"})
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES))
    to_encode.update({'exp': expire})
    return jwt.encode(to_encode, SECRET_KEY, ALGORITHM)


def create_access_token(data: dict, expires_delta: datetime.timedelta) -> str:
    to_encode = data.copy()
    to_encode.update({"type": "access"})
    expire = datetime.datetime.utcnow() + expires_delta
    to_encode.update({'exp': expire})
    return jwt.encode(to_encode, SECRET_KEY, ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token.replace("Bearer ", ""), SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(access_token: str = Cookie(None), db: Session = Depends(get_db)) -> Users:
    if not access_token:
        raise HTTPException(status_code=401, detail="Токен отсутствует")

    try:
        payload = decode_token(access_token)
        user_id = payload.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Неверный токен")

        user = db.query(Users).filter(Users.user_id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Пользователь не найден")
        return user
    except (JWTError, ValidationError):
        raise HTTPException(status_code=401, detail="Неверный токен")


def check_admin(current_user: Users = Depends(get_current_user)) -> Users:
    if current_user.role not in [UserRoles.ADMIN, UserRoles.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администратор может выполнить это действие"
        )
    return current_user
