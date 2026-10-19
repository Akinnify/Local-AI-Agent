from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import AIMessageChunk
from agent import agent

app = FastAPI(title="Local AI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # later: your deployed frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str      # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []

class ChatResponse(BaseModel):
    reply: str

def build_messages(req: ChatRequest):
    messages = [m.model_dump() for m in req.history]
    messages.append({"role": "user", "content": req.message})
    return messages

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        result = agent.invoke({"messages": build_messages(req)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"reply": result["messages"][-1].content}

@app.post("/chat/stream")
def chat_stream(req: ChatRequest):
    messages = build_messages(req)

    def token_stream():
        try:
            for chunk, _meta in agent.stream(
                {"messages": messages}, stream_mode="messages"
            ):
                # keep only the model's written answer: skip tool results
                # and the empty chunks that carry tool-call instructions
                if (
                    isinstance(chunk, AIMessageChunk)
                    and isinstance(chunk.content, str)
                    and chunk.content
                    and not chunk.tool_call_chunks
                ):
                    yield chunk.content
        except Exception as e:
            yield f"\n\n[Error: {e}]"

    return StreamingResponse(
        token_stream(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )