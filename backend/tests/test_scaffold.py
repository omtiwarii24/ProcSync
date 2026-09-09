from sqlalchemy import text
from app.database import engine

def test_db_connection():
    with engine.connect() as conn:
        assert conn.execute(text("SELECT 1")).scalar() == 1
