from pypdf import PdfReader
from google import genai
from google.genai import types
from dotenv import load_dotenv
from typing import List, Optional, Dict
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import io
import base64
import firebase_admin
from firebase_admin import credentials, auth

load_dotenv()

# Initialize Firebase Admin SDK
service_account_env = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
project_id_env = os.getenv("FIREBASE_PROJECT_ID") or os.getenv("VITE_FIREBASE_PROJECT_ID")

initialized = False

if service_account_env:
    try:
        service_account_info = None
        cleaned_env = service_account_env.strip()
        
        # Try to parse as raw JSON first
        try:
            service_account_info = json.loads(cleaned_env)
        except json.JSONDecodeError:
            # If parsing raw JSON fails, try base64 decoding
            try:
                decoded_bytes = base64.b64decode(cleaned_env)
                service_account_info = json.loads(decoded_bytes.decode("utf-8"))
            except Exception as b64_err:
                print(f"Warning: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON as JSON or Base64: {b64_err}")
        
        if service_account_info:
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
            initialized = True
        else:
            print("Warning: service_account_info could not be parsed.")
    except Exception as e:
        print(f"Warning: Firebase Admin SDK initialization failed: {e}")

if not initialized:
    try:
        # Initialize with explicit projectId options
        options = {}
        if project_id_env:
            options["projectId"] = project_id_env.strip()
        firebase_admin.initialize_app(options=options)
    except Exception as e:
        print(f"Warning: Firebase Admin SDK default initialization failed: {e}")

app = FastAPI()

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",  # vite preview
    "https://useapplyt.vercel.app",
]
if extra := os.getenv("ALLOWED_ORIGIN"):
    ALLOWED_ORIGINS.append(extra)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
MODEL_NAME = "gemini-3.1-flash-lite"

SYSTEM_INSTRUCTION = """Given a resume and job description, analyze the match.

- ats_keywords: hard skills only from jd (languages, frameworks, tools, certs) — no soft skills, no job logistics (duration/mode/pay). Max 15.
- topics_to_study: underlying concepts to learn, must NOT repeat ats_keywords terms. Max 8.
- resume_gaps: specific to THIS resume vs THIS JD, with actionable suggestion. Max 6.
- match_score: 0-100.
- summary: 1-2 sentences."""

# schema = contract. model forced to match this shape. no more markdown fences, no more broken json.
RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "ats_keywords": {"type": "array", "items": {"type": "string"}},
        "topics_to_study": {"type": "array", "items": {"type": "string"}},
        "resume_gaps": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "gap": {"type": "string"},
                    "suggestion": {"type": "string"}
                },
                "required": ["gap", "suggestion"]
            }
        },
        "match_score": {"type": "integer"},
        "summary": {"type": "string"}
    },
    "required": ["ats_keywords", "topics_to_study", "resume_gaps", "match_score", "summary"]
}


from collections import defaultdict
import time
import sys

# Simple in-memory rate limiter to protect against paid/free-tier LLM abuse.
ANALYZE_LIMIT = 10
ANALYZE_WINDOW = 60  # seconds
user_requests = defaultdict(list)

def check_rate_limit(user_id: str):
    now = time.time()
    user_requests[user_id] = [t for t in user_requests[user_id] if now - t < ANALYZE_WINDOW]
    if len(user_requests[user_id]) >= ANALYZE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait before running another analysis.")
    user_requests[user_id].append(now)


def get_client() -> genai.Client:
    api_key = os.getenv("google_api")
    if not api_key:
        print("Error: Missing google_api key in environment variables.")
        raise HTTPException(status_code=500, detail="Internal server configuration error.")
    return genai.Client(api_key=api_key)


def extract_resume_text(pdf_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        print(f"PDF extraction failed: {e}", file=sys.stderr)
        raise HTTPException(status_code=400, detail="Unable to extract text from resume.")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Resume PDF content is empty or unreadable.")

    return text.strip()


def analyze_resume(client: genai.Client, resume_text: str, jd_text: str) -> dict:
    input_text = (
        "***resume starts here***\n" + resume_text +
        "\n***jd starts here***\n" + jd_text
    )

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                max_output_tokens=4096,
                thinking_config=types.ThinkingConfig(thinking_level="low"),
                response_mime_type="application/json",
                response_schema=RESPONSE_SCHEMA,
            ),
            contents=input_text
        )
        raw_text = (response.text or "").strip()
        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        print(f"LLM invalid JSON response: {e}", file=sys.stderr)
        raise HTTPException(status_code=502, detail="Invalid analysis payload generated.")
    except Exception as e:
        print(f"LLM generation failed: {e}", file=sys.stderr)
        raise HTTPException(status_code=502, detail="Failed to run CV keyword matching analysis.")


# Firebase Authentication Dependency
async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is missing.")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token scheme. Must be Bearer token.")
    
    token = authorization.split("Bearer ")[1].strip()
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as e:
        import traceback
        print("--- FIREBASE AUTHENTICATION ERROR ---")
        traceback.print_exc()
        print("-------------------------------------")
        raise HTTPException(status_code=401, detail="Authentication failed: Invalid credentials.")


MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_JD_LENGTH = 20000

@app.post("/analyze")
async def analyze_endpoint(
    resume: UploadFile = File(...),
    jd_text: str = Form(...),
    user_id: str = Depends(get_current_user)
):
    check_rate_limit(user_id)

    jd_text = jd_text.strip()
    if not jd_text:
        raise HTTPException(status_code=400, detail="jd_text is required.")
    if len(jd_text) > MAX_JD_LENGTH:
        raise HTTPException(status_code=400, detail=f"Job description too long (Max {MAX_JD_LENGTH} characters).")

    # Content verification
    if resume.content_type != "application/pdf":
        if resume.filename and not resume.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF format is supported.")

    pdf_bytes = await resume.read()
    if len(pdf_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Resume size is too large (Max 10MB).")

    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid PDF document.")

    resume_text = extract_resume_text(pdf_bytes)

    client = get_client()
    result = analyze_resume(client, resume_text, jd_text)

    return result


# ── Postgres Database Setup & CRUD ──
import psycopg2
import psycopg2.extras
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

DATABASE_URL = os.getenv("DATABASE_URL")

def init_db():
    if not DATABASE_URL:
        print("Warning: DATABASE_URL environment variable is not set. Database not initialized.")
        return
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                company_name TEXT NOT NULL,
                job_title TEXT NOT NULL,
                jd_snippet TEXT NOT NULL,
                match_score INTEGER NOT NULL,
                ats_keywords TEXT NOT NULL,
                topics_to_study TEXT NOT NULL,
                resume_gaps TEXT NOT NULL,
                date_analyzed TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Saved',
                notes TEXT,
                user_id TEXT NOT NULL DEFAULT 'anonymous'
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error initializing Postgres database: {e}")

init_db()

class TrackerCreate(BaseModel):
    company_name: str
    job_title: str
    jd_snippet: str
    match_score: int
    ats_keywords: List[str]
    topics_to_study: List[str]
    resume_gaps: List[dict]
    notes: Optional[str] = None

class TrackerUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

VALID_STATUSES = {"Saved", "Applied", "Interviewing", "Offer", "Rejected"}

def get_db_connection():
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL environment variable is not configured.")
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.DictCursor)
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed.")

@app.post("/tracker")
async def create_tracker_endpoint(payload: TrackerCreate, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    try:
        cursor.execute(
            """
            INSERT INTO applications 
            (company_name, job_title, jd_snippet, match_score, ats_keywords, topics_to_study, resume_gaps, date_analyzed, status, notes, user_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Saved', %s, %s)
            RETURNING id
            """,
            (
                payload.company_name,
                payload.job_title,
                payload.jd_snippet,
                payload.match_score,
                json.dumps(payload.ats_keywords),
                json.dumps(payload.topics_to_study),
                json.dumps(payload.resume_gaps),
                date_str,
                payload.notes,
                user_id
            )
        )
        new_id = cursor.fetchone()[0]
        conn.commit()
        return {"id": new_id, "status": "Saved", "date_analyzed": date_str}
    except Exception as e:
        conn.rollback()
        print(f"Error creating tracker: {e}")
        raise HTTPException(status_code=500, detail="Failed to create tracker entry.")
    finally:
        cursor.close()
        conn.close()

@app.get("/tracker")
async def list_trackers_endpoint(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM applications WHERE user_id = %s ORDER BY id DESC", (user_id,))
        rows = cursor.fetchall()
        
        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "company_name": r["company_name"],
                "job_title": r["job_title"],
                "jd_snippet": r["jd_snippet"],
                "match_score": r["match_score"],
                "ats_keywords": json.loads(r["ats_keywords"]),
                "topics_to_study": json.loads(r["topics_to_study"]),
                "resume_gaps": json.loads(r["resume_gaps"]),
                "date_analyzed": r["date_analyzed"],
                "status": r["status"],
                "notes": r["notes"]
            })
        return result
    except Exception as e:
        print(f"Error listing trackers: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve tracker entries.")
    finally:
        cursor.close()
        conn.close()

@app.get("/tracker/{app_id}")
async def get_tracker_endpoint(app_id: int, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM applications WHERE id = %s AND user_id = %s", (app_id, user_id))
        r = cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Application not found")
            
        return {
            "id": r["id"],
            "company_name": r["company_name"],
            "job_title": r["job_title"],
            "jd_snippet": r["jd_snippet"],
            "match_score": r["match_score"],
            "ats_keywords": json.loads(r["ats_keywords"]),
            "topics_to_study": json.loads(r["topics_to_study"]),
            "resume_gaps": json.loads(r["resume_gaps"]),
            "date_analyzed": r["date_analyzed"],
            "status": r["status"],
            "notes": r["notes"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting tracker: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve tracker entry.")
    finally:
        cursor.close()
        conn.close()

@app.patch("/tracker/{app_id}")
async def update_tracker_endpoint(app_id: int, payload: TrackerUpdate, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM applications WHERE id = %s AND user_id = %s", (app_id, user_id))
        r = cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Application not found")
            
        updates = []
        params = []
        if payload.status is not None:
            if payload.status not in VALID_STATUSES:
                raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {VALID_STATUSES}")
            updates.append("status = %s")
            params.append(payload.status)
            
        if payload.notes is not None:
            updates.append("notes = %s")
            params.append(payload.notes)
            
        if updates:
            params.append(app_id)
            params.append(user_id)
            cursor.execute(f"UPDATE applications SET {', '.join(updates)} WHERE id = %s AND user_id = %s", tuple(params))
            conn.commit()
            
        return {"message": "Updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"Error updating tracker: {e}")
        raise HTTPException(status_code=500, detail="Failed to update tracker entry.")
    finally:
        cursor.close()
        conn.close()

@app.delete("/tracker/{app_id}")
async def delete_tracker_endpoint(app_id: int, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM applications WHERE id = %s AND user_id = %s", (app_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Application not found")
            
        cursor.execute("DELETE FROM applications WHERE id = %s AND user_id = %s", (app_id, user_id))
        conn.commit()
        return {"message": "Deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"Error deleting tracker: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete tracker entry.")
    finally:
        cursor.close()
        conn.close()