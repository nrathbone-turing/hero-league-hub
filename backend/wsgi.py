# File: backend/wsgi.py
# Purpose: WSGI entrypoint for production or Docker runs.

from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    # Bind to 0.0.0.0 so Docker can expose it
    app.run(host="0.0.0.0", port=5500, debug=True)
