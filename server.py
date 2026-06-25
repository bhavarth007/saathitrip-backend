from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import uuid
import random
import os
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='.')

# Database Configuration (SQLite)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///saathitrip.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

SMTP_EMAIL = os.getenv('SMTP_EMAIL')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')

def send_real_email(to_email, otp, subject="Your SaathiTrip Verification Code"):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        return False
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        body = f"Hello!\n\nYour SaathiTrip OTP is: {otp}\n\nPlease do not share this code with anyone."
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending real email: {e}")
        return False

# User Model
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(150), unique=True, nullable=False)
    mobile = db.Column(db.String(20), unique=True, nullable=False)
    verified_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

pending_otps = {}

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# --- Registration Routes ---
@app.route('/api/register/send-otp', methods=['POST'])
def register_send_otp():
    data = request.json
    email = data.get('email')
    mobile = data.get('mobile')

    if not email or not mobile:
        return jsonify({"error": "Email and Mobile are required"}), 400

    if User.query.filter_by(email=email).first() or User.query.filter_by(mobile=mobile).first():
        return jsonify({"error": "An account with this email or mobile already exists."}), 400

    email_otp = str(random.randint(100000, 999999))
    mobile_otp = str(random.randint(100000, 999999))

    pending_otps[email] = {"otp": email_otp}
    pending_otps[mobile] = {"otp": mobile_otp}
    
    email_success = send_real_email(email, email_otp, "SaathiTrip Registration OTP")
    
    return jsonify({
        "success": True, 
        "real_email_sent": email_success,
        "mock_mobile_otp": mobile_otp
    })

@app.route('/api/register/verify', methods=['POST'])
def register_verify():
    data = request.json
    email = data.get('email')
    mobile = data.get('mobile')
    
    if not all([email, mobile, data.get('email_otp'), data.get('mobile_otp')]):
        return jsonify({"success": False, "error": "All fields are required"}), 400

    if pending_otps.get(email, {}).get('otp') != data['email_otp']:
        return jsonify({"success": False, "error": "Invalid Email OTP"}), 400
    if pending_otps.get(mobile, {}).get('otp') != data['mobile_otp']:
        return jsonify({"success": False, "error": "Invalid Mobile OTP"}), 400

    user = User(email=email, mobile=mobile)
    db.session.add(user)
    db.session.commit()
    
    del pending_otps[email]
    del pending_otps[mobile]
        
    return jsonify({"success": True})


# --- Login Routes ---
@app.route('/api/login/send-otp', methods=['POST'])
def login_send_otp():
    data = request.json
    identifier = data.get('identifier') # Could be email or mobile
    
    user = User.query.filter((User.email == identifier) | (User.mobile == identifier)).first()
    if not user:
        return jsonify({"error": "No account found with that email or mobile number."}), 404

    otp = str(random.randint(100000, 999999))
    pending_otps[identifier] = {"otp": otp, "user_id": user.id}
    
    email_success = False
    if '@' in identifier:
        email_success = send_real_email(identifier, otp, "SaathiTrip Login OTP")
        
    return jsonify({
        "success": True,
        "real_email_sent": email_success,
        "mock_otp": otp if not email_success else None
    })

@app.route('/api/login/verify', methods=['POST'])
def login_verify():
    data = request.json
    identifier = data.get('identifier')
    otp = data.get('otp')
    
    stored_data = pending_otps.get(identifier)
    if not stored_data or stored_data['otp'] != otp:
        return jsonify({"success": False, "error": "Invalid OTP"}), 400
        
    user = User.query.get(stored_data['user_id'])
    del pending_otps[identifier]
    
    return jsonify({
        "success": True, 
        "user": {"email": user.email, "mobile": user.mobile}
    })

# --- Dashboard Routes ---
@app.route('/api/matches', methods=['POST'])
def get_matches():
    data = request.json
    destination = data.get('destination', 'Unknown')
    
    # Mock profiles for MVP
    matches = [
        {"name": "Priya S.", "destination": destination, "color": "var(--primary-color)", "tags": ["Photography", "Cafes"]},
        {"name": "Amit P.", "destination": destination, "color": "var(--secondary-color)", "tags": ["Backpacking", "Trekking"]},
        {"name": "Neha K.", "destination": destination, "color": "#eab308", "tags": ["Luxury", "Beaches"]}
    ]
    return jsonify({"success": True, "matches": matches})

if __name__ == '__main__':
    print("Starting SaathiTrip Backend on port 8000...")
    app.run(host='0.0.0.0', port=8000, debug=True)
