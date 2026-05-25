import sqlite3

DB_PATH = "conversations.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            llm_name   TEXT NOT NULL,
            role       TEXT NOT NULL,
            content    TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def save_message(session_id: str, llm_name: str, role: str, content: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO messages (session_id, llm_name, role, content) VALUES (?, ?, ?, ?)",
        (session_id, llm_name, role, content),
    )
    conn.commit()
    conn.close()


def load_history(session_id: str, llm_name: str) -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT role, content FROM messages WHERE session_id = ? AND llm_name = ? ORDER BY id ASC",
        (session_id, llm_name),
    )
    rows = cursor.fetchall()
    conn.close()
    return [{"role": row[0], "content": row[1]} for row in rows]
