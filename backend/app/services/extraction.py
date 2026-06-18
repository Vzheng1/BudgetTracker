import re
from datetime import datetime, timezone

# Patterns for extracting total amount — ordered by confidence
TOTAL_PATTERNS = [
    r"(?:order\s+total|grand\s+total|total\s+amount|amount\s+(?:due|paid|charged)|total\s+charged|total\s+due|your\s+total|payment\s+total)[:\s]*[\$£€]?\s*([\d,]+\.?\d*)",
    r"\btotal[:\s]+[\$£€]\s*([\d,]+\.?\d{2})\b",
    r"(?:charged|billed)[:\s]+[\$£€]\s*([\d,]+\.?\d{2})",
    r"[\$£€]\s*([\d,]+\.?\d{2})\s+total",
    r"\bamount[:\s]+[\$£€]?\s*([\d,]+\.?\d{2})\b",
    r"\bsubtotal[:\s]+[\$£€]?\s*([\d,]+\.?\d{2})\b",
]

# Date format patterns
DATE_PATTERNS = [
    (r"\b(\d{4}-\d{2}-\d{2})\b", "%Y-%m-%d"),
    (r"\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b", "%B %d %Y"),
    (r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4})\b", "%b %d %Y"),
    (r"\b(\d{2}[/-]\d{2}[/-]\d{4})\b", "%m/%d/%Y"),
]

CURRENCY_SYMBOL_MAP = {
    "$": "USD", "£": "GBP", "€": "EUR",
    "¥": "JPY", "₹": "INR",
}


class ExtractionService:

    """
    Extract structured receipt data from email content.
    
    Returns a dict with merchant, amount, date, currency, and confidence.
    """
    def extract(self, sender: str, subject: str, body: str) -> dict:
        cleaned = self._clean_body(body)

        amount = self._extract_amount(cleaned)
        date = self._extract_date(cleaned)
        currency = self._extract_currency(cleaned)
        merchant = self._extract_merchant(sender, subject, cleaned)
        description = subject[:200] if subject else f"Purchase at {merchant}"

        # Confidence based on how many fields were successfully extracted
        confidence = self._score_confidence(amount, date, merchant)

        return {
            "merchant": merchant,
            "amount": amount,
            "date": date,
            "currency": currency,
            "description": description,
            "confidence": confidence,
        }

    # Extract the total amount from the email body.
    def _extract_amount(self, text: str) -> float:
        # First - Try each labelled pattern
        for pattern in TOTAL_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                raw = match.group(1).replace(",", "")
                try:
                    val = float(raw)
                    if 0.01 < val < 100_000:
                        return round(val, 2)
                except ValueError:
                    continue

        # Fallback — find all dollar amounts and return the largest
        all_amounts = re.findall(r"[\$£€]\s*([\d,]+\.?\d{2})", text)
        if all_amounts:
            values = []
            for a in all_amounts:
                try:
                    values.append(float(a.replace(",", "")))
                except ValueError:
                    pass
            if values:
                largest = max(values)
                significant = [v for v in values if v > 0.5 * largest]
                if significant:
                    return round(max(significant), 2)

        return 0.0


    # Extract the date from the email body.
    def _extract_date(self, text: str) -> str:
        for pattern, fmt in DATE_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                raw = match.group(1).replace(",", "").replace(".", "")
                raw = re.sub(r"\s+", " ", raw).strip()
                try:
                    dt = datetime.strptime(raw, fmt)
                    if 2000 <= dt.year <= datetime.now().year + 1:
                        return dt.strftime("%Y-%m-%d")
                except ValueError:
                    continue

        # Default to today if no date found
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")


    # Extract the currency from the email body.
    def _extract_currency(self, text: str) -> str:
        # Check for ISO currency code first
        match = re.search(r"\b(USD|EUR|GBP|JPY|CAD|AUD)\b", text)
        if match:
            return match.group(1)

        # Fall back to symbol detection
        for symbol, code in CURRENCY_SYMBOL_MAP.items():
            if symbol in text:
                return code

        return "USD"


    # Extract the merchant from the email content.
    def _extract_merchant(self, sender: str, subject: str, body: str) -> str:
        # Try display name from sender first
        if "<" in sender:
            name = sender.split("<")[0].strip().strip('"')
            if len(name) >= 2:
                return name[:80]

        # Try domain name from email address
        email_match = re.search(r"@([\w-]+)\.", sender)
        if email_match:
            domain = email_match.group(1)
            generic = {"noreply", "no-reply", "donotreply", "mail", "email", "notification"}
            if domain.lower() not in generic:
                return domain.replace("-", " ").title()

        # Try body patterns
        patterns = [
            r"thank(?:s| you) for (?:your )?(?:order|purchase) (?:at|with|from)\s+([A-Z][A-Za-z0-9 &.,']{2,40})",
            r"receipt from\s+([A-Z][A-Za-z0-9 &.,']{2,40})",
        ]
        for pattern in patterns:
            m = re.search(pattern, body, re.IGNORECASE)
            if m:
                return m.group(1).strip()[:80]

        # Fall back to cleaned subject
        subject_clean = re.sub(r"(order|receipt|invoice|confirmation|#\w+)", "", subject, flags=re.IGNORECASE)
        subject_clean = subject_clean.strip(" -:#|")
        if len(subject_clean) >= 2:
            return subject_clean[:60]

        return "Unknown Merchant"


    # Score the confidence of the extracted receipt data.
    def _score_confidence(self, amount: float, date: str, merchant: str) -> float:
        score = 0.0

        if amount > 0:
            score += 0.50
        if merchant != "Unknown Merchant":
            score += 0.25
        
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if date != today:
            # Date was actually found in the email, not defaulted to today
            score += 0.25
        
        return min(1.0, round(score, 2))


    # Clean the email body text.
    def _clean_body(self, body: str) -> str:
        # Strip HTML tags
        body = re.sub(r"<[^>]+>", " ", body)

        # Decode HTML entities
        entities = {"&nbsp;": " ", "&amp;": "&", "&#39;": "'", "&quot;": '"'}
        for entity, char in entities.items():
            body = body.replace(entity, char)
        
        # Collapse whitespace
        body = re.sub(r"\s+", " ", body).strip()
        return body[:4000]