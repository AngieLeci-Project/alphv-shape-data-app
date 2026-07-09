import secrets

ADMIN_PASSWORD = "alphv2026"

valid_tokens = set()


def login(password):
    """
    Checks the given password. If correct, generates and stores a new token.
    Returns the token string, or None if the password was wrong.
    """
    if password != ADMIN_PASSWORD:
        return None

    token = secrets.token_hex(16)  # generates a random 32-character string
    valid_tokens.add(token)
    return token


def is_valid_token(token):
    """Checks whether a given token is currently logged in."""
    return token in valid_tokens


def logout(token):
    """Invalidates a token (used when the admin logs out)."""
    valid_tokens.discard(token)