import smtplib
from email.mime.text import MIMEText
import json
import os

def lambda_handler(event, context):
    try:
        print("RAW EVENT:", event)

        # handle different event formats
        if isinstance(event, str):
            body = json.loads(event)
        elif "body" in event:
            body = json.loads(event["body"])
        else:
            body = event

        subject = body.get("subject", "Default Subject")
        message = body.get("message", "Default Message")
        to_email = body.get("email")

        sender = os.environ["GMAIL_USER"]
        password = os.environ["GMAIL_PASS"]

        if not to_email:
            return {
                "statusCode": 400,
                "body": "Missing recipient email"
            }

        # build email
        msg = MIMEText(message)
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to_email

        # send email
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender, password)
        server.sendmail(sender, to_email, msg.as_string())
        server.quit()

        return {
            "statusCode": 200,
            "body": json.dumps({"message": f"Email sent to {to_email}"})
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            "statusCode": 500,
            "body": str(e)
        }