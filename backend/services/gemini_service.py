import base64
import json
from typing import AsyncGenerator, List

import google.generativeai as genai

from config import GEMINI_API_KEY, MODEL_NAME, TEMPERATURE, MAX_OUTPUT_TOKENS
from models.schemas import MessageSchema, FileAttachment
from services.prompt_builder import build_system_prompt

genai.configure(api_key=GEMINI_API_KEY)


def _build_history(messages: List[MessageSchema]) -> list:
    """Convert chat history to Gemini Content format."""
    history = []
    for msg in messages:
        history.append({
            "role": "user" if msg.role == "user" else "model",
            "parts": [{"text": msg.content}],
        })
    return history


def _build_current_parts(query: str, attachments: List[FileAttachment]) -> list:
    """Build parts list for the current user turn (text + optional files)."""
    parts: list = [{"text": query}]

    for file in attachments:
        # Strip data URI prefix if present: "data:mime/type;base64,<data>"
        raw = file.data.split(",")[1] if "," in file.data else file.data
        try:
            decoded = base64.b64decode(raw)
        except Exception:
            continue  # skip malformed attachment silently

        parts.append({
            "inline_data": {
                "mime_type": file.type,
                "data": decoded,
            }
        })

    return parts


async def stream_legal_response(
    query: str,
    history: List[MessageSchema],
    role: str,
    attachments: List[FileAttachment],
) -> AsyncGenerator[str, None]:
    """
    Async generator that yields SSE-formatted strings.

    Each chunk:  data: {"chunk": "..."}\n\n
    Terminator:  data: [DONE]\n\n
    On error:    data: {"error": "..."}\n\n  followed by [DONE]
    """
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=build_system_prompt(role),
        generation_config=genai.types.GenerationConfig(
            temperature=TEMPERATURE,
            max_output_tokens=MAX_OUTPUT_TOKENS,
        ),
    )

    contents = _build_history(history)
    contents.append({
        "role": "user",
        "parts": _build_current_parts(query, attachments),
    })

    try:
        response = model.generate_content(contents, stream=True)

        for chunk in response:
            text = getattr(chunk, "text", None)
            if text:
                yield f"data: {json.dumps({'chunk': text})}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as exc:
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        yield "data: [DONE]\n\n"
