import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String, Text, JSON, Numeric, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

# Helper function for default timestamps
def now():
    return datetime.now(timezone.utc)

# User model
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    name = Column(String)
    picture = Column(String)
    google_id = Column(String, unique=True)
    oauth_token = Column(JSON)
    gmail_connected = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=now)
    updated_at = Column(DateTime(timezone=True), default=now, onupdate=now)

    transactions = relationship("Transaction", back_populates="user", cascade="all, delete")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete")
    insights = relationship("Insight", back_populates="user", cascade="all, delete")

# Transaction model - For each individual transaction found in email/receipt
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    merchant = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="USD")
    date = Column(DateTime(timezone=True), nullable=False)
    category = Column(String, default="Other")
    description = Column(Text)
    items = Column(JSON)
    confidence_score = Column(Float)
    needs_review = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now)

    user = relationship("User", back_populates="transactions")
    corrections = relationship("Correction", back_populates="transaction", cascade="all, delete")

# Budget model - For a user's custom budget for specific categories/times perions
class Budget(Base):
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)
    limit_amount = Column(Numeric(12, 2), nullable=False)
    period = Column(String, default="monthly")
    created_at = Column(DateTime(timezone=True), default=now)

    user = relationship("User", back_populates="budgets")

# Insight model - To generate user insights based on their transactions
class Insight(Base):
    __tablename__ = "insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    insight_type = Column(String)
    created_at = Column(DateTime(timezone=True), default=now)

    user = relationship("User", back_populates="insights")

# Correction model - To store manual corrections a user makes to their auto-populated transactions to train categorization model
class Correction(Base):
    __tablename__ = "corrections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_category = Column(String, nullable=False)
    corrected_category = Column(String, nullable=False)
    merchant = Column(String)
    created_at = Column(DateTime(timezone=True), default=now)

    transaction = relationship("Transaction", back_populates="corrections")

# ProcessedEmail model - To store emails processed by the system to determine whether they are receipts or not
class ProcessedEmail(Base):
    __tablename__ = "processed_emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email_id = Column(String, nullable=False)
    processed_at = Column(DateTime(timezone=True), default=now)
    was_receipt = Column(Boolean, default=False)

    __table_args__ = (UniqueConstraint("user_id", "email_id", name="_user_email_uc"),)