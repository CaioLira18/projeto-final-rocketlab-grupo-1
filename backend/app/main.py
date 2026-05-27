import sys
import os

# Add parent directory to sys.path to allow importing from backend root
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from main import app
