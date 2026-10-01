import asyncio
import cv2
import json
import time
import math
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from services.vision_engine import calculate_target_distance

try:
    from ultralytics import YOLO
    model = YOLO("yolov8n.pt")
except Exception as e:
    print(f"[AEGIS-VISION] YOLOv8 Model warning: {e}")
    model = None

# Mock camera parameters (calibrate with real data later)
MOCK_CAMERA_COORDS = (35.6895, 139.6917, 10.0) # lat, lon, altitude in meters

# Intrinsic matrix (focal length = 800, optical center = 320, 240)
MOCK_CAMERA_MATRIX = np.array([
    [800.0, 0.0, 320.0],
    [0.0, 800.0, 240.0],
    [0.0, 0.0, 1.0]
])

# Extrinsic matrix
MOCK_EXTRINSIC_MATRIX = np.array([
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0]
])

TARGET_CLASSES = [0, 2, 3, 5, 7] # 0: person, 2: car, 3: motorcycle, 5: bus, 7: truck

active_connections = set()
latest_frame_jpg = None

def generate_synthetic_frame(t_step: float):
    """Generates an animated tactical optical/thermal surveillance frame if physical camera is offline."""
    w, h = 640, 480
    frame = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Grid lines
    for x in range(0, w, 40):
        cv2.line(frame, (x, 0), (x, h), (18, 25, 20), 1)
    for y in range(0, h, 40):
        cv2.line(frame, (0, y), (w, y), (18, 25, 20), 1)
        
    # Horizon line & altitude markings
    cv2.line(frame, (0, h // 2), (w, h // 2), (30, 45, 35), 1)
    
    # Animated patrol target 1 (Simulated Person)
    tx1 = int(280 + 140 * math.sin(t_step * 0.8))
    ty1 = int(220 + 40 * math.cos(t_step * 0.5))
    cv2.rectangle(frame, (tx1 - 25, ty1 - 50), (tx1 + 25, ty1 + 50), (0, 255, 100), 2)
    cv2.putText(frame, "PERSON 0.94", (tx1 - 25, ty1 - 56), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 100), 1)
    
    # Animated target 2 (Simulated Non-Human Object: Charger/Device / Tool)
    tx2 = int(180 + 120 * math.cos(t_step * 0.4))
    ty2 = int(320 + 30 * math.sin(t_step * 0.6))
    cv2.rectangle(frame, (tx2 - 35, ty2 - 25), (tx2 + 35, ty2 + 25), (0, 100, 255), 2)
    cv2.putText(frame, "NON-HUMAN: CHARGER/DEVICE 0.89", (tx2 - 35, ty2 - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 100, 255), 1)

    # Tactical HUD Overlay
    cv2.putText(frame, "AEGIS-VISION OPTICAL SENSOR [CAM-01]", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 100), 1)
    cv2.putText(frame, f"TIME: {time.strftime('%H:%M:%S UTC')}  LAT:35.6895 LON:139.6917", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (160, 180, 160), 1)
    cv2.putText(frame, "[ LIVE AI DETECT // YOLOv8 ]", (w - 240, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 100), 1)

    # Crosshair
    cx, cy = w // 2, h // 2
    cv2.line(frame, (cx - 15, cy), (cx + 15, cy), (0, 255, 100), 1)
    cv2.line(frame, (cx, cy - 15), (cx, cy + 15), (0, 255, 100), 1)

    # Simulated detection metadata for WS
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
    and broadcast the tracking metadata over WebSockets.
    """
    global latest_frame_jpg
    cap = open_camera()

    t = 0.0
    last_reconnect_attempt = time.time()

    while True:
        frame = None
        metadata = []
        is_real_cam = False

        # Periodic auto-reconnect if camera was unavailable or disconnected
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
                    # Frame read failed; release to allow reconnect
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
                # Universal YOLOv8 detection for all physical objects (spoons, chargers, phones, tools, cups, etc.)
                results = model(frame, verbose=False, conf=0.25)
                annotated_frame = results[0].plot()
                
                # Annotate HUD header
                cv2.putText(annotated_frame, f"AEGIS-VISION LIVE // {time.strftime('%H:%M:%S UTC')}", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 100), 1)

                non_human_count = 0
                for result in results:
                    for box in result.boxes:
                        cls_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        target_box = [x1, y1, x2, y2]
                        class_name = model.names[cls_id] if cls_id in model.names else f"object_{cls_id}"
                        is_non_human = (cls_id != 0) # 0 is 'person' in COCO. Anything else (spoon, charger, phone, bottle, etc.) is non-human.
                        if is_non_human:
                            non_human_count += 1

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
                
                # Visual warning banner if non-human object detected
                if non_human_count > 0:
                    cv2.rectangle(annotated_frame, (10, 440), (630, 475), (0, 0, 220), -1)
                    cv2.putText(annotated_frame, f"NON-HUMAN OBJECT INTRUSION DETECTED // SIREN ACTIVE ({non_human_count} ITEMS)", (18, 462), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

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
        
        await asyncio.sleep(0.033) # ~30 FPS

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(video_processing_loop())
    yield
    task.cancel()

app = FastAPI(title="AEGIS-VISION Backend", version="1.0.0", lifespan=lifespan)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def read_root():
    return {"message": "AEGIS-VISION Real-Time Defense Vision System API", "status": "online"}

@app.get("/health")
def health_check():
    return {"status": "ok", "active_ws_clients": len(active_connections)}


