"""
StudyAgent — FastAPI Backend
Serves the frontend and provides an /api/explain endpoint
that calls Ollama with the selected model for any subject.
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from ollama import chat


app = FastAPI()


# ── Dynamic system prompt (mirrors main.py) ──
def build_system_prompt(subject: str) -> str:
    return f"""You are a friendly and knowledgeable professor explaining the subject "{subject}" 
to an engineering/college student who is preparing for their semester exam.

When given a topic, always explain it in this structure:

1. 📖 Simple Definition  
   Explain what the topic is in plain, everyday English. No jargon without explanation.

2. ⚙️ How It Works  
   Break it down step by step if needed. Keep it logical and easy to follow.

3. 🌍 Real-Life Examples (at least 2)  
   Use examples from daily life — food, sports, college, phones, traffic, shopping, etc.
   Make the student think "Oh! I've seen this before."

4. 💡 Why It Matters  
   Explain why this topic is important in {subject} and the real world.

5. 🔑 Key Takeaway  
   A 2-3 line summary the student can quickly revise before the exam.

Rules:
- Language should be simple but accurate.
- Be thorough — this is for exam note-making, not a quick chat.
- Do NOT use JSON. Write clean, readable text with headings.
- Adapt your examples and depth to the subject: {subject}.
- If the topic has formulas or algorithms, explain them in plain words first, then show them."""


class ExplainRequest(BaseModel):
    unit: str
    topic: str
    subject: str = "General Studies"
    model: str = "gemma4:31b-cloud"


@app.post("/api/explain")
async def explain_topic(req: ExplainRequest):
    """Call Ollama with the chosen model and return the explanation."""
    system_prompt = build_system_prompt(req.subject)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": f"Explain this topic for my semester exam: {req.topic} (from {req.unit})"}
    ]

    try:
        response = chat(model=req.model, messages=messages)
        explanation = response.message.content.strip()
        return {"ok": True, "explanation": explanation}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get("/")
async def serve_index():
    return FileResponse("frontend/index.html")


# ── Serve frontend static files (must be after route definitions) ──
app.mount("/", StaticFiles(directory="frontend"), name="static")
