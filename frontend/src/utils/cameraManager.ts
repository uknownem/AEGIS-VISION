import { mockCameras } from '../mockData';

export interface CameraItem {
  id: string;
  name: string;
  type: string;
  zone: string;
  status: 'live' | 'offline' | 'warning';
  streamType?: 'simulated' | 'webcam' | 'ip_wifi' | 'rtsp';
  ipAddress?: string;
  port?: string;
  rtspUrl?: string;
  coverImage?: string;
}

const STORAGE_KEY = 'aegis_custom_cameras';

export class CameraManagerService {
  public getCameras(): CameraItem[] {
    const defaultCameras = mockCameras as CameraItem[];
    if (typeof window === 'undefined') return [...defaultCameras];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, CameraItem>();
          defaultCameras.forEach(c => map.set(c.id, c));
          parsed.forEach((c: CameraItem) => map.set(c.id, c));
          return Array.from(map.values());
        }
      }
    } catch {}

    return [...defaultCameras];
  }

  public addExternalCamera(newCam: Omit<CameraItem, 'id' | 'status'> & { id?: string }): CameraItem {
    const cameras = this.getCameras();
    const camId = newCam.id || `EXT-CAM-${String(cameras.length + 1).padStart(2, '0')}`;
    
    const cameraRecord: CameraItem = {
      ...newCam,
      id: camId,
      status: 'live'
    };

    const updated = [cameraRecord, ...cameras.filter(c => c.id !== camId)];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('aegis_cameras_updated'));
    }

    return cameraRecord;
  }

  public deleteCamera(id: string) {
    const cameras = this.getCameras().filter(c => c.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cameras));
      window.dispatchEvent(new Event('aegis_cameras_updated'));
    }
  }

  public resetToDefault() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('aegis_cameras_updated'));
    }
  }
}

export const cameraManager = new CameraManagerService();
