from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from web_search import web_search
from ai import ask_ai
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone
import psycopg2
import os
import traceback
import secrets
import hashlib
import smtplib

app = Flask(__name__)
CORS(app)
FRONTEND_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"), port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "Magnum_ai"), user=os.getenv("DB_USER", "postgres"),
        password=os.environ["DB_PASSWORD"],
    )


def send_otp_email(email, otp):
    address = os.environ["EMAIL_ADDRESS"]
    message = EmailMessage()
    message["Subject"] = "MAGNUM AI - Password Reset OTP"
    message["From"] = address
    message["To"] = email
    message.set_content(f"Your MAGNUM AI password-reset OTP is {otp}. It expires in 10 minutes.")
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(address, os.environ["EMAIL_PASSWORD"])
        server.send_message(message)


@app.route("/")
def index(): return send_from_directory(FRONTEND_FOLDER, "login.html")
@app.route("/<path:filename>")
def frontend_files(filename): return send_from_directory(FRONTEND_FOLDER, filename)


@app.route("/api/test-db")
def test_db():
    try:
        with get_db_connection() as conn, conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM users")
            return jsonify(message="Database connected successfully", users=cursor.fetchone()[0])
    except Exception as error:
        return jsonify(message="Database connection failed", error=str(error)), 500


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name, email, password = data.get("name", "").strip(), data.get("email", "").strip().lower(), data.get("password", "")
    if not name or not email or not password: return jsonify(message="All fields are required"), 400
    if len(password) < 8: return jsonify(message="Password must be at least 8 characters"), 400
    try:
        with get_db_connection() as conn, conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone(): return jsonify(message="Email already registered"), 409
            cursor.execute("INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)", (name, email, generate_password_hash(password)))
        return jsonify(message="Account created successfully"), 201
    except Exception:
        traceback.print_exc()
        return jsonify(message="Registration failed"), 500


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email, password = data.get("email", "").strip().lower(), data.get("password", "")
    if not email or not password: return jsonify(message="Email and password are required"), 400
    try:
        with get_db_connection() as conn, conn.cursor() as cursor:
            cursor.execute("SELECT id, name, email, password_hash FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if not user or not check_password_hash(user[3], password): return jsonify(message="Invalid email or password"), 401
            cursor.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s", (user[0],))
        return jsonify(message="Login successful", user={"id": user[0], "name": user[1], "email": user[2]})
    except Exception:
        traceback.print_exc()
        return jsonify(message="Login failed"), 500


@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    email = (request.get_json(silent=True) or {}).get("email", "").strip().lower()
    if not email: return jsonify(message="Email is required"), 400
    try:
        with get_db_connection() as conn, conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                otp = str(secrets.randbelow(900000) + 100000)
                cursor.execute("DELETE FROM password_resets WHERE email = %s", (email,))
                cursor.execute("INSERT INTO password_resets (email, otp_hash, expires_at) VALUES (%s, %s, %s)", (email, hashlib.sha256(otp.encode()).hexdigest(), datetime.now(timezone.utc) + timedelta(minutes=10)))
                send_otp_email(email, otp)
        return jsonify(message="If this email is registered, an OTP has been sent.")
    except Exception:
        traceback.print_exc()
        return jsonify(message="Unable to send OTP email."), 500


@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json(silent=True) or {}
    email, otp = data.get("email", "").strip().lower(), data.get("otp", "").strip()
    if not email or not otp: return jsonify(message="Email and OTP are required."), 400
    try:
        with get_db_connection() as conn, conn.cursor() as cursor:
            cursor.execute("SELECT id, otp_hash, expires_at, verified FROM password_resets WHERE email = %s ORDER BY created_at DESC LIMIT 1", (email,))
            reset = cursor.fetchone()
            if not reset or reset[3] or datetime.now(timezone.utc) > reset[2] or not secrets.compare_digest(hashlib.sha256(otp.encode()).hexdigest(), reset[1]):
                return jsonify(message="Invalid or expired OTP."), 400
            token = secrets.token_urlsafe(32)
            cursor.execute("UPDATE password_resets SET verified = TRUE, reset_token_hash = %s WHERE id = %s", (hashlib.sha256(token.encode()).hexdigest(), reset[0]))
        return jsonify(message="OTP verified successfully.", reset_token=token)
    except Exception:
        traceback.print_exc()
        return jsonify(message="OTP verification failed."), 500


@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    email, token, password = data.get("email", "").strip().lower(), data.get("reset_token", ""), data.get("password", "")
    if not email or not token or not password: return jsonify(message="All fields are required."), 400
    if len(password) < 8: return jsonify(message="Password must be at least 8 characters."), 400
    try:
        with get_db_connection() as conn, conn.cursor() as cursor:
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            cursor.execute("SELECT id FROM password_resets WHERE email = %s AND reset_token_hash = %s AND verified = TRUE AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1", (email, token_hash))
            if not cursor.fetchone(): return jsonify(message="Password reset session is invalid or expired."), 400
            cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (generate_password_hash(password), email))
            cursor.execute("DELETE FROM password_resets WHERE email = %s", (email,))
        return jsonify(message="Password updated successfully.")
    except Exception:
        traceback.print_exc()
        return jsonify(message="Unable to reset password."), 500


@app.route("/api/status")
def status(): return jsonify(status="online", assistant="Magnum", web_search="enabled")


@app.route("/api/ask", methods=["POST"])
def ask():
    question = (request.get_json(silent=True) or {}).get("question", "").strip()
    if not question: return jsonify(success=False, error="Question is empty."), 400
    try:
        results = web_search(question)
        if not results: return jsonify(success=False, answer="I couldn't access the web right now.", search_used=False)
        return jsonify(success=True, answer=ask_ai(question, results), search_used=True)
    except Exception as error:
        traceback.print_exc()
        return jsonify(success=False, error=str(error)), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")
