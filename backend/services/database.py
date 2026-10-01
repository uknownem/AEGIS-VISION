import sqlite3
import os
import time
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "aegis_vision.db")

def get_connection():
    """Returns a SQLite connection with row factory enabled."""
    conn = sqlite3.connect(DB_FILE, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes database tables and ensures all soldier duty logins and siren alerts are stored."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Soldier Authentication & Duty Login Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS soldier_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_number TEXT NOT NULL,
        name TEXT NOT NULL,
        rank TEXT NOT NULL,
        unit TEXT NOT NULL,
        action TEXT NOT NULL DEFAULT 'LOGIN',
        terminal_id TEXT NOT NULL,
        ip_address TEXT DEFAULT '10.14.0.12',
        status TEXT NOT NULL DEFAULT 'AUTHORIZED',
        timestamp TEXT NOT NULL,
        created_at REAL NOT NULL
    );
    """)

    # 2. Security Alerts & Siren Trigger History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS security_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT NOT NULL,
        target_class TEXT NOT NULL,
        confidence REAL NOT NULL,
        camera_id TEXT NOT NULL,
        sector TEXT NOT NULL,
        siren_triggered INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        distance_meters REAL DEFAULT 0.0,
        notes TEXT DEFAULT '',
        timestamp TEXT NOT NULL,
        created_at REAL NOT NULL
    );
    """)

    # Complete Indian Army soldier duty login database records
    all_soldiers = [
        ("IA-948201", "Subedar Vikram Singh", "Subedar", "14 Corps - High Altitude Recon", "LOGIN", "TERMINAL-LAC-NORTH", "10.14.2.10", "AUTHORIZED", "2026-10-01 14:15:22", time.time() - 3600),
        ("IA-773194", "Major Rajesh Sharma", "Major", "9 Para Special Forces", "LOGIN", "TERMINAL-HQ-ALPHA", "10.14.1.04", "AUTHORIZED", "2026-10-01 14:20:05", time.time() - 2700),
        ("IA-661038", "Havildar Gurpreet Singh", "Havildar", "Sikh Light Infantry", "LOGIN", "TERMINAL-CHECKPOINT-4", "10.14.3.18", "AUTHORIZED", "2026-10-01 14:28:40", time.time() - 1800),
        ("IA-829104", "Captain Ananya Roy", "Captain", "Signals Intelligence Wing", "STATION_CHECK_IN", "TERMINAL-DRONE-OPS", "10.14.1.88", "AUTHORIZED", "2026-10-01 14:32:10", time.time() - 1200),
        ("IA-550192", "Lieutenant Karan Verma", "Lieutenant", "Armored Corps - 1st Cavalry", "LOGIN", "TERMINAL-ARMOR-DEPOT", "10.14.4.12", "AUTHORIZED", "2026-10-01 14:35:18", time.time() - 900),
        ("IA-339102", "Sepoy Manoj Kumar", "Sepoy", "Kumaon Regiment", "LOGIN", "TERMINAL-NORTH-WATCH", "10.14.2.55", "AUTHORIZED", "2026-10-01 14:38:00", time.time() - 750),
        ("IA-110294", "Colonel Sanjeev Malhotra", "Colonel", "Northern Command HQ", "LOGIN", "TERMINAL-COMMAND-CENTRAL", "10.14.1.01", "AUTHORIZED", "2026-10-01 14:40:20", time.time() - 600),
        ("IA-449182", "Naib Subedar Deepankar Das", "Naib Subedar", "Assam Rifles (Border Recon)", "STATION_CHECK_IN", "TERMINAL-OUTPOST-CHARLIE", "10.14.5.21", "AUTHORIZED", "2026-10-01 14:42:50", time.time() - 400),
        ("IA-992144", "Havildar Suresh Nair", "Havildar", "Madras Regiment", "LOGIN", "TERMINAL-RADAR-MAST", "10.14.3.09", "AUTHORIZED", "2026-10-01 14:44:10", time.time() - 250)
    ]

    cursor.execute("SELECT COUNT(*) FROM soldier_logs")
    if cursor.fetchone()[0] < len(all_soldiers):
        cursor.execute("DELETE FROM soldier_logs")
        cursor.executemany("""
        INSERT INTO soldier_logs (service_number, name, rank, unit, action, terminal_id, ip_address, status, timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, all_soldiers)

    # Seed security alerts & siren warnings
    all_siren_alerts = [
        ("NON_HUMAN_INTRUSION", "Main Battle Tank / BMP", 0.965, "CAM-07", "LAC Northern Sector", 1, "ACTIVE", 48.2, "Armored vehicle detected at snow transit corridor // TACTICAL SIREN ACTIVATED", "2026-10-01 14:24:12", time.time() - 1200),
        ("NON_HUMAN_INTRUSION", "charger / spoon / object", 0.930, "CAM-01", "Perimeter Fence Alpha", 1, "ACKNOWLEDGED", 1.4, "Non-human foreign object detected in base perimeter // SIREN LOGGED", "2026-10-01 14:10:00", time.time() - 2400),
        ("NON_HUMAN_INTRUSION", "Unidentified Aerial Drone (UAV)", 0.942, "CAM-04", "Eastern Ridge Pass", 1, "ACTIVE", 125.0, "Low-altitude unauthorized drone breach // SIREN WAILING", "2026-10-01 14:30:15", time.time() - 800),
        ("CAMOUFLAGE_BREACH", "Thermal Heat Signature", 0.890, "CAM-02", "Main Gate Corridor", 1, "RESOLVED", 18.5, "Camouflage target movement intercepted // Operator cleared", "2026-10-01 13:55:00", time.time() - 3200)
    ]

    cursor.execute("SELECT COUNT(*) FROM security_alerts")
    if cursor.fetchone()[0] < len(all_siren_alerts):
        cursor.execute("DELETE FROM security_alerts")
        cursor.executemany("""
        INSERT INTO security_alerts (alert_type, target_class, confidence, camera_id, sector, siren_triggered, status, distance_meters, notes, timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, all_siren_alerts)

    conn.commit()
    conn.close()

def record_soldier_login(
    service_number: str,
    name: str,
    rank: str,
    unit: str,
    action: str = "LOGIN",
    terminal_id: str = "TERMINAL-ALPHA",
    ip_address: str = "10.14.0.1",
    status: str = "AUTHORIZED"
) -> Dict[str, Any]:
    """Saves soldier login/logout timestamp to the database."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    now_ts = time.time()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO soldier_logs (service_number, name, rank, unit, action, terminal_id, ip_address, status, timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (service_number, name, rank, unit, action, terminal_id, ip_address, status, now_str, now_ts))
    
    log_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": log_id,
        "service_number": service_number,
        "name": name,
        "rank": rank,
        "unit": unit,
        "action": action,
        "terminal_id": terminal_id,
        "ip_address": ip_address,
        "status": status,
        "timestamp": now_str
    }

def get_soldier_logs(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves soldier login logs ordered by most recent first."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, service_number, name, rank, unit, action, terminal_id, ip_address, status, timestamp, created_at
    FROM soldier_logs
    ORDER BY id DESC
    LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def record_security_alert(
    alert_type: str,
    target_class: str,
    confidence: float,
    camera_id: str,
    sector: str = "Perimeter Defense Sector",
    siren_triggered: bool = True,
    status: str = "ACTIVE",
    distance_meters: float = 0.0,
    notes: str = ""
) -> Dict[str, Any]:
    """Records security alerts and siren activations into the database."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    now_ts = time.time()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO security_alerts (alert_type, target_class, confidence, camera_id, sector, siren_triggered, status, distance_meters, notes, timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (alert_type, target_class, confidence, camera_id, sector, 1 if siren_triggered else 0, status, distance_meters, notes, now_str, now_ts))
    
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": alert_id,
        "alert_type": alert_type,
        "target_class": target_class,
        "confidence": confidence,
        "camera_id": camera_id,
        "sector": sector,
        "siren_triggered": siren_triggered,
        "status": status,
        "distance_meters": distance_meters,
        "notes": notes,
        "timestamp": now_str
    }

def get_security_alerts(limit: int = 50, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves security alerts from the database."""
    conn = get_connection()
    cursor = conn.cursor()
    if status:
        cursor.execute("""
        SELECT id, alert_type, target_class, confidence, camera_id, sector, siren_triggered, status, distance_meters, notes, timestamp, created_at
        FROM security_alerts
        WHERE status = ?
        ORDER BY id DESC
        LIMIT ?
        """, (status, limit))
    else:
        cursor.execute("""
        SELECT id, alert_type, target_class, confidence, camera_id, sector, siren_triggered, status, distance_meters, notes, timestamp, created_at
        FROM security_alerts
        ORDER BY id DESC
        LIMIT ?
        """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_alert_status(alert_id: int, status: str, notes: str = "") -> bool:
    """Updates the status of an alert (e.g. ACKNOWLEDGED, RESOLVED)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE security_alerts
    SET status = ?, notes = CASE WHEN ? != '' THEN ? ELSE notes END
    WHERE id = ?
    """, (status, notes, notes, alert_id))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0

def get_database_stats() -> Dict[str, Any]:
    """Returns aggregated summary counts for the dashboard."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM soldier_logs WHERE action = 'LOGIN'")
    total_logins = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM security_alerts")
    total_alerts = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM security_alerts WHERE status = 'ACTIVE'")
    active_alerts = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM security_alerts WHERE siren_triggered = 1")
    siren_count = cursor.fetchone()[0]

    conn.close()
    return {
        "total_soldier_logins": total_logins,
        "total_security_alerts": total_alerts,
        "active_alerts": active_alerts,
        "siren_activations": siren_count
    }
