import os
from typing import Dict

import httpx

LLAMA_URL = os.getenv("LLAMA_URL", "http://localhost:11434/api/chat")


class LLamaInterviewAI:
    def __init__(self, interview_type: str, position: str, company: str):
        self.interview_type = interview_type
        self.position = position
        self.company = company
        self.system_prompt = f"""
        Ты — опытный IT специалист, проводящий {self.interview_type} собеседование
        на позицию: {self.position} в компанию: {self.company}.

        Правила:
        - Общайся строго на русском языке
        - Используй профессиональный, уверенный тон
        - Вопросы должны быть релевантными позиции
        - Учитывай предыдущие ответы кандидата
        - Продолжай интервью, никогда не начинай заново
        - Не разъясняй правил кандидату
        - Если кандидат уклоняется — мягко возвращай его к теме
        - Не вставляй подсказки для модели
        - Если Интервью подходит к концу, предложи кандидату завершить беседу и дай ему возможность задать вопросы
        - При Technical/Coding интервью задавай практические задачи и проси кандидата объяснить свои решения
        - При Behavioral интервью фокусируйся на опыте кандидата, его подходе к решению проблем и коммуникационных навыках
        - При System Design интервью оценивай способность кандидата проектировать масштабируемые и надежные системы
        - Всегда адаптируй вопросы в зависимости от ответов кандидата
        """
        self.conversation_history: list[Dict] = []

    async def ask(self, user_message: str) -> str:
        self.conversation_history.append({"role": "user", "content": user_message})
        messages = [{"role": "system", "content": self.system_prompt}]
        for msg in self.conversation_history[-24:]:
            messages.append({"role": msg['role'], "content": msg["content"]})

        payload = {
            "model": "llama3:8b",
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.6,
                "top_p": 0.9,
                "num_ctx": 4096,
                "repeat_penalty": 1.1,
            },
        }

        async with httpx.AsyncClient(timeout=60) as client:
            try:
                response = await client.post(LLAMA_URL, json=payload)
                response.raise_for_status()
                assistant_text = response.json()["message"]["content"]
                self.conversation_history.append({"role": "assistant", "content": assistant_text})
                return assistant_text
            except Exception as e:
                return f"Ошибка обращения к ai {e}"

    async def evaluate(self) -> str:
        evaluation_prompt = """
        Ты — опытный IT-рекрутер и эксперт по оценке собеседований.
        На основе предыдущей беседы дай вывод по кандидату:
        1) краткий итог интервью
        2) сильные стороны
        3) слабые стороны
        4) рекомендации по улучшению
        5) оценку по шкале от 1 до 10
        Отвечай на русском языке.
        """

        messages = [{"role": "system", "content": evaluation_prompt}]
        for msg in self.conversation_history[-64:]:
            messages.append({"role": msg['role'], "content": msg['content']})
        messages.append({
            "role": "user",
            "content": "Пожалуйста, оцени ответы кандидата и дай краткий фидбек по собеседованию.",
        })

        payload = {
            "model": "llama3:8b",
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "num_ctx": 4096,
                "repeat_penalty": 1.1,
            },
        }

        async with httpx.AsyncClient(timeout=60) as client:
            try:
                response = await client.post(LLAMA_URL, json=payload)
                response.raise_for_status()
                return response.json()["message"]["content"]
            except Exception as e:
                return f"Ошибка оценки интервью: {e}"
