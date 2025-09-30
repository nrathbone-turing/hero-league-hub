# Marks models as a package and makes model imports cleaner
from backend.app.models.models import Event, Entrant, Match, User

__all__ = ["Event", "Entrant", "Match", "User"]
