# 🛡️ AEGIS-VISION: Tactical AI Surveillance & Perimeter Defense System

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-brightgreen?logo=vercel)](https://aegis-vision-4ztvomor5-heal-here.vercel.app/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-Object_Detection-FF6F00?logo=tensorflow&logoColor=white)](https://www.tensorflow.org/js)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00FFFF)](https://github.com/ultralytics/ultralytics)

**AEGIS-VISION** is a defense-grade perimeter surveillance and automated tactical intelligence platform. Designed for high-altitude border outposts (e.g., LAC Northern Sector / Himalayan FOBs), AEGIS combines deep learning object detection, in-browser edge neural networks, multi-spectral optical vision filters (Thermal, NVG, FLIR), biometric soldier logging, and real-time perimeter intrusion alarms with continuous audio siren synthetics.

---

## 🚀 Live Demo & Deployment
- **Frontend Command Center (Vercel)**: [https://aegis-vision-4ztvomor5-heal-here.vercel.app/](https://aegis-vision-4ztvomor5-heal-here.vercel.app/)
- **Live Camera AI Terminal**: [https://aegis-vision-4ztvomor5-heal-here.vercel.app/dashboard/camera/CAM-01](https://aegis-vision-4ztvomor5-heal-here.vercel.app/dashboard/camera/CAM-01)

---

## ⚡ Key Features

### 1. 👁️ Dual-Layer AI Vision & Object Detection
- **Cloud/Edge Local Webcam AI**: In-browser real-time object detection via `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd` with zero server latency.
- **Optical Foreground & Saliency Engine**: Fallback pixel-gradient analyzer that tracks non-human intrusions (utensils, chargers, cables, phones, weapons, and metallic tools).
- **Backend YOLOv8 Inference**: Python FastAPI service with Ultralytics YOLOv8 delivering 30+ FPS tensor processing and bounding vector telemetry over WebSockets.
- **Tactical Class Partitioning**:
  - 🟢 **Authorized Humans**: Highlighted with green HUD brackets (`SOLDIER: HUMAN [AUTHORIZED]`).
  - 🔴 **Non-Human Intrusion Threats**: Framed with red tactical threat reticles (`🚨 NON-HUMAN OBJECT // SIREN ACTIVE`).

### 2. 🔊 Autonomous Continuous Tactical Siren
- Synthesized in real-time via the **Web Audio API** (no static audio files required).
- Continuous pitch-sweeping tactical siren (550 Hz – 1350 Hz LFO modulation).
- **Persistence & Hysteresis Hold**: Ensures audio wails continuously as long as unauthorized objects remain in the line of sight.

### 3. 🌐 Multi-Spectral Vision Modes
- **Normal Vision (EO)**: Full-color visible light high-definition feed.
- **Thermal Imaging**: False-color heat signature contrast rendering.
- **NVG (Night Vision Goggles)**: High-contrast phosphor green luminance amplification.
- **FLIR (Forward-Looking Infrared)**: High-gain tactical thermographic sensor simulation.

### 4. 🧭 Complete Tactical Command & Control Suite
- **Tactical Overview**: DEFCON readiness status, active radar contacts, sector threat heatmaps, and system health telemetry.
- **Multi-Camera Matrix**: Grid view across high-altitude cameras (`CAM-01 LAC Ridge`, `CAM-02 Main Gate`, `CAM-03 Thermal Perimeter`, `CAM-04 Drone Aerial Recon`).
- **Alert Center**: Incident categorization (High / Medium / Low), sound alarm controls, escalation triggers, and forensic incident exports.
- **Personnel & Soldier Duty Logs**: SQLite-persisted soldier duty check-ins, terminal access logs, and biometric activity streams.
- **Restricted Zones & Geofencing**: Polygon coordinate mapping with automatic breach detection and visual alert tripwires.
- **Analytics & Incident Heatmaps**: Historical threat trend graphs, intrusion frequency breakdowns, and sector vulnerability reports.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI/UX** | React 18, TypeScript, Vite, Vanilla CSS Design System, Lucide Icons, Chart.js |
| **Edge AI (In-Browser)** | TensorFlow.js, COCO-SSD MobileNetV2, HTML5 Canvas 2D, Web Audio API |
| **Backend API & Stream** | Python 3.10+, FastAPI, Uvicorn, Ultralytics YOLOv8, OpenCV, WebSockets |
| **Database** | SQLite (with WAL mode), SQLAlchemy / SQLite3 |
| **Container & Hosting** | Docker, Vercel (Client SPA), Render (FastAPI / YOLOv8 Backend) |

---

## 📂 Repository Structure

```text
AEGIS-VISION/
├── backend/                  # FastAPI & YOLOv8 backend service
│   ├── main.py               # REST endpoints, WebSocket feed, and camera loop
│   ├── requirements.txt      # Python dependencies (FastAPI, YOLOv8, OpenCV)
│   ├── aegis_vision.db       # SQLite database for alerts, logs, and personnel
│   ├── yolov8n.pt            # Pretrained YOLOv8 Nano model weights
│   └── services/             # Database and vision engine helpers
├── frontend/                 # React + TypeScript + Vite frontend application
│   ├── src/
│   │   ├── components/       # Tactical HUD, CameraThumbnails, Modals
│   │   ├── layouts/          # DashboardLayout & Defense Sidebar
│   │   ├── pages/            # Overview, CameraMonitoring, AlertCenter, Personnel, etc.
│   │   ├── utils/            # visionDetector.ts (AI Engine), siren.ts (Web Audio)
│   │   └── config.ts         # API & WebSocket environment configuration
│   ├── package.json          # Node dependencies (@tensorflow/tfjs, lucide-react)
│   ├── vite.config.ts        # Vite build & proxy configuration
│   └── vercel.json           # Vercel SPA routing rules
├── Dockerfile                # Production container specification
├── render.yaml               # Render Cloud infrastructure definition
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Python**: `3.10` or higher
- **Git**

---

### 2. Frontend Setup (Client SPA)

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (includes TensorFlow.js & COCO-SSD)
npm install

# Start the Vite development server
npm run dev
```
The frontend will launch at: `http://localhost:5173`

---

### 3. Backend Setup (FastAPI + YOLOv8)

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Start the FastAPI backend server
python main.py
```
The backend API will run on `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.

---

## 📦 Deployment Instructions

### Deploying Frontend to Vercel
1. Push this repository to GitHub.
2. Link the repository on [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Build command: `npm run build`, Output directory: `dist`.
5. Add environment variable (optional for remote backend):
   - `VITE_API_URL`: Your deployed FastAPI backend URL (e.g., `https://aegis-vision-backend.onrender.com`)

### Deploying Backend to Render / Docker
1. Create a **Web Service** on [Render](https://render.com).
2. Choose **Docker** runtime (using the root `Dockerfile`) or **Python 3** environment.
3. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`.

---

## 🔒 Security & Privacy Notice
- Local webcam feeds are processed **entirely client-side** inside the browser using WebAssembly / WebGL via TensorFlow.js unless explicitly routed through an authenticated backend stream.
- No video frames or biometric face captures are stored without explicit operator authorization.

---

## 📜 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
