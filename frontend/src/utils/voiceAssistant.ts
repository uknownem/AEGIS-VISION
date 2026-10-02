// AEGIS AI Tactical Voice Command Engine
// Web Speech API: Speech Recognition + Speech Synthesis with Strict Military Terminology & Command Enforcement

import { tacticalSiren } from './siren';
import { alertSync } from './alertSync';

export interface VoiceCommandDef {
  id: string;
  category: 'DEFENSE' | 'OPTICS' | 'NAVIGATION' | 'AUDIT' | 'STATUS';
  name: string;
  triggers: string[];
  description: string;
  action: (args?: any) => string; // Returns military confirmation response
}

export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'EXECUTING' | 'ERROR';

class VoiceAssistantService {
  private recognition: any = null;
  private isListening: boolean = false;
  private listeners: Set<(state: VoiceState, transcript: string, responseMsg: string) => void> = new Set();
  private navigationCallback: ((path: string) => void) | null = null;
  private filterCallback: ((mode: string) => void) | null = null;
  private reportModalCallback: (() => void) | null = null;
  private addCamModalCallback: (() => void) | null = null;
  private defconCallback: ((level: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.notifyState('LISTENING', 'Listening for tactical command...', '');
        };

        this.recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          this.notifyState('PROCESSING', transcript, '');

          if (event.results[0].isFinal) {
            this.handleCommand(transcript.trim());
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Voice recognition error:', event.error);
          this.isListening = false;
          if (event.error !== 'no-speech') {
            this.speak('Negative Commander. Voice recognition error. Please retry command.');
            this.notifyState('ERROR', '', 'Negative Commander. Voice input error.');
          } else {
            this.notifyState('IDLE', '', '');
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };
      }
    }
  }

  // Bind UI callbacks
  public registerCallbacks(opts: {
    navigate?: (path: string) => void;
    setVisionMode?: (mode: string) => void;
    openReportModal?: () => void;
    openAddCamModal?: () => void;
    setDefcon?: (level: string) => void;
  }) {
    if (opts.navigate) this.navigationCallback = opts.navigate;
    if (opts.setVisionMode) this.filterCallback = opts.setVisionMode;
    if (opts.openReportModal) this.reportModalCallback = opts.openReportModal;
    if (opts.openAddCamModal) this.addCamModalCallback = opts.openAddCamModal;
    if (opts.setDefcon) this.defconCallback = opts.setDefcon;
  }

  // Subscribe to voice state updates
  public subscribe(cb: (state: VoiceState, transcript: string, responseMsg: string) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notifyState(state: VoiceState, transcript: string, responseMsg: string) {
    this.listeners.forEach(cb => {
      try { cb(state, transcript, responseMsg); } catch {}
    });
  }

  // Start or Stop listening
  public toggleListening() {
    if (!this.recognition) {
      this.speak('Negative Commander. Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      try { this.recognition.stop(); } catch {}
      this.isListening = false;
      this.notifyState('IDLE', '', '');
    } else {
      try {
        tacticalSiren.initContext();
        this.recognition.start();
      } catch {
        this.isListening = false;
      }
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  // Military Text-to-Speech Engine
  public speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop ongoing audio
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95; // Slightly lower tactical pitch
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  // Command Matcher with Strict Enforcement
  public handleCommand(rawTranscript: string) {
    const text = rawTranscript.toLowerCase().replace(/[^\w\s]/gi, '');
    console.log('Voice Command Input:', text);

    let matchedResponse = '';

    // 1. DEFCON Commands
    if (text.includes('defcon 1') || text.includes('maximum combat')) {
      if (this.defconCallback) this.defconCallback('DEFCON 1');
      matchedResponse = "DEFCON 1 engaged! Coffee's poured, lasers are primed, let's keep the base 100% secure, Commander!";
    } else if (text.includes('defcon 2') || text.includes('high readiness')) {
      if (this.defconCallback) this.defconCallback('DEFCON 2');
      matchedResponse = 'DEFCON 2 activated! Eyes sharp and tea ready, standing on high alert!';
    } else if (text.includes('defcon 3') || text.includes('elevated guard')) {
      if (this.defconCallback) this.defconCallback('DEFCON 3');
      matchedResponse = 'DEFCON 3 set! Keeping an extra eye on the perimeter sensors.';
    } else if (text.includes('defcon 4') || text.includes('normal watch')) {
      if (this.defconCallback) this.defconCallback('DEFCON 4');
      matchedResponse = 'DEFCON 4 engaged. All smooth on routine patrol watch, Commander!';
    } else if (text.includes('defcon 5') || text.includes('peace') || text.includes('low threat')) {
      if (this.defconCallback) this.defconCallback('DEFCON 5');
      matchedResponse = 'DEFCON 5 active! Peaceful skies and clear horizons today!';
    }
    
    // 2. Siren & Alarm Commands
    else if (text.includes('silence siren') || text.includes('stop siren') || text.includes('mute alarm') || text.includes('silence alarm')) {
      tacticalSiren.stop();
      matchedResponse = 'Ah, sweet silence restored! Siren muted, Commander.';
    } else if (text.includes('test siren') || text.includes('test alarm') || text.includes('trigger siren')) {
      tacticalSiren.playTestSiren(2000);
      matchedResponse = "Testing the siren sound! Hold onto your ears, it's a loud one!";
    }

    // 3. Vision Mode Optics Commands
    else if (text.includes('thermal') || text.includes('flir')) {
      if (this.filterCallback) this.filterCallback('flir');
      matchedResponse = 'Thermal vision ON! Ooh, looking nice and cozy in heat-vision mode!';
    } else if (text.includes('night vision') || text.includes('nvg')) {
      if (this.filterCallback) this.filterCallback('nvg');
      matchedResponse = 'Bravo Six, going dark! Night vision optics activated!';
    } else if (text.includes('normal mode') || text.includes('standard feed') || text.includes('normal optical')) {
      if (this.filterCallback) this.filterCallback('normal');
      matchedResponse = 'Back to crisp, clear standard optical feed!';
    }

    // 4. Camera Navigation Commands
    else if (text.includes('camera 1') || text.includes('cam 1') || text.includes('himalayan')) {
      if (this.navigationCallback) this.navigationCallback('/dashboard/camera/CAM-01');
      matchedResponse = 'Switching to Camera 01! Himalayan ridge breeze included for free.';
    } else if (text.includes('camera 2') || text.includes('cam 2') || text.includes('main gate')) {
      if (this.navigationCallback) this.navigationCallback('/dashboard/camera/CAM-02');
      matchedResponse = 'Opening Camera 02 at the Main Gate! Keeping guard on the main entry.';
    } else if (text.includes('camera 3') || text.includes('cam 3') || text.includes('armory')) {
      if (this.navigationCallback) this.navigationCallback('/dashboard/camera/CAM-03');
      matchedResponse = 'Switching to Camera 03 at the Thermal Overwatch Mast!';
    } else if (text.includes('camera 4') || text.includes('cam 4') || text.includes('drone') || text.includes('uav')) {
      if (this.navigationCallback) this.navigationCallback('/dashboard/camera/CAM-04');
      matchedResponse = 'UAV aerial drone view coming right up! Keep your eyes on the skies!';
    } else if (text.includes('show overview') || text.includes('open dashboard') || text.includes('go to overview')) {
      if (this.navigationCallback) this.navigationCallback('/dashboard');
      matchedResponse = 'Bringing up the main tactical overview map!';
    } else if (text.includes('show analytics') || text.includes('open analytics')) {
      if (this.navigationCallback) this.navigationCallback('/dashboard/analytics');
      matchedResponse = 'Analytics loaded! Let’s crunch those threat numbers!';
    } else if (text.includes('show status') || text.includes('system status')) {
      if (this.navigationCallback) this.navigationCallback('/dashboard/status');
      matchedResponse = 'Checking system status! All servers and sensors reporting in!';
    } else if (text.includes('pair wifi') || text.includes('add camera') || text.includes('pair phone')) {
      if (this.addCamModalCallback) this.addCamModalCallback();
      matchedResponse = 'Opening the camera pairing wizard! Let’s get that phone camera hooked up!';
    }

    // 5. Alert & Report Commands
    else if (text.includes('acknowledge') || text.includes('ack threat')) {
      const alerts = alertSync.getAlerts();
      const active = alerts.find(a => a.status === 'ACTIVE');
      if (active) {
        alertSync.updateAlertStatus(active.id, 'ACKNOWLEDGED');
        matchedResponse = `Got it! Threat #${active.id} acknowledged. I'll make sure nobody sneaks past us!`;
      } else {
        matchedResponse = 'All clear! No unacknowledged threats waiting right now.';
      }
    } else if (text.includes('resolve alert') || text.includes('clear threat')) {
      const alerts = alertSync.getAlerts();
      const active = alerts.find(a => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED');
      if (active) {
        alertSync.updateAlertStatus(active.id, 'RESOLVED');
        matchedResponse = `Threat #${active.id} resolved! Excellent work, Commander. Danger neutralised!`;
      } else {
        matchedResponse = 'All sector threats are already clear! Great job!';
      }
    } else if (text.includes('generate report') || text.includes('print report') || text.includes('incident report')) {
      if (this.reportModalCallback) this.reportModalCallback();
      matchedResponse = 'Crafting your Top Secret incident report right away. Looking sharp as always!';
    }

    // 6. Status & Duty Queries
    else if (text.includes('report status') || text.includes('check status')) {
      const alerts = alertSync.getAlerts();
      const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
      matchedResponse = `AEGIS grid is running super smooth! ${activeCount} active threats on watch right now!`;
    } else if (text.includes('who is on duty') || text.includes('check personnel')) {
      let opName = 'Subedar Vikram Singh';
      try {
        const sess = localStorage.getItem('aegis_session');
        if (sess) {
          const p = JSON.parse(sess);
          if (p.operatorName) opName = `${p.rank || ''} ${p.operatorName}`;
        }
      } catch {}
      matchedResponse = `Commander ${opName} is at the helm today! You're in great hands!`;
    }

    // STRICT UNRECOGNIZED COMMAND FALLBACK WITH WITTY BANTER
    else {
      matchedResponse = "Oops, I didn't quite catch that one, Commander! Try asking according to the command cheatsheet!";
    }

    // Speak and notify UI
    this.speak(matchedResponse);
    this.notifyState('EXECUTING', rawTranscript, matchedResponse);
  }
}

export const voiceAssistant = new VoiceAssistantService();
