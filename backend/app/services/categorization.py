import re

# Keyword rules mapping merchants/descriptions to categories
CATEGORY_RULES: dict[str, list[str]] = {
    "Food": [
        "doordash", "ubereats", "uber eats", "grubhub", "seamless", "instacart",
        "starbucks", "dunkin", "mcdonalds", "burger king", "wendy's", "subway",
        "taco bell", "chipotle", "chick-fil-a", "popeyes", "kfc", "five guys",
        "dominos", "pizza hut", "papa johns", "whole foods", "trader joe",
        "kroger", "safeway", "publix", "wegmans", "amazon fresh",
        "restaurant", "cafe", "coffee", "pizza", "sushi", "bakery", "deli",
        "grocery", "supermarket", "food", "diner", "kitchen", "bistro",
        "grill", "bar ", "pub ", "brewery",
    ],
    "Shopping": [
        "amazon", "ebay", "etsy", "walmart", "target", "costco",
        "best buy", "home depot", "lowe's", "ikea", "wayfair",
        "zara", "h&m", "gap", "old navy", "nordstrom", "macy",
        "nike", "adidas", "lululemon", "apple store", "apple.com",
        "aritzia", "urban outfitters", "anthropologie", "free people",
        "temu", "shein", "uniqlo", "forever 21", "american eagle",
        "abercrombie", "hollister", "express", "banana republic",
        "new balance", "puma", "reebok", "vans", "converse",
        "sephora", "ulta", "fenty", "glossier",
        "tj maxx", "marshalls", "ross", "burlington",
        "bloomingdale", "neiman marcus", "saks",
        "chewy", "petco", "petsmart",
        "b&h", "adorama", "newegg",
        "order confirmation", "your order", "shipping confirmation",
    ],
    "Transportation": [
        "uber", "lyft", "metro", "mta", "bart", "amtrak",
        "shell", "bp ", "exxon", "chevron", "mobil", "fuel", "gasoline",
        "parking", "parkwhiz", "spothero", "toll", "ezpass",
        "jiffy lube", "autozone", "car wash",
    ],
    "Entertainment": [
        "netflix", "hulu", "disney+", "disney plus", "hbo",
        "apple tv+", "peacock", "paramount+",
        "spotify", "apple music", "pandora", "youtube music",
        "steam", "xbox", "playstation", "nintendo", "epic games",
        "ticketmaster", "stubhub", "eventbrite",
        "cinema", "movie", "amc theatre", "regal", "concert",
    ],
    "Healthcare": [
        "pharmacy", "walgreens", "cvs", "rite aid",
        "doctor", "dental", "dentist", "clinic", "hospital", "urgent care",
        "medical", "prescription", "rx", "optometrist",
        "lab corp", "quest diagnostics", "physical therapy",
    ],
    "Utilities": [
        "electric", "con edison", "pge", "duke energy",
        "gas bill", "national grid", "water bill",
        "internet", "comcast", "xfinity", "spectrum", "cox cable",
        "at&t", "verizon", "t-mobile", "sprint",
        "phone bill", "cell phone", "rent payment",
    ],
    "Travel": [
        "united airlines", "delta", "american airlines", "southwest",
        "jetblue", "frontier", "spirit airlines", "alaska airlines",
        "marriott", "hilton", "hyatt", "holiday inn", "sheraton",
        "hotel", "resort", "airbnb", "vrbo", "booking.com", "expedia",
        "hertz", "avis", "enterprise rent", "budget car",
    ],
    "Subscriptions": [
        "github", "adobe", "figma", "microsoft 365", "google workspace",
        "dropbox", "icloud", "slack", "zoom", "notion", "airtable",
        "1password", "nordvpn",
        "new york times", "washington post", "wsj", "bloomberg",
        "subscription", "monthly plan", "annual plan",
        "membership", "renewal", "auto-renew", "recurring",
    ],
}

# Pre-built flat index: keyword → category for fast lookup
KEYWORD_INDEX: dict[str, str] = {
    kw.lower(): cat
    for cat, keywords in CATEGORY_RULES.items()
    for kw in keywords
}


class CategorizationService:

    """
    Categorize a transaction based on merchant name and description.

    Returns (category, confidence).
    """
    def categorize(self, merchant: str, description: str) -> tuple[str, float]:
        text = f"{merchant} {description}".lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()

        # Count keyword hits per category
        scores: dict[str, int] = {cat: 0 for cat in CATEGORY_RULES}

        for keyword, category in KEYWORD_INDEX.items():
            if keyword in text:
                scores[category] += 1

        best_cat = max(scores, key=lambda c: scores[c])
        best_score = scores[best_cat]

        if best_score == 0:
            # No keywords matched — default to Other with low confidence
            return "Other", 0.4

        # More keyword hits = higher confidence
        confidence = min(0.95, 0.60 + best_score * 0.10)
        return best_cat, confidence