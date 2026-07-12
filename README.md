# Applyt

Applyt is a job-application portfolio product designed to help candidates analyze and optimize their resumes against specific role descriptions, extract missing keywords, flag skill gaps, and track logged applications in an interview pipeline.

## Tech Stack

- **Backend**: FastAPI (Python), SQLite database, Firebase Admin SDK (token verification).
- **Frontend**: React (TypeScript), Vite, TailwindCSS, Firebase Client SDK (Google Sign-In).

## Setup Instructions

### 1. Backend Setup

1. Navigate to the root directory and create a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in the required environment variables:
   - `google_api`: Your Google Gemini API key.
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: The raw JSON credentials dictionary (or base64 encoded JSON) of your Firebase Service Account.
   - `FIREBASE_PROJECT_ID`: Your Firebase Project ID.
4. Run the FastAPI development server:
   ```bash
   uvicorn prod:app --reload
   ```

### 2. Frontend Setup

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure the Firebase Web Client details:
   - `VITE_API_BASE_URL`: URL of the running FastAPI server.
   - `VITE_FIREBASE_API_KEY`: Firebase API Key.
   - `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID.
   - `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain.
   - `VITE_FIREBASE_APP_ID`: Firebase App ID.
4. Start the Vite client dev server:
   ```bash
   npm run dev
   ```
