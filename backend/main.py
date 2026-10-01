import sys
import os

# Ensure backend and current working directory are on sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import asyncio
import cv2
import json
import time
import math
from contextlib import asynccontextmanager
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np

try:
    from services.vision_engine import calculate_target_distance
    from services.database import (
        init_db,
        record_soldier_login,
        get_soldier_logs,
        record_security_alert,
        get_security_alerts,
        update_alert_status,
        get_database_stats
    )
except ImportError:
    from backend.services.vision_engine import calculate_target_distance
    from backend.services.database import (
        init_db,
        record_soldier_login,
        get_soldier_logs,
        record_security_alert,
        get_security_alerts,
        update_alert_status,
        get_database_stats
    )


try:
    from ultralytics import YOLO
    model = YOLO("yolov8n.pt")
except Exception as e:
    print(f"[AEGIS-VISION] YOLOv8 Model warning: {e}")
    model = None

# Camera coordinates and matrices
MOCK_CAMERA_COORDS = (35.6895, 139.6917, 10.0)
MOCK_CAMERA_MATRIX = np.array([
    [800.0, 0.0, 320.0],
    [0.0, 800.0, 240.0],
    [0.0, 0.0, 1.0]
])
MOCK_EXTRINSIC_MATRIX = np.array([
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0]
])

active_connections = set()
latest_frame_jpg = None
last_alert_logged_time = 0.0 # Alert debounce throttle (max 1 DB alert write per 6 seconds)

# --- Pydantic Data Models ---

class SoldierLoginRequest(BaseModel):
    service_number: str = Field(..., example="IA-948201")
    name: str = Field(..., example="Subedar Vikram Singh")
    rank: str = Field(..., example="Subedar")
    unit: str = Field(..., example="14 Corps - High Altitude Recon")
    action: str = Field(default="LOGIN", example="LOGIN")
    terminal_id: str = Field(default="TERMINAL-SECTOR-4", example="TERMINAL-SECTOR-4")
    ip_address: Optional[str] = Field(default="10.14.0.1")
    status: Optional[str] = Field(default="AUTHORIZED")

class SecurityAlertRequest(BaseModel):
    alert_type: str = Field(..., example="NON_HUMAN_INTRUSION")
    target_class: str = Field(..., example="charger / spoon / vehicle")
    confidence: float = Field(..., example=0.94)
    camera_id: str = Field(..., example="CAM-01")
    sector: str = Field(default="Perimeter Defense Sector")
    siren_triggered: bool = Field(default=True)
    status: str = Field(default="ACTIVE")
    distance_meters: float = Field(default=0.0)
    notes: Optional[str] = Field(default="")

class AlertStatusUpdateRequest(BaseModel):
    status: str = Field(..., example="ACKNOWLEDGED") # ACTIVE, ACKNOWLEDGED, RESOLVED, ESCALATED
    notes: Optional[str] = Field(default="")

def generate_synthetic_frame(t_step: float):
    """Generates an animated tactical optical/thermal surveillance frame if physical camera is offline."""
    w, h = 640, 480
    frame = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Grid lines
    for x in range(0, w, 40):
        cv2.line(frame, (x, 0), (x, h), (18, 25, 20), 1)
    for y in range(0, h, 40):
        cv2.line(frame, (0, y), (w, y), (18, 25, 20), 1)
        
    # Horizon line
    cv2.line(frame, (0, h // 2), (w, h // 2), (30, 45, 35), 1)
    
    # Target 1 (Simulated Person)
    tx1 = int(280 + 140 * math.sin(t_step * 0.8))
    ty1 = int(220 + 40 * math.cos(t_step * 0.5))
    cv2.rectangle(frame, (tx1 - 25, ty1 - 50), (tx1 + 25, ty1 + 50), (0, 255, 100), 2)
    cv2.putText(frame, "PERSON 0.94", (tx1 - 25, ty1 - 56), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 100), 1)
    
    # Target 2 (Simulated Non-Human Object: Charger/Device / Tool)
    tx2 = int(180 + 120 * math.cos(t_step * 0.4))
    ty2 = int(320 + 30 * math.sin(t_step * 0.6))
    cv2.rectangle(frame, (tx2 - 35, ty2 - 25), (tx2 + 35, ty2 + 25), (0, 0, 255), 2)
    cv2.putText(frame, "NON-HUMAN: CHARGER / OBJECT 0.89", (tx2 - 35, ty2 - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1)

    # Tactical HUD Overlay
    cv2.putText(frame, "AEGIS-VISION OPTICAL SENSOR [CAM-01]", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 100), 1)
    cv2.putText(frame, f"TIME: {time.strftime('%H:%M:%S UTC')}  LAT:35.6895 LON:139.6917", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (160, 180, 160), 1)
    cv2.putText(frame, "[ LIVE AI DETECT // YOLOv8 ]", (w - 240, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 100), 1)

    # Crosshair
    cx, cy = w // 2, h // 2
    cv2.line(frame, (cx - 15, cy), (cx + 15, cy), (0, 255, 100), 1)
    cv2.line(frame, (cx, cy - 15), (cx, cy + 15), (0, 255, 100), 1)

    synthetic_metadata = [
        {
            "class_id": 0,
            "class_name": "person",
            "confidence": 0.94,
            "bbox": [tx1 - 25, ty1 - 50, tx1 + 25, ty1 + 50],
            "distance_data": calculate_target_distance(MOCK_CAMERA_COORDS, [tx1 - 25, ty1 - 50, tx1 + 25, ty1 + 50], MOCK_CAMERA_MATRIX, MOCK_EXTRINSIC_MATRIX),
            "is_non_human": False
        },
        {
            "class_id": 67,
            "class_name": "cell phone / charger",
            "confidence": 0.89,
            "bbox": [tx2 - 35, ty2 - 25, tx2 + 35, ty2 + 25],
            "distance_data": calculate_target_distance(MOCK_CAMERA_COORDS, [tx2 - 35, ty2 - 25, tx2 + 35, ty2 + 25], MOCK_CAMERA_MATRIX, MOCK_EXTRINSIC_MATRIX),
            "is_non_human": True
        }
    ]
    
    return frame, synthetic_metadata

def open_camera():
    """Attempts to open physical webcam with DirectShow for Windows, then fallback."""
    cap = None
    try:
        cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        if not cap.isOpened():
            cap = cv2.VideoCapture(0)
    except Exception:
        try:
            cap = cv2.VideoCapture(0)
        except Exception:
            cap = None

    if cap is not None and cap.isOpened():
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        print("[AEGIS-VISION] Physical webcam successfully opened (DirectShow/0).")
        return cap
    print("[AEGIS-VISION] Physical webcam not available; using standby simulation.")
    return None

async def video_processing_loop():
    """
    Background task to capture video frames from physical webcam, run YOLOv8 object detection, 
    broadcast tracking metadata, and automatically save non-human incursion alerts into SQLite database.
    """
    global latest_frame_jpg, last_alert_logged_time
    cap = open_camera()

    t = 0.0
    last_reconnect_attempt = time.time()

    while True:
        frame = None
        metadata = []
        is_real_cam = False

        if (cap is None or not cap.isOpened()) and (time.time() - last_reconnect_attempt > 3.0):
            last_reconnect_attempt = time.time()
            cap = open_camera()

        if cap is not None and cap.isOpened():
            try:
                ret, cam_frame = cap.read()
                if ret and cam_frame is not None:
                    frame = cam_frame
                    is_real_cam = True
                else:
                    cap.release()
                    cap = None
            except Exception:
                if cap is not None:
                    try:
                        cap.release()
                    except Exception:
                        pass
                cap = None
                is_real_cam = False

        if is_real_cam and frame is not None and model is not None:
            try:
                # Universal YOLOv8 detection for all physical objects
                results = model(frame, verbose=False, conf=0.25)
                annotated_frame = results[0].plot()
                
                cv2.putText(annotated_frame, f"AEGIS-VISION LIVE // {time.strftime('%H:%M:%S UTC')}", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 100), 1)

                non_human_count = 0
                first_non_human_name = None
                first_non_human_conf = 0.0

                for result in results:
                    for box in result.boxes:
                        cls_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        target_box = [x1, y1, x2, y2]
                        class_name = model.names[cls_id] if cls_id in model.names else f"object_{cls_id}"
                        is_non_human = (cls_id != 0) # 0 is 'person' in COCO. All other classes are non-human.
                        
                        if is_non_human:
                            non_human_count += 1
                            if first_non_human_name is None:
                                first_non_human_name = class_name
                                first_non_human_conf = confidence

                        distance_info = calculate_target_distance(
                            MOCK_CAMERA_COORDS, 
                            target_box, 
                            MOCK_CAMERA_MATRIX, 
                            MOCK_EXTRINSIC_MATRIX
                        )

                        metadata.append({
                            "class_id": cls_id,
                            "class_name": class_name,
                            "confidence": round(confidence, 3),
                            "bbox": target_box,
                            "distance_data": distance_info,
                            "is_non_human": is_non_human
                        })
                
                # Visual warning banner on video feed
                if non_human_count > 0:
                    cv2.rectangle(annotated_frame, (10, 440), (630, 475), (0, 0, 220), -1)
                    cv2.putText(annotated_frame, f"NON-HUMAN OBJECT INTRUSION // SIREN ACTIVE ({non_human_count} ITEMS)", (18, 462), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

                    # Auto-persist alert to Database with 6-second throttle
                    if (time.time() - last_alert_logged_time > 6.0):
                        last_alert_logged_time = time.time()
                        try:
                            record_security_alert(
                                alert_type="NON_HUMAN_INTRUSION",
                                target_class=first_non_human_name or "non_human_object",
                                confidence=round(first_non_human_conf, 3),
                                camera_id="CAM-01",
                                sector="Perimeter Checkpoint Alpha",
                                siren_triggered=True,
                                status="ACTIVE",
                                distance_meters=1.5,
                                notes=f"Automatic AI detection: {first_non_human_name} entered monitoring screen."
                            )
                        except Exception as dbe:
                            print(f"[AEGIS-VISION DB Error] {dbe}")

                _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                latest_frame_jpg = buffer.tobytes()
            except Exception as e:
                print(f"[AEGIS-VISION] Frame processing error: {e}")
                frame = None

        if frame is None:
            t += 0.05
            synth_frame, metadata = generate_synthetic_frame(t)
            _, buffer = cv2.imencode('.jpg', synth_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            latest_frame_jpg = buffer.tobytes()

        # Broadcast metadata to connected WebSockets
        if active_connections and metadata:
            has_non_human = any(d.get("is_non_human", d.get("class_id") != 0) for d in metadata)
            non_human_targets = [d.get("class_name", "object") for d in metadata if d.get("is_non_human", d.get("class_id") != 0)]
            
            message = json.dumps({
                "type": "detections",
                "count": len(metadata),
                "data": metadata,
                "has_non_human": has_non_human,
                "non_human_targets": non_human_targets,
                "alert_trigger": "SIREN_ACTIVE" if has_non_human else "NORMAL",
                "timestamp": time.time()
            })
            for connection in list(active_connections):
                try:
                    await connection.send_text(message)
                except Exception:
                    active_connections.discard(connection)
        
        await asyncio.sleep(0.033)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite Database tables and seeds
    init_db()
    task = asyncio.create_task(video_processing_loop())
    yield
    task.cancel()

app = FastAPI(title="AEGIS-VISION Backend", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSocket Stream ---

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.discard(websocket)
    except Exception:
        active_connections.discard(websocket)

# --- Video Feed Routes ---

def generate_frames():
    global latest_frame_jpg
    while True:
        if latest_frame_jpg is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + latest_frame_jpg + b'\r\n')
        time.sleep(0.033)

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/video_feed/{camera_id}")
def camera_video_feed(camera_id: str):
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

# --- SOLDIER AUTHENTICATION & LOGIN DATABASE ROUTES ---

@app.post("/api/auth/soldier-login")
def save_soldier_login(req: SoldierLoginRequest):
    """
    Saves a soldier's duty login timestamp, service ID, rank, and station to the database.
    """
    log_entry = record_soldier_login(
        service_number=req.service_number,
        name=req.name,
        rank=req.rank,
        unit=req.unit,
        action=req.action,
        terminal_id=req.terminal_id,
        ip_address=req.ip_address or "10.14.0.1",
        status=req.status or "AUTHORIZED"
    )
    return {"status": "success", "message": "Soldier login successfully logged in database", "data": log_entry}

@app.get("/api/auth/soldier-logs")
def list_soldier_login_logs(limit: int = Query(default=50, le=200)):
    """
    Retrieves the persistent audit log of all soldier login and check-in times.
    """
    logs = get_soldier_logs(limit=limit)
    return {"status": "success", "count": len(logs), "data": logs}

# --- SECURITY ALERTS & SIREN LOG DATABASE ROUTES ---

@app.post("/api/alerts")
def create_security_alert(req: SecurityAlertRequest):
    """
    Saves an alert when triggered (e.g. Non-Human intrusion or camouflage alert) to the database.
    """
    alert_entry = record_security_alert(
        alert_type=req.alert_type,
        target_class=req.target_class,
        confidence=req.confidence,
        camera_id=req.camera_id,
        sector=req.sector,
        siren_triggered=req.siren_triggered,
        status=req.status,
        distance_meters=req.distance_meters,
        notes=req.notes or ""
    )
    return {"status": "success", "message": "Security alert saved in database", "data": alert_entry}

@app.get("/api/alerts")
def list_alerts(limit: int = Query(default=50, le=200), status: Optional[str] = None):
    """
    Retrieves all persistent security alerts and siren activations from the database.
    """
    alerts = get_security_alerts(limit=limit, status=status)
    return {"status": "success", "count": len(alerts), "data": alerts}

@app.patch("/api/alerts/{alert_id}")
def modify_alert_status(alert_id: int, req: AlertStatusUpdateRequest):
    """
    Updates the status of an alert (e.g. ACKNOWLEDGED, RESOLVED, ESCALATED).
    """
    success = update_alert_status(alert_id=alert_id, status=req.status, notes=req.notes or "")
    if not success:
        raise HTTPException(status_code=404, detail="Alert ID not found")
    return {"status": "success", "message": f"Alert {alert_id} updated to {req.status}"}

@app.get("/api/database/stats")
def database_statistics():
    """
    Returns total soldier logins, active alerts, and siren activations from the database.
    """
    stats = get_database_stats()
    return {"status": "success", "stats": stats}

@app.get("/")
def read_root():
    return {"message": "AEGIS-VISION Real-Time Defense Vision System API with Persistent SQLite Database", "status": "online"}

@app.get("/health")
def health_check():
    return {"status": "ok", "active_ws_clients": len(active_connections)}
