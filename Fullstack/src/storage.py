import io
import logging
import os
from datetime import timedelta

from dotenv import load_dotenv
from minio import Minio
from minio.error import S3Error

load_dotenv()

logger = logging.getLogger("uvicorn")

MINIO_URL = os.getenv("MINIO_URL", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "user-photos")
MINIO_REGION = os.getenv("MINIO_REGION", "us-east-1")

minio_client = None


def init_minio_client():
    global minio_client
    try:
        url_parts = MINIO_URL.replace("https://", "").replace("http://", "")
        secure = MINIO_URL.startswith("https://")
        minio_client = Minio(url_parts, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=secure)
        return True
    except Exception as e:
        logger.error(f"Failed to initialize MinIO client: {e}")
        minio_client = None
        return False


if not minio_client:
    init_minio_client()


def ensure_bucket_exists():
    if not minio_client:
        raise Exception("MinIO client not initialized")
    exists = minio_client.bucket_exists(MINIO_BUCKET_NAME)
    if not exists:
        minio_client.make_bucket(MINIO_BUCKET_NAME, location=MINIO_REGION)
    return True


def upload_photo(file_bytes: bytes, filename: str, user_id: int) -> str:
    if not minio_client:
        raise Exception("MinIO client not initialized")

    file_ext = os.path.splitext(filename)[1].lower()
    object_name = f"users/{user_id}/profile{file_ext}"
    content_type = "image/jpeg" if file_ext in ['.jpg', '.jpeg'] else "image/png"
    minio_client.put_object(
        MINIO_BUCKET_NAME,
        object_name,
        io.BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type,
    )
    return minio_client.get_presigned_url('GET', MINIO_BUCKET_NAME, object_name, expires=timedelta(days=7))


def delete_photo(user_id: int) -> bool:
    if not minio_client:
        raise Exception("MinIO client not initialized")

    prefix = f"users/{user_id}/"
    deleted_count = 0
    try:
        for obj in minio_client.list_objects(MINIO_BUCKET_NAME, prefix=prefix):
            minio_client.remove_object(MINIO_BUCKET_NAME, obj.object_name)
            deleted_count += 1
    except S3Error as e:
        raise Exception(f"Failed to delete photo: {str(e)}")
    return deleted_count > 0


def get_photo_url(user_id: int) -> str:
    return f"{MINIO_URL}/{MINIO_BUCKET_NAME}/users/{user_id}/profile"
