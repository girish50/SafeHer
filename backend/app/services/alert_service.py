import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

ALERT_EMAIL    = os.getenv("ALERT_EMAIL")
ALERT_PASSWORD = os.getenv("ALERT_EMAIL_PASSWORD")


def build_emergency_message(user_name, custom_message, lat, lng, trip=None):
    location_link = f"https://www.google.com/maps?q={lat},{lng}"
    lines = [
        f"EMERGENCY ALERT from {user_name}",
        custom_message or "I may be in danger. Please check on me immediately.",
        f"Current location: {location_link}",
        f"Alert time: {datetime.utcnow().isoformat()}Z",
    ]
    if trip:
        lines.append(f"Trip: {trip.source_text} -> {trip.destination_text}")
    return "\n".join(lines)


def send_email(to_email, message, user_name):
    try:
        msg = MIMEMultipart()
        msg["From"]    = ALERT_EMAIL
        msg["To"]      = to_email
        msg["Subject"] = f"🚨 EMERGENCY ALERT from {user_name}"

        msg.attach(MIMEText(message, "plain"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(ALERT_EMAIL, ALERT_PASSWORD)
            server.sendmail(ALERT_EMAIL, to_email, msg.as_string())

        print(f"Email sent to {to_email}")
        return "sent"
    except Exception as e:
        print(f"Email failed to {to_email}: {e}")
        return "failed"


def send_sms(phone_number, message):
    # SMS not configured - email is used instead
    return "not_configured"


def deliver_to_contact(contact, message, user_name="User"):
    status = "failed"
    if contact.email:
        status = send_email(contact.email, message, user_name)
    return status