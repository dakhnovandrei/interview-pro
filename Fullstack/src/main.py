import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from src.database import SessionLocal, engine
from src.models import Base, Users
from src.routers.auth import pwd_context
from src.routers.interview import interview_router
from src.routers.users import router
from src.routers.websocet import chat_router
from src.schemas import UserRoles
from src.storage import ensure_bucket_exists

load_dotenv()

Base.metadata.create_all(bind=engine)

SITE_URL = os.getenv("SITE_URL", "http://localhost:5173").rstrip("/")
INDEXABLE_ROUTES = [
    {"path": "/", "priority": "0.9", "changefreq": "weekly"},
    {"path": "/interview-templates", "priority": "1.0", "changefreq": "daily"},
]

app = FastAPI(title="Interview Pro API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:5176", "http://127.0.0.1:5176",
        "http://localhost", "http://127.0.0.1",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix='/api/v1', tags=["Users"])
app.include_router(chat_router, tags=["Chat"])
app.include_router(interview_router, prefix='/api/v3', tags=["Interview"])

logger = logging.getLogger("uvicorn")
logger.setLevel(logging.INFO)


def ensure_schema_updates():
    try:
        with engine.begin() as connection:
            if connection.dialect.name == "postgresql":
                connection.execute(text("ALTER TABLE interview ADD COLUMN IF NOT EXISTS description TEXT"))
    except Exception as e:
        logger.warning(f"Schema update skipped: {e}")


@app.get("/sitemap.xml", include_in_schema=False)
def sitemap():
    urls = "\n".join(
        f"""  <url>
    <loc>{SITE_URL}{route['path']}</loc>
    <changefreq>{route['changefreq']}</changefreq>
    <priority>{route['priority']}</priority>
  </url>"""
        for route in INDEXABLE_ROUTES
    )
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls}
</urlset>
"""
    return Response(content=xml, media_type="application/xml")


@app.get("/robots.txt", include_in_schema=False)
def robots():
    body = f"""User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /home
Disallow: /profile
Disallow: /interview
Disallow: /templates
Disallow: /templates/create
Disallow: /template/create

Sitemap: {SITE_URL}/sitemap.xml
"""
    return Response(content=body, media_type="text/plain")


@app.on_event("startup")
def on_startup():
    logger.info("=" * 50)
    logger.info("Application Starting Up")
    logger.info("=" * 50)

    db = SessionLocal()
    try:
        Base.metadata.create_all(bind=engine)
        ensure_schema_updates()

        try:
            ensure_bucket_exists()
        except Exception as e:
            logger.warning(f"MinIO initialization warning: {e}")

        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if admin_email and admin_password:
            existing_admin = db.query(Users).filter(Users.email == admin_email).first()
            if not existing_admin:
                password_bytes = admin_password.encode('utf-8')[:72]
                password_truncated = password_bytes.decode('utf-8', errors='ignore')
                admin_user = Users(
                    email=admin_email,
                    username="Admin",
                    password=pwd_context.hash(password_truncated),
                    role=UserRoles.ADMIN,
                    is_active=True,
                    subscription_type="Premium",
                )
                db.add(admin_user)
                db.commit()
    except Exception as e:
        logger.error(f"Startup error: {e}")
    finally:
        db.close()
