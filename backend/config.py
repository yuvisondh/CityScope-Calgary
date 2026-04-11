# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

# LLM Provider: "huggingface" or "groq"
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "huggingface")

# HuggingFace settings
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_MODEL = os.getenv("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")

# Groq settings (fallback provider)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///projects.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Beltline bounding box (SW corner to NE corner)
BELTLINE_BOUNDS = {
    "sw_lat": 51.035,
    "sw_lng": -114.085,
    "ne_lat": 51.048,
    "ne_lng": -114.055,
}
