from datetime import datetime
from typing import Dict

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from src.ML.model import LLamaInterviewAI
from src.database import get_db
from src.models import InterviewSessions, Messages

chat_router = APIRouter(prefix='/ws/v1')


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.ai_session: Dict[int, LLamaInterviewAI] = {}

    async def connect(self, websocket: WebSocket, session_id: int):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: int):
        self.active_connections.pop(session_id, None)

    async def send_personal_message(self, session_id: int, message: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(message)


manager = ConnectionManager()
EVALUATION_TERMS = {"конец", "end", "выход", "finish", "завершить", "stop", "стоп"}


async def get_session_info(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSessions).filter(InterviewSessions.interview_id == session_id).first()
    if not session:
        return None
    return {
        "interview_type": session.interview_type,
        "position": session.job_position,
        "company": session.company,
        "user_id": session.user_id,
    }


async def save_message_to_db(session_id: int, content: str, is_user: bool, db: Session):
    try:
        message = Messages(session_id=session_id, content=content, is_user=is_user)
        db.add(message)
        db.commit()
    except Exception:
        db.rollback()


async def finalize_session(session_id: int, db: Session, ai: LLamaInterviewAI):
    feedback = await ai.evaluate()
    try:
        session = db.query(InterviewSessions).filter(InterviewSessions.interview_id == session_id).first()
        if session:
            session.finished_at = datetime.utcnow()
            session.status = 'finished'
            session.feedback = feedback
            db.commit()
    except Exception:
        db.rollback()
    return feedback


@chat_router.websocket("/interview/{session_id}")
async def websocket_endpoint(session_id: int, websocket: WebSocket, db: Session = Depends(get_db)):
    await manager.connect(websocket, session_id)
    try:
        session_info = await get_session_info(session_id, db)
        if not session_info:
            await websocket.send_json({"type": "error", "content": "Сессия не найдена"})
            await websocket.close(code=1008, reason="Сессия не найдена")
            return

        if session_id not in manager.ai_session:
            manager.ai_session[session_id] = LLamaInterviewAI(
                interview_type=session_info["interview_type"],
                position=session_info["position"],
                company=session_info["company"],
            )

        ai = manager.ai_session[session_id]
        await websocket.send_json({
            "type": "system_message",
            "content": f"Начало {session_info['interview_type']} собеседования на позицию: {session_info['position']} в {session_info['company']}",
            "timestamp": datetime.utcnow().isoformat(),
        })

        while True:
            message_data = await websocket.receive_json()
            user_message = message_data.get('content', '')

            if user_message.strip().lower() in EVALUATION_TERMS:
                evaluation = await finalize_session(session_id, db, ai)
                await save_message_to_db(session_id, user_message, True, db)
                await save_message_to_db(session_id, evaluation, False, db)
                await manager.send_personal_message(session_id, {
                    "type": "evaluation",
                    "content": evaluation,
                    "timestamp": datetime.utcnow().isoformat(),
                })
                await websocket.close(code=1000, reason="Interview finished")
                return

            ai_response = await ai.ask(user_message) or "Модель ничего не вернула"
            await save_message_to_db(session_id, user_message, True, db)
            await save_message_to_db(session_id, ai_response, False, db)
            await manager.send_personal_message(session_id, {
                "type": "ai_message",
                "content": ai_response,
                "timestamp": datetime.utcnow().isoformat(),
            })
    except WebSocketDisconnect:
        if session_id in manager.ai_session:
            try:
                await finalize_session(session_id, db, manager.ai_session[session_id])
            except Exception:
                pass
    finally:
        manager.disconnect(session_id)
