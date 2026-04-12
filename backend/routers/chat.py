from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest
from services.gemini_service import stream_legal_response

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
async def chat(req: ChatRequest):
    """
    Stream AI response as Server-Sent Events.

    Frontend reads chunks via:
        const reader = response.body.getReader()
    Each line: `data: {"chunk": "..."}\\n\\n`
    End signal: `data: [DONE]\\n\\n`
    """
    return StreamingResponse(
        stream_legal_response(
            query=req.query,
            history=req.history,
            role=req.role,
            attachments=req.attachments,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",   # disable nginx buffering for SSE
        },
    )
