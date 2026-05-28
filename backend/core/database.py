import sqlite3
from typing import Optional

DB_PATH = "conversations.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            llm_name   TEXT NOT NULL,
            role       TEXT NOT NULL,
            content    TEXT NOT NULL
        )
    """)
    # NEW: stores the running summary per session per model
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS summaries (
            session_id TEXT NOT NULL,
            llm_name   TEXT NOT NULL,
            summary    TEXT NOT NULL,
            PRIMARY KEY (session_id, llm_name)
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


def load_recent_history(session_id: str, llm_name: str, limit: int = 10) -> list[dict]:
    # NEW: only loads the last `limit` messages, not everything
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """SELECT role, content FROM messages
           WHERE session_id = ? AND llm_name = ?
           ORDER BY id DESC LIMIT ?""",
        (session_id, llm_name, limit),
    )
    rows = cursor.fetchall()
    conn.close()
    return [{"role": row[0], "content": row[1]} for row in reversed(rows)]


def load_oldest_messages(session_id: str, llm_name: str, n: int) -> list[dict]:
    # NEW: fetch oldest N messages (these are what we'll summarize)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """SELECT role, content FROM messages
           WHERE session_id = ? AND llm_name = ?
           ORDER BY id ASC LIMIT ?""",
        (session_id, llm_name, n),
    )
    rows = cursor.fetchall()
    conn.close()
    return [{"role": row[0], "content": row[1]} for row in rows]


def count_messages(session_id: str, llm_name: str) -> int:
    # NEW: how many messages exist for this session+model
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT COUNT(*) FROM messages WHERE session_id = ? AND llm_name = ?",
        (session_id, llm_name),
    )
    count = cursor.fetchone()[0]
    conn.close()
    return count


def delete_oldest_messages(session_id: str, llm_name: str, n: int):
    # NEW: delete the oldest N messages after summarizing them
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """DELETE FROM messages WHERE id IN (
               SELECT id FROM messages
               WHERE session_id = ? AND llm_name = ?
               ORDER BY id ASC LIMIT ?
           )""",
        (session_id, llm_name, n),
    )
    conn.commit()
    conn.close()


def save_summary(session_id: str, llm_name: str, summary: str):
    # NEW: upsert — if summary exists update it, else insert
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO summaries (session_id, llm_name, summary) VALUES (?, ?, ?)
           ON CONFLICT(session_id, llm_name) DO UPDATE SET summary = excluded.summary""",
        (session_id, llm_name, summary),
    )
    conn.commit()
    conn.close()


def load_summary(session_id: str, llm_name: str) -> Optional[str]:
    # NEW: returns the summary text or None if no summary yet
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT summary FROM summaries WHERE session_id = ? AND llm_name = ?",
        (session_id, llm_name),
    )
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None
