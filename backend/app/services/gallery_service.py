import secrets
import string
import bcrypt

def hash_pin(pin: str) -> str:
    """Hashes numeric PIN using native bcrypt"""
    pin_bytes = pin.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pin_bytes, salt).decode('utf-8')

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Verifies plain numeric PIN against stored bcrypt hash"""
    try:
        pin_bytes = plain_pin.encode('utf-8')[:72]
        hash_bytes = hashed_pin.encode('utf-8')
        return bcrypt.checkpw(pin_bytes, hash_bytes)
    except Exception:
        return False

def generate_share_slug(length: int = 8) -> str:
    """Generates URL-friendly random slug (e.g. abc123xy)"""
    safe_chars = "23456789abcdefghijkmnpqrstuvwxyz"
    return "".join(secrets.choice(safe_chars) for _ in range(length))
