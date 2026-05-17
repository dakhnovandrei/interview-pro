import asyncio
import os
import tempfile
import unittest
from datetime import timedelta
from unittest.mock import patch

os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("REFRESH_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("ADMIN_EMAIL", "admin@test.local")
os.environ.setdefault("ADMIN_PASSWORD", "admin123456")
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.gettempdir()}/interview_pro_test.db"
os.environ.setdefault("LLAMA_URL", "http://ollama.test/api/chat")

from fastapi.testclient import TestClient

from src.ML.model import LLamaInterviewAI
from src.database import SessionLocal, engine
from src.main import app
from src.models import Base, Users
from src.routers.auth import create_access_token, pwd_context
from src.schemas import UserRoles


class BackendMinimalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()

        self.admin = Users(
            email="admin@test.local",
            username="Admin",
            password=pwd_context.hash("admin123456"),
            role=UserRoles.ADMIN,
            is_active=True,
        )
        self.user = Users(
            email="user@test.local",
            username="User",
            password=pwd_context.hash("user123456"),
            role=UserRoles.CANDIDATE,
            is_active=True,
        )
        self.db.add_all([self.admin, self.user])
        self.db.commit()
        self.db.refresh(self.admin)
        self.db.refresh(self.user)

    def tearDown(self):
        self.db.close()

    def cookie_for(self, user):
        token = create_access_token(
            {
                "sub": user.email,
                "id": user.user_id,
                "role": user.role.value,
                "username": user.username,
                "email": user.email,
            },
            expires_delta=timedelta(minutes=30),
        )
        return {"access_token": f"Bearer {token}"}

    def test_service_layer_ollama_success_and_failure(self):
        class OkResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"message": {"content": "Следующий вопрос"}}

        class OkClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def post(self, *args, **kwargs):
                return OkResponse()

        class FailingClient(OkClient):
            async def post(self, *args, **kwargs):
                raise TimeoutError("ollama timeout")

        with patch("src.ML.model.httpx.AsyncClient", OkClient):
            ai = LLamaInterviewAI("technical", "Python developer", "ACME")
            self.assertEqual(asyncio.run(ai.ask("Привет")), "Следующий вопрос")
            self.assertEqual(ai.conversation_history[-1]["role"], "assistant")

        with patch("src.ML.model.httpx.AsyncClient", FailingClient):
            ai = LLamaInterviewAI("technical", "Python developer", "ACME")
            self.assertIn("Ошибка обращения к ai", asyncio.run(ai.ask("Привет")))

    def test_public_seo_and_validation_errors(self):
        sitemap = self.client.get("/sitemap.xml")
        self.assertEqual(sitemap.status_code, 200)
        self.assertIn("/interview-templates", sitemap.text)

        robots = self.client.get("/robots.txt")
        self.assertEqual(robots.status_code, 200)
        self.assertIn("Disallow: /admin", robots.text)

        invalid = self.client.post("/api/v1/reg", json={"email": "bad", "username": "u", "password": "123"})
        self.assertEqual(invalid.status_code, 422)

        missing_auth = self.client.get("/api/v1/profile")
        self.assertEqual(missing_auth.status_code, 401)

    def test_auth_role_crud_pagination_and_forbidden(self):
        forbidden = self.client.post(
            "/api/v3/interviews/templates",
            cookies=self.cookie_for(self.user),
            json={"name": "Denied", "job_position": "QA", "company": "ACME", "interview_type": "technical"},
        )
        self.assertEqual(forbidden.status_code, 403)

        created = self.client.post(
            "/api/v3/interviews/templates",
            cookies=self.cookie_for(self.admin),
            json={
                "name": "Backend template",
                "job_position": "Backend Developer",
                "company": "ACME",
                "interview_type": "technical",
                "description": "API and database interview",
            },
        )
        self.assertEqual(created.status_code, 200)

        listed = self.client.get("/api/v3/interviews?is_template=true&page=1&page_size=1&sort_by=created_at&sort_order=desc")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed.json()["page_size"], 1)

        started = self.client.post("/api/v3/interviews/1/start", cookies=self.cookie_for(self.user))
        self.assertEqual(started.status_code, 200)
        self.assertIn("session_id", started.json())

    def test_files_and_admin_role_assignment_with_mocks(self):
        with patch("src.routers.users.ensure_bucket_exists", return_value=True), patch(
            "src.routers.users.upload_photo", return_value="http://storage.test/photo.png"
        ):
            uploaded = self.client.post(
                "/api/v1/upload-photo",
                cookies=self.cookie_for(self.user),
                files={"file": ("avatar.png", b"png-data", "image/png")},
            )
        self.assertEqual(uploaded.status_code, 200)
        self.assertEqual(uploaded.json()["photo_url"], "http://storage.test/photo.png")

        rejected = self.client.post(
            "/api/v1/upload-photo",
            cookies=self.cookie_for(self.user),
            files={"file": ("avatar.gif", b"gif-data", "image/gif")},
        )
        self.assertEqual(rejected.status_code, 415)

        role_update = self.client.post(
            "/api/v1/admin/assign-role",
            cookies=self.cookie_for(self.admin),
            json={"user_id": self.user.user_id, "role": "moderator"},
        )
        self.assertEqual(role_update.status_code, 200)
        self.assertEqual(role_update.json()["new_role"], "moderator")


if __name__ == "__main__":
    unittest.main()
