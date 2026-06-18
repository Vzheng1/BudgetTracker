import base64
import re
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.models.models import User
from datetime import datetime, timedelta, timezone


"""
Build an authenticated Gmail API client using the user's stored OAuth tokens.
"""
def _get_gmail_service(user: User):
    # Get the user's OAuth token data
    token_data = user.oauth_token

    # Create Google credentials from the stored tokens
    creds = Credentials(
        token=token_data.get("access_token"),
        refresh_token=token_data.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=None,   
        client_secret=None,
    )

    # Build the Gmail API client - "gmail" = API name, "v1" = version
    return build("gmail", "v1", credentials=creds)


"""
Fetch recent emails from the user's Gmail inbox.
    - Filters using a search query so only emails that might be receipts.

Returns a list of email dicts with sender, subject, and body.
"""
async def fetch_recent_emails(user: User, since: datetime=None) -> list[dict]:
    try:
        # Get the Gmail API client
        service = _get_gmail_service(user)

        if since:
            after_date = since.strftime("%Y/%m/%d")
        else:
            after_date = (datetime.now() - timedelta(days=365)).strftime("%Y/%m/%d")

        # Gmail search query — narrows to emails likely to be receipts
        query = " OR ".join([
            "subject:receipt",
            "subject:invoice",
            "subject:order confirmation",
            "subject:payment confirmation",
            "subject:your order",
            "subject:purchase confirmation",
            "subject:ordered",
            
        ])
        query = f"{query} after:{after_date}"

        # Paginate through ALL results — no cap
        messages = []
        page_token = None

        while True:
            params = {
                "userId": "me",
                "q": query,
                "maxResults": 500,
            }
            if page_token:
                params["pageToken"] = page_token

            results = service.users().messages().list(**params).execute()
            page_messages = results.get("messages", [])
            messages.extend(page_messages)

            page_token = results.get("nextPageToken")
            if not page_token:
                break
        
        if not messages:
            return []

        # Fetch full content for each message in list
        emails = []
        for msg in messages:
            email_data = _fetch_email(service, msg["id"])
            if email_data:
                emails.append(email_data)

        return emails

    except Exception as e:
        print(f"Error fetching emails for user {user.email}: {e}")
        return []


"""
Fetch a single email by ID and extract sender, subject, and body.
"""
def _fetch_email(service, message_id: str) -> dict | None:
    try:
        # Get the full message content
        msg = service.users().messages().get(
            userId="me",
            id=message_id,
            format="full",
        ).execute()

        # Extract headers (sender, subject, date)
        headers = msg.get("payload", {}).get("headers", [])
        header_map = {h["name"].lower(): h["value"] for h in headers}

        sender = header_map.get("from", "")
        subject = header_map.get("subject", "")
        date = header_map.get("date", "")

        # Extract the email body text
        body = _extract_body(msg.get("payload", {}))

        return {
            "id": message_id,
            "sender": sender,
            "subject": subject,
            "date": date,
            "body": body,
        }

    except Exception as e:
        print(f"Error fetching email {message_id}: {e}")
        return None


"""
Recursively extract the text body from an email payload.
Emails can be multipart — we look for text/plain or text/html parts.
"""
def _extract_body(payload: dict) -> str:
    body = ""

    # If the payload has parts, recursively check each one
    if "parts" in payload:
        for part in payload["parts"]:
            body += _extract_body(part)
        return body

    # Check the MIME type of this part
    mime_type = payload.get("mimeType", "")

    if mime_type in ("text/plain", "text/html"):
        data = payload.get("body", {}).get("data", "")
        if data:
            # Decode the data since Gmail encodes body as base64url
            decoded = base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore")
            body += decoded

    return body


"""
Clean up email body text for easier parsing.
Strips HTML tags, decodes entities, collapses whitespace.
"""
def clean_email_body(body: str) -> str:
    # Remove HTML tags
    body = re.sub(r"<[^>]+>", " ", body)

    # Decode common HTML entities
    entities = {
        "&nbsp;": " ", "&amp;": "&", "&#39;": "'",
        "&quot;": '"', "&lt;": "<", "&gt;": ">",
    }
    for entity, char in entities.items():
        body = body.replace(entity, char)

    # Collapse multiple whitespace into single spaces
    body = re.sub(r"\s+", " ", body).strip()

    # Limit length since we don't need the full email -> just enough to extract data
    return body[:4000]