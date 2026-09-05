import sys
from pathlib import Path

_current_dir = str(Path(__file__).resolve().parent)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)

from backend.main import app