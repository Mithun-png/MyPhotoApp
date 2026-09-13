import time
from fastapi import HTTPException, status
from app.config import settings

class PinRateLimiter:
    """
    In-memory rate limiter to mitigate brute-force attempts on public gallery PINs.
    Locks a slug if failed attempts exceed MAX_ATTEMPTS within the window.
    """
    def __init__(self, max_attempts: int = 5, lockout_seconds: int = 900):
        self.max_attempts = max_attempts
        self.lockout_seconds = lockout_seconds
        # key: share_slug -> {"attempts": count, "locked_until": timestamp}
        self.records = {}

    def check_slug(self, share_slug: str):
        now = time.time()
        record = self.records.get(share_slug)
        if record:
            if record["locked_until"] > now:
                remaining = int(record["locked_until"] - now)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many failed PIN attempts. Gallery access locked for {remaining} seconds."
                )
            elif record["locked_until"] <= now and record["locked_until"] != 0:
                # Lockout expired, reset attempts
                self.records[share_slug] = {"attempts": 0, "locked_until": 0}

    def record_failure(self, share_slug: str):
        now = time.time()
        record = self.records.setdefault(share_slug, {"attempts": 0, "locked_until": 0})
        record["attempts"] += 1
        
        if record["attempts"] >= self.max_attempts:
            record["locked_until"] = now + self.lockout_seconds
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"PIN attempts exceeded limit ({self.max_attempts}). Gallery locked for {self.lockout_seconds // 60} minutes."
            )

    def record_success(self, share_slug: str):
        if share_slug in self.records:
            del self.records[share_slug]

pin_limiter = PinRateLimiter(max_attempts=settings.PIN_MAX_ATTEMPTS)
