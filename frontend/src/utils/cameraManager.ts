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
  private lastDeletedCamera: CameraItem | null = null;

  public getCameras(): CameraItem[] {
    const defaultCameras = mockCameras as CameraItem[];
    if (typeof window === 'undefined') return [...defaultCameras];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}

    return [...defaultCameras];
  }

  public addExternalCamera(newCam: Omit<CameraItem, 'id' | 'status'> & { id?: string; status?: 'live' | 'offline' | 'warning' }): CameraItem {
    const cameras = this.getCameras();
    const camId = newCam.id || `EXT-CAM-${String(cameras.length + 1).padStart(2, '0')}`;
    
    const cameraRecord: CameraItem = {
      ...newCam,
      id: camId,
      status: newCam.status || 'live'
    };

    const updated = [cameraRecord, ...cameras.filter(c => c.id !== camId)];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('aegis_cameras_updated'));
    }

    return cameraRecord;
  }

  public deleteCamera(id: string): CameraItem | null {
    const cameras = this.getCameras();
    const target = cameras.find(c => c.id === id);
    if (!target) return null;

    this.lastDeletedCamera = target;
    const updated = cameras.filter(c => c.id !== id);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('aegis_cameras_updated'));
    }

    return target;
  }

  public undoDeleteCamera(): CameraItem | null {
    if (!this.lastDeletedCamera) return null;
    const item = this.lastDeletedCamera;
    this.addExternalCamera(item);
    this.lastDeletedCamera = null;
    return item;
  }

  public getLastDeleted(): CameraItem | null {
    return this.lastDeletedCamera;
  }

  public resetToDefault() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      this.lastDeletedCamera = null;
      window.dispatchEvent(new Event('aegis_cameras_updated'));
    }
  }
}

export const cameraManager = new CameraManagerService();
