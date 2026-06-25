# SaathiTrip Backend & Web App

This is the codebase for SaathiTrip, a verified travel companion platform. 
It features a Flask backend that handles secure Email and Mobile OTP authentication, and an HTML/JS frontend that interacts with these APIs.

## Setup Instructions for Local Development

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory and add the following keys for Email OTP delivery:
   ```env
   SMTP_EMAIL=your_gmail_address
   SMTP_PASSWORD=your_google_app_password
   ```

3. **Run the server:**
   ```bash
   python server.py
   ```
   The app will run at `http://localhost:8000`.

## Deployment (Render.com)

1. Connect this repository to Render as a **Web Service**.
2. **Build Command:** `pip install -r requirements.txt`
3. **Start Command:** `gunicorn server:app`
4. Add your `.env` variables to Render's Environment Variables section.
