# backend/app/blocklist.py
# Global JWT blocklist for revoked tokens
# Shared between app.py and auth.py to avoid circular imports
# In-memory token blocklist (revoked JWTs)

jwt_blocklist = set()
