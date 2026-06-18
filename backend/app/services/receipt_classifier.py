import re

# Keywords that strongly suggest an email is a receipt
POSITIVE_SUBJECT_KEYWORDS = {
    "receipt": 0.45,
    "invoice": 0.45,
    "order confirmation": 0.45,
    "payment confirmation": 0.45,
    "purchase confirmation": 0.45,
    "booking confirmation": 0.40,
    "subscription renewed": 0.45,
    "payment received": 0.45,
    "payment successful": 0.45,
    "thank you for your order": 0.45,
    "your order": 0.30,
    "order #": 0.30,
    "amount charged": 0.45,
    "charged": 0.25,
    "your purchase": 0.35,
    "e-receipt": 0.45,
    "tax invoice": 0.45,
    "you've been charged": 0.45,
    "payment processed": 0.40,
    "order summary": 0.35,
}

# Keywords that suggest an email is NOT a receipt
NEGATIVE_SUBJECT_KEYWORDS = {
    "unsubscribe": -0.15,
    "newsletter": -0.20,
    "% off": -0.15,
    "sale ends": -0.15,
    "verify your email": -0.40,
    "reset your password": -0.45,
    "confirm your email": -0.35,
    "welcome to": -0.25,
    "sign in": -0.30,
    "security alert": -0.20,
    "exclusive offer": -0.20,
    "special offer": -0.20,
    "we miss you": -0.30,
}

# Regex patterns found in receipt email bodies
POSITIVE_BODY_PATTERNS = [
    (r"\$\s*[\d,]+\.?\d*",           0.07),  # dollar amounts
    (r"£\s*[\d,]+\.?\d*",            0.07),  # pound amounts
    (r"€\s*[\d,]+\.?\d*",            0.07),  # euro amounts
    (r"total[:\s]+[\$£€\d]",         0.08),  # "Total: $"
    (r"subtotal[:\s]+[\$£€\d]",      0.06),  # "Subtotal: $"
    (r"amount\s+(due|paid|charged)",  0.08),  # "amount paid"
    (r"order\s+#?\s*\w{4,}",          0.06),  # order numbers
    (r"invoice\s+#?\s*\w{4,}",        0.07),  # invoice numbers
    (r"transaction\s+id",             0.07),  # transaction IDs
    (r"tax\s*[\$£€]?\s*[\d.,]+",      0.05),  # tax line
    (r"(visa|mastercard|amex|paypal)", 0.06),  # payment methods
    (r"charged\s+to\s+your",          0.08),  # "charged to your card"
    (r"billing\s+address",            0.05),  # billing address
    (r"payment\s+method",             0.06),  # payment method
]


class ReceiptClassifier:

    """
    Classify an email as a receipt or not.
    
    Returns (is_receipt, confidence) where confidence is 0.0 to 1.0.
    """
    def classify(self, sender: str, subject: str, body: str) -> tuple[bool, float]:
        # Start at neutral score
        score = 0.5

        subject_lower = subject.lower()
        body_lower = body.lower()[:3000]

        # Apply positive subject keyword scores
        for kw, weight in POSITIVE_SUBJECT_KEYWORDS.items():
            if kw in subject_lower:
                score += weight

        # Apply negative subject keyword scores
        for kw, weight in NEGATIVE_SUBJECT_KEYWORDS.items():
            if kw in subject_lower:
                score += weight  # weight is negative

        # Apply body pattern scores
        for pattern, weight in POSITIVE_BODY_PATTERNS:
            if re.search(pattern, body_lower, re.IGNORECASE):
                score += weight

        # Multiple currency amounts is a strong signal
        currency_hits = len(re.findall(r"[\$£€]\s*[\d,]+\.?\d*", body[:3000]))
        if currency_hits >= 3:
            score += 0.10
        elif currency_hits >= 1:
            score += 0.05

        # Clip score to 0-1 range
        score = max(0.0, min(1.0, score))

        # Classify as receipt if score is above threshold
        is_receipt = score >= 0.55

        return is_receipt, score