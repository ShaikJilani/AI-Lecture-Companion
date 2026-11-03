import sqlite3

DB_NAME = "lecture_companion.db"


def get_connection():
    return sqlite3.connect(DB_NAME)


def initialize_database():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lectures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            transcript TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


def save_lecture(title, transcript, notes):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO lectures (title, transcript, notes)
        VALUES (?, ?, ?)
        """,
        (title, transcript, notes)
    )

    connection.commit()
    lecture_id = cursor.lastrowid
    connection.close()

    return lecture_id


def get_lectures():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT id, title, created_at FROM lectures ORDER BY id DESC"
    )

    lectures = cursor.fetchall()
    connection.close()

    return lectures

def delete_lecture(lecture_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM lectures WHERE id = ?",
        (lecture_id,)
    )

    deleted = cursor.rowcount > 0

    connection.commit()
    connection.close()

    return deleted


def delete_all_lectures():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("DELETE FROM lectures")
    deleted_count = cursor.rowcount

    connection.commit()
    connection.close()

    return deleted_count
def get_lecture_by_id(lecture_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT id, title, transcript, notes, created_at
        FROM lectures
        WHERE id = ?
        """,
        (lecture_id,)
    )

    lecture = cursor.fetchone()
    connection.close()

    return lecture