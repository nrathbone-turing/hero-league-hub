from flask import Flask

def create_app():
    app = Flask(__name__)

    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "Hero League Hub"}

    return app
