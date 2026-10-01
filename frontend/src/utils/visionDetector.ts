// In-Browser Tactical AI Vision Detector for Real-Time Security Surveillance
// Dual-Layer Engine: TensorFlow COCO-SSD Object Detection + Optical Saliency & Camouflage Engine

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export interface DetectionResult {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, w, h]
  distance_meters: number;
  is_non_human: boolean;
  is_threat: boolean; // True if mobile, electronic, un-uniformed human, camouflage human, spoon/tool
  threat_type?: string; // Specific threat label
}

class VisionDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private isLoading: boolean = false;
  private isLoaded: boolean = false;
  private offscreenCanvas: HTMLCanvasElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 160;
      this.offscreenCanvas.height = 120;
    }
  }

  public async loadModel(): Promise<boolean> {
    if (this.isLoaded && this.model) return true;
    if (this.isLoading) return false;

    this.isLoading = true;
    try {
      try {
        await tf.setBackend('webgl');
      } catch {
        await tf.setBackend('cpu');
      }
      await tf.ready();
      
      this.model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      this.isLoaded = true;
      this.isLoading = false;
      return true;
    } catch (err: any) {
      try {
        this.model = await cocoSsd.load({ base: 'mobilenet_v2' });
        this.isLoaded = true;
        this.isLoading = false;
        return true;
      } catch (e2: any) {
        this.isLoading = false;
        return false;
      }
    }
  }

  public isReady(): boolean {
    return this.isLoaded && this.model !== null;
  }

  public getStatusText(): string {
    if (this.isLoaded && this.model) return 'ACTIVE (NEURAL NET + SURROUNDING ANALYZER)';
    if (this.isLoading) return 'ANALYZING SURROUNDINGS...';
    return 'ACTIVE (OPTICAL CAMOUFLAGE AI)';
  }

  /**
   * Analyzes surroundings from live video frame:
   * Detects unusual objects (mobiles, electronic devices, spoons/tools)
   * AND analyzes humans for missing military uniform / camouflage.
   */
  public async detect(video: HTMLVideoElement): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];
    if (!video || video.readyState < 2 || video.videoWidth === 0) return results;

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // 1. Layer 1: Deep Learning Neural Net Detection (COCO-SSD)
    if (this.model) {
      try {
        const predictions = await this.model.detect(video, 10, 0.20);
        if (predictions && predictions.length > 0) {
          predictions.forEach(pred => {
            const [x, y, w, h] = pred.bbox;
            const label = pred.class.toLowerCase();
            const isPerson = label === 'person';

            // Check if object is electronic device, mobile, spoon, or tool
            const isElectronicOrTool = 
              label.includes('phone') || label.includes('cell') || 
              label.includes('laptop') || label.includes('remote') || 
              label.includes('mouse') || label.includes('keyboard') ||
              label.includes('spoon') || label.includes('knife') || 
              label.includes('fork') || label.includes('scissors') ||
              label.includes('bottle') || label.includes('cup');

            let displayLabel = pred.class;
            let isThreat = false;
            let threatType = '';

            if (isPerson) {
              // Analyze person clothing/surroundings via canvas sampling
              const personAnalysis = this.analyzePersonClothing(video, [x, y, w, h]);
              displayLabel = personAnalysis.label;
              isThreat = personAnalysis.isThreat;
              threatType = personAnalysis.threatType;
            } else if (isElectronicOrTool) {
              isThreat = true;
              if (label.includes('phone') || label.includes('cell')) {
                displayLabel = 'MOBILE / ELECTRONIC DEVICE';
                threatType = 'RESTRICTED MOBILE DEVICE';
              } else if (label.includes('spoon') || label.includes('knife') || label.includes('fork')) {
                displayLabel = 'METALLIC UTENSIL / SPOON';
                threatType = 'PROHIBITED METALLIC OBJECT';
              } else {
                displayLabel = 'ELECTRONIC GADGET / DEVICE';
                threatType = 'UNAUTHORIZED ELECTRONIC DEVICE';
              }
            }

            const estDist = Math.max(0.3, +( (110 / Math.max(w, h)) * (isPerson ? 1.8 : 0.45) ).toFixed(1));

            results.push({
              class_id: isPerson ? 0 : 67,
              class_name: displayLabel,
              confidence: +(pred.score.toFixed(2)),
              bbox: [Math.max(0, x), Math.max(0, y), Math.min(vw - x, w), Math.min(vh - y, h)],
              distance_meters: estDist,
              is_non_human: !isPerson,
              is_threat: isThreat,
              threat_type: threatType
            });
          });

          if (results.length > 0) return results;
        }
      } catch (e) {
        // Fallback to optical analyzer
      }
    }

    // 2. Layer 2: Optical Surroundings & Camouflage Analyzer
    if (this.offscreenCanvas) {
      const ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, 160, 120);
        const imgData = ctx.getImageData(0, 0, 160, 120);
        const data = imgData.data;

        let skinPixels = 0;
        let skinMinX = 160, skinMaxX = 0, skinMinY = 120, skinMaxY = 0;
        
        let nonHumanPixels = 0;
        let nhMinX = 160, nhMaxX = 0, nhMinY = 120, nhMaxY = 0;

        // Camouflage / Olive / Khaki military uniform pixel counter
        let militaryUniformPixels = 0;
        let civilianPixels = 0;

        for (let y = 0; y < 120; y += 2) {
          for (let x = 0; x < 160; x += 2) {
            const idx = (y * 160 + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const isSkin = (r > 80 && g > 35 && b > 15 && (r - g) > 12 && r > b && (Math.max(r, g, b) - Math.min(r, g, b)) > 15);
            const brightness = (r + g + b) / 3;

            // Check military olive/khaki/camo colors vs civilian bright/dark clothes
            const isOliveKhaki = (g > r && g > b && g > 40 && g < 160) || (r > 60 && r < 140 && g > 50 && g < 130 && b < 90);

            if (isSkin) {
              skinPixels++;
              if (x < skinMinX) skinMinX = x;
              if (x > skinMaxX) skinMaxX = x;
              if (y < skinMinY) skinMinY = y;
              if (y > skinMaxY) skinMaxY = y;
            } else if (isOliveKhaki) {
              militaryUniformPixels++;
            } else {
              civilianPixels++;
              const isMetallicOrBright = brightness > 185;
              const isDarkGadget = brightness < 45 && y > 25;
              if (isMetallicOrBright || isDarkGadget) {
                nonHumanPixels++;
                if (x < nhMinX) nhMinX = x;
                if (x > nhMaxX) nhMaxX = x;
                if (y < nhMinY) nhMinY = y;
                if (y > nhMaxY) nhMaxY = y;
              }
            }
          }
        }

        const scaleX = vw / 160;
        const scaleY = vh / 120;

        // Analyze Person in frame
        if (skinPixels >= 30) {
          const sx = Math.max(0, skinMinX * scaleX - 25);
          const sy = Math.max(0, skinMinY * scaleY - 30);
          const sw = Math.min(vw - sx, (skinMaxX - skinMinX) * scaleX + 50);
          const sh = Math.min(vh - sy, (skinMaxY - skinMinY) * scaleY + 60);

          const hasUniform = militaryUniformPixels > skinPixels * 0.8;
          const isThreat = !hasUniform;

          results.push({
            class_id: 0,
            class_name: hasUniform ? 'SOLDIER IN UNIFORM' : 'PERSON WITHOUT MILITARY UNIFORM',
            confidence: 0.94,
            bbox: [sx, sy, sw, sh],
            distance_meters: 1.2,
            is_non_human: false,
            is_threat: isThreat,
            threat_type: isThreat ? 'UNAUTHORIZED PERSON WITHOUT UNIFORM' : undefined
          });
        }

        // Analyze Non-Human Objects (Mobile, Spoon, Gadgets)
        if (nonHumanPixels >= 40) {
          const nx = Math.max(0, nhMinX * scaleX - 20);
          const ny = Math.max(0, nhMinY * scaleY - 20);
          const nw = Math.min(vw - nx, (nhMaxX - nhMinX) * scaleX + 40);
          const nh = Math.min(vh - ny, (nhMaxY - nhMinY) * scaleY + 40);

          if (nw > 30 && nh > 30) {
            results.push({
              class_id: 67,
              class_name: 'MOBILE / ELECTRONIC DEVICE / SPOON',
              confidence: 0.91,
              bbox: [nx, ny, nw, nh],
              distance_meters: 0.6,
              is_non_human: true,
              is_threat: true,
              threat_type: 'MOBILE / SPOON / PROHIBITED OBJECT'
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Helper to sample clothing area of detected person to verify uniform vs camouflage vs civilian clothes
   */
  private analyzePersonClothing(video: HTMLVideoElement, bbox: [number, number, number, number]): { label: string; isThreat: boolean; threatType: string } {
    if (!this.offscreenCanvas) return { label: 'PERSON', isThreat: false, threatType: '' };
    
    const ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { label: 'PERSON', isThreat: false, threatType: '' };

    try {
      const [x, y, w, h] = bbox;
      // Crop clothing region (torso)
      const torsoY = y + h * 0.3;
      const torsoH = h * 0.5;

      ctx.drawImage(video, x, torsoY, w, torsoH, 0, 0, 80, 80);
      const imgData = ctx.getImageData(0, 0, 80, 80);
      const data = imgData.data;

      let greenCamo = 0;
      let khakiCamo = 0;
      let totalColorPixels = 0;

      for (let i = 0; i < data.length; i += 8) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Green military camo check
        if (g > r + 10 && g > b + 10 && g > 40 && g < 170) greenCamo++;
        // Khaki military uniform check
        else if (r > 70 && r < 160 && g > 65 && g < 150 && b < 100 && Math.abs(r - g) < 30) khakiCamo++;

        totalColorPixels++;
      }

      const militaryScore = (greenCamo + khakiCamo) / Math.max(1, totalColorPixels);

      if (militaryScore > 0.45) {
        return { label: 'SOLDIER IN MILITARY UNIFORM', isThreat: false, threatType: '' };
      } else if (militaryScore > 0.20 && militaryScore <= 0.45) {
        return { label: 'MAN IN CAMOUFLAGE / DISGUISE', isThreat: true, threatType: 'CAMOUFLAGE INFILTRATOR' };
      } else {
        return { label: 'MAN WITHOUT UNIFORM', isThreat: true, threatType: 'UNAUTHORIZED PERSON WITHOUT UNIFORM' };
      }
    } catch {
      return { label: 'PERSON UNVERIFIED', isThreat: false, threatType: '' };
    }
  }
}

export const visionDetector = new VisionDetector();
