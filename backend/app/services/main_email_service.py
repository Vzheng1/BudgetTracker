from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone, timedelta
from app.models.models import User, Transaction, ProcessedEmail
from app.services.gmail_importer import fetch_recent_emails, clean_email_body
from app.services.receipt_classifier import ReceiptClassifier
from app.services.extraction import ExtractionService
from app.services.categorization import CategorizationService
from email.utils import parsedate_to_datetime


# Initialize services
classifier = ReceiptClassifier()
extractor = ExtractionService()
categorizer = CategorizationService()


"""
Main email sync pipeline:
1. Fetch recent emails from Gmail
2. Skip already-processed emails
3. Classify each email as receipt or not
4. Extract structured data from receipts
5. Categorize and save as transactions
Returns stats about what was processed.
"""
async def sync_emails(user: User, db: AsyncSession) -> dict:
    stats = {"fetched": 0, "processed": 0, "skipped": 0, "failed": 0}

    # Get the last synced timestamp and update that timestamp since we are resyncing
    since = user.last_synced_at
    user.last_synced_at = datetime.now(timezone.utc)
    await db.commit()

    # (1) Fetch emails from Gmail. Go through each email and process it.
    emails = await fetch_recent_emails(user, since=since)
    stats["fetched"] = len(emails)

    for email in emails:
        try:
            email_id = email["id"]

            # (2) Check if we've already processed this email -> prevents duplicate processing
            result = await db.execute(
                select(ProcessedEmail).where(
                    ProcessedEmail.user_id == user.id,
                    ProcessedEmail.email_id == email_id,
                )
            )
            if result.scalars().first():
                stats["skipped"] += 1
                continue

            # (3a) If it is a new email, clean the email body for processing
            body = clean_email_body(email["body"])

            # (3b) Classify whether the email is a receipt or not
            is_receipt, confidence = classifier.classify(
                email["sender"],
                email["subject"],
                body,
            )

            # (3c) Mark as processed no matter the result. Simply do not add to database if not receipt.
            processed = ProcessedEmail(
                user_id=user.id,
                email_id=email_id,
                was_receipt=is_receipt,
            )
            db.add(processed)

            try:
                await db.flush()
            except IntegrityError:
                await db.rollback()
                stats["skipped"] += 1
                continue

            if not is_receipt:
                stats["skipped"] += 1
                await db.commit()
                continue

            # (4) Extract structured data if it is a receipt. Skip it unable to extract a valid amount.
            extracted = extractor.extract(
                email["sender"],
                email["subject"],
                body,
            )

            if extracted["amount"] <= 0:
                stats["skipped"] += 1
                await db.commit()
                continue

            # (5a) Categorize the transaction
            category, cat_confidence = categorizer.categorize(
                extracted["merchant"],
                extracted["description"],
            )

            # (5b) Use Gmail header date. Fallback to extraction if header is missing.
            date = None
            if email.get("date"):
                try:
                    # parsedate_to_datetime handles all RFC 2822 date formats
                    # e.g. "Thu, 17 Jun 2026 14:23:01 +0000"
                    date = parsedate_to_datetime(email["date"])
                except Exception:
                    pass

            if date is None:
                # Fall back to extracted date from email body
                try:
                    date = datetime.strptime(extracted["date"], "%Y-%m-%d").replace(
                        tzinfo=timezone.utc
                    )
                except ValueError:
                    date = datetime.now(timezone.utc)

            # (5c) Check for near-duplicate transaction
            duplicate_check = await db.execute(
                select(Transaction).where(
                    Transaction.user_id == user.id,
                    Transaction.merchant == extracted["merchant"],
                    Transaction.amount == extracted["amount"],
                    Transaction.date >= date - timedelta(days=1),
                    Transaction.date <= date + timedelta(days=1),
                    Transaction.deleted_at == None,
                )
            )
            if duplicate_check.scalars().first():
                stats["skipped"] += 1
                await db.commit()
                continue

            # (5d) Save as a transaction. needs_review = True -> not confident about extraction. depends on confidence score
            transaction = Transaction(
                user_id=user.id,
                merchant=extracted["merchant"],
                amount=extracted["amount"],
                currency=extracted["currency"],
                date=date,
                category=category,
                description=extracted["description"],
                confidence_score=extracted["confidence"],
                needs_review=extracted["confidence"] < 0.6,
            )
            db.add(transaction)
            await db.commit()

            stats["processed"] += 1

        # Rollback the transaction if there's an error
        except Exception as e:
            print(f"Error processing email {email.get('id')}: {e}")
            stats["failed"] += 1
            await db.rollback()

    return stats