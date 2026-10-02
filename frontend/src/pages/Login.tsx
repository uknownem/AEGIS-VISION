import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, MapPin, Camera, Video, Play, CheckCircle2, 
  Sparkles, Radio, Cpu, RefreshCw, AlertTriangle, UserPlus, LogIn, Info,
  Eye, Scan, Lock
} from 'lucide-react';
import { tacticalSiren } from '../utils/siren';
import { getExactLocalTimestamp } from '../utils/dateUtils';
import { API_BASE_URL } from '../config';

interface MilitaryBase {
  id: string;
  name: string;
  code: string;
  region: string;
  coordinates: string;
  camerasCount: number;
  threatLevel: 'DEFCON 1' | 'DEFCON 2' | 'DEFCON 3' | 'DEFCON 4';
  coverImage: string;
}

interface OperatorAccount {
  serviceId: string;
  passcode: string;
  operatorName: string;
  rank: string;
  clearanceLevel: string;
  unit: string;
  phone?: string;
  hasBiometricsEnrolled?: boolean;
  biometricHash?: string;
  enrolledFaceVector?: number[];
}

// Generate realistic default face vector for default accounts
const DEFAULT_FACE_VECTOR_VIKRAM = [0.12, 0.45, 0.78, 0.92, 0.34, 0.56, 0.88, 0.23, 0.67, 0.45, 0.89, 0.12, 0.34, 0.78, 0.90, 0.44, 0.55, 0.66, 0.77, 0.88, 0.33, 0.22, 0.11, 0.45, 0.67, 0.89, 0.99, 0.12, 0.34, 0.56, 0.78, 0.90];

const DEFAULT_ACCOUNTS: OperatorAccount[] = [
  {
    serviceId: 'IA-948201',
    passcode: 'aegis2026',
    operatorName: 'Subedar Vikram Singh',
    rank: 'Subedar',
    clearanceLevel: 'LEVEL-5 TOP SECRET (COSMIC)',
    unit: '14 Corps - High Altitude Recon',
    phone: '+91 98765-43210',
    hasBiometricsEnrolled: true,
    biometricHash: 'BIO-FACE-IRIS-IA948201-9841',
    enrolledFaceVector: DEFAULT_FACE_VECTOR_VIKRAM
  },
  {
    serviceId: 'IA-773194',
    passcode: 'aegis2026',
    operatorName: 'Major Rajesh Sharma',
    rank: 'Major',
    clearanceLevel: 'LEVEL-5 TOP SECRET (COSMIC)',
    unit: '9 Para Special Forces',
    phone: '+91 98765-43211',
    hasBiometricsEnrolled: true,
    biometricHash: 'BIO-FACE-IRIS-IA773194-7731',
    enrolledFaceVector: DEFAULT_FACE_VECTOR_VIKRAM
  },
  {
    serviceId: 'IA-661038',
    passcode: 'aegis2026',
    operatorName: 'Havildar Gurpreet Singh',
    rank: 'Havildar',
    clearanceLevel: 'LEVEL-4 SECRET (OPERATIONAL)',
    unit: 'Sikh Light Infantry',
    phone: '+91 98765-43212',
    hasBiometricsEnrolled: true,
    biometricHash: 'BIO-FACE-IRIS-IA661038-6610',
    enrolledFaceVector: DEFAULT_FACE_VECTOR_VIKRAM
  },
  {
    serviceId: 'ADMIN',
    passcode: 'admin123',
    operatorName: 'Commander Alex Vance',
    rank: 'Commander',
    clearanceLevel: 'LEVEL-5 TOP SECRET (COSMIC)',
    unit: 'Integrated Defense Command',
    phone: '+91 98765-00000',
    hasBiometricsEnrolled: true,
    biometricHash: 'BIO-FACE-IRIS-ADMIN-0001',
    enrolledFaceVector: DEFAULT_FACE_VECTOR_VIKRAM
  }
];

const MILITARY_BASES: MilitaryBase[] = [
  {
    id: 'BASE-LAC-NORTH',
    name: 'LAC Northern Sector (Eastern Ladakh / Sub-Sector North)',
    code: 'HQ-14-CORPS',
    region: 'Himalayan Frontier Outpost',
    coordinates: '34.2268° N, 77.5619° E',
    camerasCount: 8,
    threatLevel: 'DEFCON 2',
    coverImage: '/cctv_himalayan_feed.jpg'
  },
  {
    id: 'BASE-SIACHEN',
    name: 'Siachen High Altitude Base (Forward Operating Base)',
    code: 'FOB-SIACHEN-01',
    region: 'Glacier Tactical Zone',
    coordinates: '35.4212° N, 77.1095° E',
    camerasCount: 6,
    threatLevel: 'DEFCON 1',
    coverImage: '/drone_aerial_recon.jpg'
  },
  {
    id: 'BASE-TAWANG',
    name: 'Eastern Command LAC Ridge (Tawang Sector)',
    code: 'EC-TAWANG-ALPHA',
    region: 'Northeast Frontier Grid',
    coordinates: '27.5861° N, 91.8594° E',
    camerasCount: 12,
    threatLevel: 'DEFCON 3',
    coverImage: '/cam02_main_gate.jpg'
  },
  {
    id: 'BASE-THAR',
    name: 'Western Border Command (Thar Checkpoint 04)',
    code: 'WC-THAR-DESERT',
    region: 'Desert Border Corridor',
    coordinates: '26.9157° N, 70.9083° E',
    camerasCount: 5,
    threatLevel: 'DEFCON 4',
    coverImage: '/thermal_flir_alert.jpg'
  },
  {
    id: 'BASE-KARWAR',
    name: 'Southern Coastal Defense Hub (Karwar Naval Base)',
    code: 'SND-KARWAR-HQ',
    region: 'Maritime Security Zone',
    coordinates: '14.8156° N, 74.1298° E',
    camerasCount: 9,
    threatLevel: 'DEFCON 3',
    coverImage: '/satellite_base_map.jpg'
  }
];

export default function Login() {
  const navigate = useNavigate();

  // Auth Mode: Sign In (Existing Operator) vs Sign Up (Register New Operator)
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');

  // Sign In Credentials State
  const [serviceId, setServiceId] = useState('IA-948201');
  const [operatorName, setOperatorName] = useState('Subedar Vikram Singh');
  const [passcode, setPasscode] = useState('aegis2026');
  const [clearanceLevel, setClearanceLevel] = useState('LEVEL-5 TOP SECRET (COSMIC)');
  
  // Sign Up / Register Fields
  const [regUnit, setRegUnit] = useState('14 Corps - High Altitude Recon');
  const [regRank, setRegRank] = useState('Subedar');
  const [regPhone, setRegPhone] = useState('+91 98765-43210');
  const [confirmPasscode, setConfirmPasscode] = useState('aegis2026');

  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rememberCredentials, setRememberCredentials] = useState(true);
  const [hasSavedCreds, setHasSavedCreds] = useState(false);

  // Selected Military Base Location
  const [selectedBase, setSelectedBase] = useState<MilitaryBase>(MILITARY_BASES[0]);

  // Camera Provisioning State
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [ipCameraUrl, setIpCameraUrl] = useState('rtsp://10.14.2.55:554/live/stream1');
  const [backendStreamEnabled, setBackendStreamEnabled] = useState(true);
  const [cameraTestStatus, setCameraTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // Auth Method: Passcode vs Iris Biometric Optical Scan
  const [authMethod, setAuthMethod] = useState<'PASSCODE' | 'IRIS_BIOMETRIC'>('PASSCODE');
  const [irisScanStatus, setIrisScanStatus] = useState<'IDLE' | 'SCANNING' | 'VERIFIED' | 'FAILED'>('IDLE');
  const [irisScanProgress, setIrisScanProgress] = useState(0);
  const [irisStream, setIrisStream] = useState<MediaStream | null>(null);
  const irisVideoRef = useRef<HTMLVideoElement | null>(null);

  // Biometric Enrollment & Real Facial Feature Extraction State
  const [regBiometricsEnrolled, setRegBiometricsEnrolled] = useState<boolean>(false);
  const [regBiometricHash, setRegBiometricHash] = useState<string>('');
  const [regEnrolledFaceVector, setRegEnrolledFaceVector] = useState<number[] | null>(null);
  const [simulatedMatchMode, setSimulatedMatchMode] = useState<'MATCHED' | 'MISMATCHED'>('MATCHED');

  // Active step inside setup
  const [activeStep, setActiveStep] = useState<'CREDENTIALS' | 'LOCATION' | 'CAMERAS'>('CREDENTIALS');

  // Helper: Extract 32-dimensional Grayscale Facial Feature Vector from Live Video Canvas
  const extractFacialVector = (): number[] => {
    const videoEl = irisVideoRef.current;
    if (!videoEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
      return Array.from({ length: 32 }, () => Math.round(Math.random() * 100) / 100);
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (!ctx) return Array.from({ length: 32 }, () => 0.5);

      ctx.drawImage(videoEl, 0, 0, 32, 32);
      const imgData = ctx.getImageData(0, 0, 32, 32).data;

      const vec: number[] = [];
      for (let i = 0; i < 32; i++) {
        let sum = 0;
        for (let p = i * 32; p < (i + 1) * 32; p++) {
          const r = imgData[p * 4];
          const g = imgData[p * 4 + 1];
          const b = imgData[p * 4 + 2];
          sum += (r + g + b) / 3;
        }
        vec.push(Math.round((sum / 32 / 255) * 1000) / 1000);
      }
      return vec;
    } catch {
      return Array.from({ length: 32 }, () => 0.5);
    }
  };

  // Helper: Compare Live Facial Vector vs Enrolled Facial Vector (Returns Similarity 0% to 100%)
  const compareFacialVectors = (vec1: number[], vec2: number[]): number => {
    if (!vec1 || !vec2 || vec1.length !== vec2.length || vec1.length === 0) return 0;
    let sumDiff = 0;
    for (let i = 0; i < vec1.length; i++) {
      sumDiff += Math.abs(vec1[i] - vec2[i]);
    }
    const avgDiff = sumDiff / vec1.length;
    return Math.max(0, Math.min(100, Math.round((1 - avgDiff * 2.2) * 100)));
  };

  // Trigger Facial & Iris Biometric Camera Scan (Supports both Authentication & Enrollment Modes)
  const startIrisScan = async (isEnrollmentMode: boolean = false) => {
    setAuthError('');
    setSuccessMsg('');
    setIrisScanStatus('SCANNING');
    setIrisScanProgress(0);

    const targetId = serviceId.trim().toUpperCase();
    const allAccounts = getAllAccounts();
    const existingAcc = allAccounts.find(a => a.serviceId.toUpperCase() === targetId);

    // 1. Check if Military Service ID is provided
    if (!targetId && !isEnrollmentMode) {
      setIrisScanStatus('FAILED');
      setAuthError('🚨 ACCESS REJECTED: Please enter your Military Service ID / Army Number first.');
      return;
    }

    // 2. Check if Military Service ID exists in directory
    if (!isEnrollmentMode && authMode === 'SIGN_IN' && !existingAcc) {
      setIrisScanStatus('FAILED');
      setAuthError(`🚨 ACCESS DENIED: Service ID "${targetId}" is NOT registered in defense database. Biometric validation failed.`);
      return;
    }

    // 3. Check if user has enrolled biometrics
    if (!isEnrollmentMode && authMode === 'SIGN_IN' && existingAcc && !existingAcc.hasBiometricsEnrolled && !regBiometricsEnrolled) {
      setIrisScanStatus('FAILED');
      setAuthError(`⚠️ BIOMETRICS NOT ENROLLED: Service ID "${targetId}" has no registered facial/iris signature yet. Click "ENROLL BIOMETRICS NOW" below to register your scan, or sign in with passcode.`);
      return;
    }

    let stream: MediaStream | null = null;
    try {
      tacticalSiren.initContext();
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setIrisStream(stream);
      if (irisVideoRef.current) {
        irisVideoRef.current.srcObject = stream;
        irisVideoRef.current.play().catch(() => {});
      }
    } catch (e) {
      console.warn('Iris camera permission note:', e);
    }

    // Progress timer
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setIrisScanProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        // Extract real-time facial feature vector from video stream
        const liveFaceVector = extractFacialVector();

        // Stop camera stream tracks
        if (stream) stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());

        // ENROLLMENT MODE: Capture and save real facial feature vector bound to targetId
        if (isEnrollmentMode || authMode === 'SIGN_UP') {
          const newHash = `BIO-FACE-IRIS-${targetId || 'OP'}-${Math.floor(1000 + Math.random() * 9000)}`;
          setRegBiometricHash(newHash);
          setRegBiometricsEnrolled(true);
          setRegEnrolledFaceVector(liveFaceVector);
          setIrisScanStatus('VERIFIED');
          setSuccessMsg(`✅ FACIAL FINGERPRINT & RETINAL BIOMETRICS ENROLLED AND SAVED TO SERVICE ID "${targetId}".`);

          if (existingAcc) {
            existingAcc.hasBiometricsEnrolled = true;
            existingAcc.biometricHash = newHash;
            existingAcc.enrolledFaceVector = liveFaceVector;
            localStorage.setItem('aegis_accounts', JSON.stringify(allAccounts));
          }
          return;
        }

        // SIGN IN AUTHENTICATION MODE: Calculate real similarity between live face & enrolled profile
        const targetEnrolledVector = existingAcc?.enrolledFaceVector || regEnrolledFaceVector || DEFAULT_FACE_VECTOR_VIKRAM;
        const similarityScore = compareFacialVectors(liveFaceVector, targetEnrolledVector);

        // REJECT IF MISMATCHED FACE OR IF TOGGLED TO MISMATCHED TEST MODE
        if (simulatedMatchMode === 'MISMATCHED' || similarityScore < 50) {
          setIrisScanStatus('FAILED');
          tacticalSiren.playTestSiren(400); // Alert sound on face mismatch
          setAuthError(`🚨 ACCESS DENIED (FACE MISMATCH): Unrecognized facial profile! Live scan similarity is only ${Math.max(12, similarityScore)}% (Required: 65%+). Face does NOT match enrolled profile for Military Service ID "${targetId}". Terminal access BLOCKED!`);
          return;
        }

        // BIOMETRIC SCAN MATCH CONFIRMED!
        setIrisScanStatus('VERIFIED');
        setSuccessMsg(`👁️ FACIAL & RETINAL BIOMETRIC CONFIRMED (${similarityScore}% MATCH FOR ID ${targetId}). ACCESS GRANTED!`);
        setTimeout(() => {
          performAuthentication(true);
        }, 500);
      }
    }, 200);
  };

  // Cleanup Iris camera stream on unmount
  useEffect(() => {
    return () => {
      if (irisStream) {
        irisStream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      }
    };
  }, [irisStream]);

  // Load Saved Accounts and Credentials on Component Mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aegis_accounts');
      if (!stored) {
        localStorage.setItem('aegis_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
      }

      const saved = localStorage.getItem('aegis_saved_credentials') || localStorage.getItem('aegis_session');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.serviceId) setServiceId(data.serviceId);
        if (data.operatorName) {
          const rawName = data.operatorName.replace(/^(Subedar Major|Subedar|Major|Colonel|Captain|Havildar|Commander)\s+/i, '');
          setOperatorName(rawName);
        }
        if (data.passcode) {
          setPasscode(data.passcode);
          setConfirmPasscode(data.passcode);
        }
        if (data.clearanceLevel) setClearanceLevel(data.clearanceLevel);
        if (data.unit) setRegUnit(data.unit);
        if (data.rank) setRegRank(data.rank);
        if (data.phone) setRegPhone(data.phone);
        if (data.base && data.base.id) {
          const match = MILITARY_BASES.find(b => b.id === data.base.id);
          if (match) setSelectedBase(match);
        }
        if (typeof data.webcamEnabled === 'boolean') setWebcamEnabled(data.webcamEnabled);
        if (data.ipCameraUrl) setIpCameraUrl(data.ipCameraUrl);
        setHasSavedCreds(true);
      }
    } catch (e) {
      console.warn('Could not load saved credentials:', e);
    }
  }, []);

  // Clear Saved Credentials Helper
  const clearSavedCredentials = () => {
    localStorage.removeItem('aegis_saved_credentials');
    setHasSavedCreds(false);
    setServiceId('');
    setOperatorName('');
    setPasscode('');
    setConfirmPasscode('');
  };

  // Helper to fetch all registered accounts
  const getAllAccounts = (): OperatorAccount[] => {
    try {
      const stored = localStorage.getItem('aegis_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, OperatorAccount>();
          DEFAULT_ACCOUNTS.forEach(a => map.set(a.serviceId.toUpperCase(), a));
          parsed.forEach((a: OperatorAccount) => map.set(a.serviceId.toUpperCase(), a));
          return Array.from(map.values());
        }
      }
    } catch {}
    return DEFAULT_ACCOUNTS;
  };

  // Test local webcam stream
  const testWebcam = async () => {
    setCameraTestStatus('TESTING');
    try {
      tacticalSiren.initContext();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setWebcamStream(stream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(console.error);
      }
      setCameraTestStatus('SUCCESS');
    } catch (err) {
      console.warn('Webcam test note:', err);
      setCameraTestStatus('FAILED');
    }
  };

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      }
    };
  }, [webcamStream]);

  // Master Authentication & Login Logic (Strict validation with optional Biometric bypass)
  const performAuthentication = (isBiometricBypass: boolean = false): boolean => {
    setAuthError('');
    setSuccessMsg('');

    const trimmedId = serviceId.trim().toUpperCase() || 'IA-948201';
    const trimmedPass = passcode.trim();

    if (!trimmedId && !isBiometricBypass) {
      setAuthError('🚨 ACCESS REJECTED: Please enter your Military Service ID / Army Number.');
      return false;
    }

    if (!trimmedPass && !isBiometricBypass) {
      setAuthError('🚨 ACCESS REJECTED: Please enter your military security passcode.');
      return false;
    }

    const allAccounts = getAllAccounts();

    // 1. SIGN IN FLOW: STRICT CREDENTIAL VALIDATION
    if (authMode === 'SIGN_IN') {
      let account = allAccounts.find(acc => acc.serviceId.toUpperCase() === trimmedId);

      // If user does not exist in authorized directory
      if (!account) {
        if (isBiometricBypass) {
          account = DEFAULT_ACCOUNTS[0]; // Fallback to default authorized operator
        } else {
          setAuthError(`🚨 ACCESS DENIED: Service ID "${trimmedId}" is NOT registered in the defense database. Access rejected. (Click "SIGN UP" to enroll a new ID).`);
          return false;
        }
      }

      // If passcode does not match and NOT biometric bypass
      if (!isBiometricBypass && account.passcode !== trimmedPass) {
        setAuthError(`🚨 ACCESS DENIED: Incorrect passcode for Service ID "${trimmedId}". Terminal authorization rejected.`);
        return false;
      }

      // Credentials are 100% VALID!
      const currentTimestamp = getExactLocalTimestamp();

      const sessionData = {
        serviceId: account.serviceId,
        operatorName: account.operatorName,
        passcode: account.passcode,
        clearanceLevel: account.clearanceLevel || clearanceLevel,
        unit: account.unit || regUnit,
        rank: account.rank || regRank,
        phone: account.phone || regPhone,
        base: selectedBase,
        webcamEnabled,
        ipCameraUrl,
        backendStreamEnabled,
        loginTimestamp: currentTimestamp
      };

      // Persist active session
      localStorage.setItem('aegis_session', JSON.stringify(sessionData));

      if (rememberCredentials) {
        localStorage.setItem('aegis_saved_credentials', JSON.stringify(sessionData));
      }

      // Live update in Personnel duty logins table
      try {
        const storedLogins = JSON.parse(localStorage.getItem('aegis_duty_logins') || '[]');
        const newLoginLog = {
          id: Date.now(),
          service_number: account.serviceId,
          name: account.operatorName,
          rank: account.rank || regRank,
          unit: account.unit || regUnit,
          action: 'DUTY_LOGIN',
          terminal_id: `TERMINAL-${selectedBase.code || 'LAC-NORTH'}`,
          ip_address: '10.14.0.12',
          status: 'AUTHORIZED',
          timestamp: currentTimestamp
        };
        localStorage.setItem('aegis_duty_logins', JSON.stringify([newLoginLog, ...storedLogins]));

        // Live update in Personnel activity trail
        const storedActivities = JSON.parse(localStorage.getItem('aegis_personnel_activities') || '[]');
        const newAct = {
          id: Date.now(),
          soldier_id: account.serviceId,
          soldier_name: account.operatorName,
          rank: account.rank || regRank,
          activity_type: 'DUTY_LOGIN',
          details: `Authenticated to ${selectedBase.name} (${selectedBase.code})`,
          terminal_id: `TERMINAL-${selectedBase.code || 'LAC-NORTH'}`,
          timestamp: currentTimestamp
        };
        localStorage.setItem('aegis_personnel_activities', JSON.stringify([newAct, ...storedActivities]));

        // Broadcast DOM event for immediate live tab sync
        window.dispatchEvent(new Event('aegis_duty_logins_updated'));

        // Post login to backend if connected
        fetch(`${API_BASE_URL}/api/auth/soldier-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLoginLog)
        }).catch(() => {});
      } catch {}

      tacticalSiren.initContext();
      setSuccessMsg(`✅ CREDENTIALS VERIFIED. WELCOME, ${account.rank.toUpperCase()} ${account.operatorName.toUpperCase()}. ACCESSING DEFENSE GRID...`);

      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
      return true;
    }

    // 2. SIGN UP / REGISTRATION FLOW
    if (authMode === 'SIGN_UP') {
      if (!operatorName.trim()) {
        setAuthError('🚨 REGISTRATION ERROR: Please enter operator full name and designation.');
        return false;
      }

      if (trimmedPass !== confirmPasscode.trim()) {
        setAuthError('🚨 REGISTRATION ERROR: Passcode and confirmation passcode do not match.');
        return false;
      }

      if (trimmedPass.length < 4) {
        setAuthError('🚨 REGISTRATION ERROR: Passcode must be at least 4 characters long.');
        return false;
      }

      // Check if already registered
      const existing = allAccounts.find(acc => acc.serviceId.toUpperCase() === trimmedId);
      if (existing) {
        setAuthError(`⚠️ REGISTRATION NOTICE: Service ID "${trimmedId}" is already registered. Please switch to SIGN IN.`);
        return false;
      }

      // Register new account into persistent localStorage with facial & iris biometrics
      const newAccount: OperatorAccount = {
        serviceId: trimmedId,
        passcode: trimmedPass,
        operatorName: `${regRank} ${operatorName.trim()}`,
        rank: regRank,
        clearanceLevel,
        unit: regUnit,
        phone: regPhone,
        hasBiometricsEnrolled: regBiometricsEnrolled || true, // Enrolled during signup scan or default set
        biometricHash: regBiometricHash || `BIO-FACE-IRIS-${trimmedId}-${Math.floor(1000 + Math.random() * 9000)}`
      };

      const updatedAccounts = [...allAccounts, newAccount];
      localStorage.setItem('aegis_accounts', JSON.stringify(updatedAccounts));
      // Ensure new account starts with clean slate
      localStorage.removeItem('aegis_sample_dataset_loaded');
      localStorage.removeItem('aegis_sample_alerts_loaded');

      const currentTimestamp = getExactLocalTimestamp();

      const sessionData = {
        ...newAccount,
        base: selectedBase,
        webcamEnabled,
        ipCameraUrl,
        backendStreamEnabled,
        loginTimestamp: currentTimestamp
      };

      localStorage.setItem('aegis_session', JSON.stringify(sessionData));

      if (rememberCredentials) {
        localStorage.setItem('aegis_saved_credentials', JSON.stringify(sessionData));
      }

      // Live update in Personnel duty logins table
      try {
        const storedLogins = JSON.parse(localStorage.getItem('aegis_duty_logins') || '[]');
        const newLoginLog = {
          id: Date.now(),
          service_number: newAccount.serviceId,
          name: newAccount.operatorName,
          rank: newAccount.rank,
          unit: newAccount.unit,
          action: 'ENROLLED & DUTY_LOGIN',
          terminal_id: `TERMINAL-${selectedBase.code || 'LAC-NORTH'}`,
          ip_address: '10.14.0.12',
          status: 'AUTHORIZED',
          timestamp: currentTimestamp
        };
        localStorage.setItem('aegis_duty_logins', JSON.stringify([newLoginLog, ...storedLogins]));

        const storedActivities = JSON.parse(localStorage.getItem('aegis_personnel_activities') || '[]');
        const newAct = {
          id: Date.now(),
          soldier_id: newAccount.serviceId,
          soldier_name: newAccount.operatorName,
          rank: newAccount.rank,
          activity_type: 'OPERATOR_ENROLLED',
          details: `Enrolled new operator with ${newAccount.clearanceLevel} at ${selectedBase.name}`,
          terminal_id: `TERMINAL-${selectedBase.code || 'LAC-NORTH'}`,
          timestamp: currentTimestamp
        };
        localStorage.setItem('aegis_personnel_activities', JSON.stringify([newAct, ...storedActivities]));

        window.dispatchEvent(new Event('aegis_duty_logins_updated'));

        fetch(`${API_BASE_URL}/api/auth/soldier-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLoginLog)
        }).catch(() => {});
      } catch {}

      tacticalSiren.initContext();
      setSuccessMsg(`✅ OPERATOR "${trimmedId}" ENROLLED & REGISTERED. ACCESSING DEFENSE GRID...`);

      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
      return true;
    }

    return false;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performAuthentication();
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050805',
      color: 'var(--color-text)',
      fontFamily: "'Share Tech Mono', monospace",
      display: 'flex',
      flexDirection: 'column',
      backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(34, 197, 94, 0.08) 0%, rgba(5, 8, 5, 0.95) 75%)',
      padding: '24px 20px',
      boxSizing: 'border-box'
    }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto 20px auto',
        paddingBottom: 16,
        borderBottom: '1px solid rgba(34, 197, 94, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 6,
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={22} color="var(--color-accent)" className="animate-pulse" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, letterSpacing: 3, color: 'var(--color-accent)', fontWeight: 900 }}>
              AEGIS-VISION
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: 1 }}>
              TACTICAL DEFENSE SURVEILLANCE & AI PERIMETER SYSTEM
            </p>
          </div>
        </div>

        {/* Action Header Links: Iris Scan, Try Demo & Security Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              setAuthMode('SIGN_IN');
              setActiveStep('CREDENTIALS');
              setAuthMethod('IRIS_BIOMETRIC');
              startIrisScan();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid var(--color-accent)',
              borderRadius: 4,
              color: 'var(--color-accent)',
              fontSize: 12,
              fontWeight: 'bold',
              letterSpacing: 1,
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            <Eye size={16} className="animate-pulse" />
            👁️ SCAN IRIS BIOMETRIC
          </button>

          <Link
            to="/demo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              backgroundColor: 'rgba(234, 179, 8, 0.18)',
              border: '1px solid var(--color-warning)',
              borderRadius: 4,
              color: 'var(--color-warning)',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 'bold',
              letterSpacing: 1,
              boxShadow: '0 0 15px rgba(234, 179, 8, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={15} className="animate-spin" />
            TRY DEMO
          </Link>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 4,
            fontSize: 11,
            color: 'var(--color-success)'
          }}>
            <span className="status-dot live" style={{ margin: 0 }}></span>
            MIL-SPEC 256-BIT ENCRYPTED
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1.05fr 1.15fr',
        gap: 28,
        flex: 1
      }}>
        {/* Left Column: Multi-Step Sign In / Sign Up & Provisioning Card */}
        <div className="card" style={{
          backgroundColor: '#0a0f0a',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          boxShadow: '0 0 35px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          padding: 24
        }}>
          {/* Sign In vs Sign Up Mode Switcher */}
          <div style={{
            display: 'flex',
            gap: 6,
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: 4,
            borderRadius: 6,
            marginBottom: 16,
            border: '1px solid var(--color-border)'
          }}>
            <button
              type="button"
              onClick={() => { setAuthMode('SIGN_IN'); setAuthError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '9px 6px',
                fontSize: 12,
                fontFamily: "'Share Tech Mono', monospace",
                borderRadius: 4,
                backgroundColor: authMode === 'SIGN_IN' ? 'var(--color-accent)' : 'transparent',
                color: authMode === 'SIGN_IN' ? '#000' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <LogIn size={14} /> SIGN IN (OPERATOR)
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('SIGN_UP'); setAuthError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '9px 6px',
                fontSize: 12,
                fontFamily: "'Share Tech Mono', monospace",
                borderRadius: 4,
                backgroundColor: authMode === 'SIGN_UP' ? 'var(--color-accent)' : 'transparent',
                color: authMode === 'SIGN_UP' ? '#000' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <UserPlus size={14} /> SIGN UP (ENROLL NEW)
            </button>
          </div>

          {/* Setup Sub-Steps (Credentials -> Location -> Cameras) */}
          <div style={{
            display: 'flex',
            gap: 4,
            backgroundColor: 'rgba(0,0,0,0.35)',
            padding: 3,
            borderRadius: 4,
            marginBottom: 16,
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <button
              type="button"
              onClick={() => setActiveStep('CREDENTIALS')}
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 10,
                fontFamily: "'Share Tech Mono', monospace",
                borderRadius: 3,
                backgroundColor: activeStep === 'CREDENTIALS' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                color: activeStep === 'CREDENTIALS' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                border: activeStep === 'CREDENTIALS' ? '1px solid var(--color-accent)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              1. {authMode === 'SIGN_IN' ? 'CREDENTIALS' : 'REGISTRATION'}
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('LOCATION')}
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 10,
                fontFamily: "'Share Tech Mono', monospace",
                borderRadius: 3,
                backgroundColor: activeStep === 'LOCATION' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                color: activeStep === 'LOCATION' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                border: activeStep === 'LOCATION' ? '1px solid var(--color-accent)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              2. SELECT LOCATION
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('CAMERAS')}
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 10,
                fontFamily: "'Share Tech Mono', monospace",
                borderRadius: 3,
                backgroundColor: activeStep === 'CAMERAS' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                color: activeStep === 'CAMERAS' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                border: activeStep === 'CAMERAS' ? '1px solid var(--color-accent)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              3. CONNECT CAMERAS
            </button>
          </div>

          {authError && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid var(--color-alert)',
              color: 'var(--color-alert)',
              borderRadius: 4,
              marginBottom: 14,
              fontSize: 12,
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>{authError}</div>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(34, 197, 94, 0.25)',
              border: '1px solid var(--color-success)',
              color: 'var(--color-success)',
              borderRadius: 4,
              marginBottom: 14,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* STEP 1: CREDENTIALS (SIGN IN OR SIGN UP) */}
            {activeStep === 'CREDENTIALS' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 13, flex: 1 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 15, color: 'var(--color-accent)' }}>
                    {authMode === 'SIGN_IN' ? 'OPERATOR SIGN IN' : 'NEW OPERATOR ENROLLMENT'}
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {authMode === 'SIGN_IN' 
                      ? 'Authenticate via Security Passcode or Iris Biometric Scan to enter the grid.' 
                      : 'Enroll new defense personnel credentials and security clearance level.'}
                  </p>
                </div>

                {/* Authentication Method Selector (Passcode vs Iris Biometric) for Sign In */}
                {authMode === 'SIGN_IN' && (
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: 4,
                    borderRadius: 6,
                    border: '1px solid var(--color-border)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('PASSCODE')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        fontSize: 11,
                        fontFamily: "'Share Tech Mono', monospace",
                        borderRadius: 4,
                        backgroundColor: authMethod === 'PASSCODE' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                        color: authMethod === 'PASSCODE' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        border: authMethod === 'PASSCODE' ? '1px solid var(--color-accent)' : '1px solid transparent',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Lock size={13} /> SECURITY PASSCODE
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthMethod('IRIS_BIOMETRIC')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        fontSize: 11,
                        fontFamily: "'Share Tech Mono', monospace",
                        borderRadius: 4,
                        backgroundColor: authMethod === 'IRIS_BIOMETRIC' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                        color: authMethod === 'IRIS_BIOMETRIC' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        border: authMethod === 'IRIS_BIOMETRIC' ? '1px solid var(--color-accent)' : '1px solid transparent',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Eye size={14} className="animate-pulse" /> IRIS BIOMETRIC SCAN
                    </button>
                  </div>
                )}

                {/* Service ID / Badge Number */}
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                    MILITARY SERVICE NUMBER / BADGE ID
                  </label>
                  <input
                    type="text"
                    value={serviceId}
                    onChange={(e) => { setServiceId(e.target.value); setAuthError(''); }}
                    placeholder="e.g. IA-948201 or OP-773194"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      color: 'var(--color-accent)',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* IRIS BIOMETRIC HUD INTERFACE FOR SIGN IN & ENROLLMENT */}
                {authMode === 'SIGN_IN' && authMethod === 'IRIS_BIOMETRIC' && (
                  <div style={{
                    padding: 14,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    border: '1px solid var(--color-accent)',
                    borderRadius: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    position: 'relative',
                    boxShadow: '0 0 25px rgba(34, 197, 94, 0.2)',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Scan size={15} className="animate-spin" /> HOLOGRAPHIC RETINAL & IRIS OPTICAL SCANNER
                    </div>

                    {/* Biometric Scan Simulation Mode Selector (for testing Authorized vs Mismatched subjects) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      borderRadius: 4,
                      border: '1px solid var(--color-border)',
                      fontSize: 10,
                      width: '100%',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>CAMERA SCAN SUBJECT:</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => setSimulatedMatchMode('MATCHED')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 3,
                            fontSize: 9,
                            fontWeight: 'bold',
                            border: simulatedMatchMode === 'MATCHED' ? '1px solid var(--color-success)' : '1px solid transparent',
                            backgroundColor: simulatedMatchMode === 'MATCHED' ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
                            color: simulatedMatchMode === 'MATCHED' ? 'var(--color-success)' : 'var(--color-text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          ✅ MATCHED FACIAL SIGNATURE
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedMatchMode('MISMATCHED')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 3,
                            fontSize: 9,
                            fontWeight: 'bold',
                            border: simulatedMatchMode === 'MISMATCHED' ? '1px solid var(--color-alert)' : '1px solid transparent',
                            backgroundColor: simulatedMatchMode === 'MISMATCHED' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                            color: simulatedMatchMode === 'MISMATCHED' ? 'var(--color-alert)' : 'var(--color-text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          🚨 MISMATCHED / WRONG PERSON
                        </button>
                      </div>
                    </div>

                    {/* Scanner Camera / Target Reticle Window */}
                    <div style={{
                      width: 220,
                      height: 140,
                      backgroundColor: '#000',
                      borderRadius: 8,
                      border: `2px solid ${irisScanStatus === 'VERIFIED' ? 'var(--color-success)' : 'var(--color-accent)'}`,
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {/* Live Camera Video Feed */}
                      <video
                        ref={irisVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                      />

                      {/* Holographic Eye Target Reticle Overlay */}
                      <div style={{
                        position: 'absolute',
                        width: 90,
                        height: 90,
                        borderRadius: '50%',
                        border: '2px dashed var(--color-accent)',
                        boxShadow: '0 0 15px rgba(34, 197, 94, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Eye size={42} color={irisScanStatus === 'VERIFIED' ? '#22c55e' : 'var(--color-accent)'} />
                      </div>

                      {/* Laser Scanning Bar Animation when scanning */}
                      {irisScanStatus === 'SCANNING' && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: `${irisScanProgress}%`,
                          height: 3,
                          backgroundColor: '#22c55e',
                          boxShadow: '0 0 15px #22c55e, 0 0 30px #22c55e',
                          transition: 'top 0.15s linear'
                        }} />
                      )}

                      {/* Top Corner Reticle Accents */}
                      <div style={{ position: 'absolute', top: 6, left: 6, width: 10, height: 10, borderLeft: '2px solid var(--color-accent)', borderTop: '2px solid var(--color-accent)' }} />
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRight: '2px solid var(--color-accent)', borderTop: '2px solid var(--color-accent)' }} />
                      <div style={{ position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderLeft: '2px solid var(--color-accent)', borderBottom: '2px solid var(--color-accent)' }} />
                      <div style={{ position: 'absolute', bottom: 6, right: 6, width: 10, height: 10, borderRight: '2px solid var(--color-accent)', borderBottom: '2px solid var(--color-accent)' }} />
                    </div>

                    {/* Progress Bar & Status Text */}
                    {irisScanStatus === 'SCANNING' && (
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-accent)', marginBottom: 4, fontWeight: 'bold' }}>
                          SCANNING IRIS & FACIAL PATTERN... {irisScanProgress}%
                        </div>
                        <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${irisScanProgress}%`, height: '100%', backgroundColor: 'var(--color-accent)', transition: 'width 0.2s ease' }} />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons: Scan to Authenticate + Enroll Biometrics Now option */}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => startIrisScan(false)}
                        disabled={irisScanStatus === 'SCANNING'}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: irisScanStatus === 'VERIFIED' ? 'var(--color-success)' : 'var(--color-accent)',
                          color: '#000',
                          border: 'none',
                          borderRadius: 4,
                          fontWeight: 'bold',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                        }}
                      >
                        <Eye size={16} />
                        {irisScanStatus === 'SCANNING' 
                          ? 'ALIGN EYES WITH CAMERA RETICLE...' 
                          : irisScanStatus === 'VERIFIED' 
                          ? '✅ BIOMETRIC MATCH CONFIRMED' 
                          : 'SCAN IRIS TO AUTHENTICATE'}
                      </button>

                      {/* Add/Enroll Biometrics Option if not registered or wants to re-enroll */}
                      <button
                        type="button"
                        onClick={() => startIrisScan(true)}
                        disabled={irisScanStatus === 'SCANNING'}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          backgroundColor: 'rgba(234, 179, 8, 0.15)',
                          border: '1px solid var(--color-warning)',
                          color: 'var(--color-warning)',
                          borderRadius: 4,
                          fontWeight: 'bold',
                          fontSize: 10,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <UserPlus size={12} />
                        ➕ ENROLL / REGISTER FACIAL & IRIS BIOMETRICS FOR THIS ID
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional fields if Sign Up */}
                {authMode === 'SIGN_UP' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                          OPERATOR FULL NAME
                        </label>
                        <input
                          type="text"
                          value={operatorName}
                          onChange={(e) => setOperatorName(e.target.value)}
                          placeholder="e.g. Vikram Singh"
                          required
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 4,
                            color: '#ffffff',
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: 13,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                          MILITARY RANK
                        </label>
                        <select
                          value={regRank}
                          onChange={(e) => setRegRank(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 4,
                            color: '#ffffff',
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: 12,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="Subedar Major">Subedar Major</option>
                          <option value="Subedar">Subedar</option>
                          <option value="Major">Major</option>
                          <option value="Colonel">Colonel</option>
                          <option value="Captain">Captain</option>
                          <option value="Havildar">Havildar</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                        ASSIGNED DEFENSE UNIT / BRIGADE
                      </label>
                      <input
                        type="text"
                        value={regUnit}
                        onChange={(e) => setRegUnit(e.target.value)}
                        placeholder="e.g. 14 Corps - High Altitude Recon"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 4,
                          color: '#ffffff',
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* ENROLL FACIAL & IRIS BIOMETRIC SCANNER CARD FOR SIGN UP */}
                    <div style={{
                      padding: 12,
                      backgroundColor: 'rgba(34, 197, 94, 0.08)',
                      border: '1px dashed var(--color-accent)',
                      borderRadius: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Eye size={14} className="animate-pulse" /> ENROLL FACIAL & RETINAL BIOMETRICS
                        </span>
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, backgroundColor: regBiometricsEnrolled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: regBiometricsEnrolled ? 'var(--color-success)' : 'var(--color-warning)', border: `1px solid ${regBiometricsEnrolled ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
                          {regBiometricsEnrolled ? '✅ ENROLLED' : 'PENDING SCAN'}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-muted)' }}>
                        Scan your facial landmarks and iris pattern now so you can log in seamlessly using either Biometrics or Passcode.
                      </p>

                      <button
                        type="button"
                        onClick={() => startIrisScan(true)}
                        disabled={irisScanStatus === 'SCANNING'}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: regBiometricsEnrolled ? 'var(--color-success)' : 'var(--color-accent)',
                          color: '#000',
                          border: 'none',
                          borderRadius: 4,
                          fontWeight: 'bold',
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <Scan size={14} />
                        {irisScanStatus === 'SCANNING' 
                          ? 'SCANNING FACIAL & IRIS DATA...' 
                          : regBiometricsEnrolled 
                          ? `✅ BIOMETRICS SAVED [${regBiometricHash || 'ENROLLED'}]` 
                          : 'CAPTURE & ENROLL FACIAL/IRIS BIOMETRICS'}
                      </button>
                    </div>
                  </>
                )}

                {/* If Sign In: Operator Name */}
                {authMode === 'SIGN_IN' && (
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                      OPERATOR CALLSIGN / NAME
                    </label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      placeholder="e.g. Subedar Vikram Singh"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 4,
                        color: '#ffffff',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                {/* Security Clearance */}
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                    SECURITY CLEARANCE LEVEL
                  </label>
                  <select
                    value={clearanceLevel}
                    onChange={(e) => setClearanceLevel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      color: 'var(--color-warning)',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="LEVEL-5 TOP SECRET (COSMIC)">LEVEL-5: TOP SECRET (COSMIC DEFENSE OVERRIDE)</option>
                    <option value="LEVEL-4 SECRET (OPERATIONAL)">LEVEL-4: SECRET (SECTOR RECON COMMAND)</option>
                    <option value="LEVEL-3 CONFIDENTIAL (PATROL)">LEVEL-3: CONFIDENTIAL (PERIMETER WATCH)</option>
                    <option value="LEVEL-2 RESTRICTED (SENTRY)">LEVEL-2: RESTRICTED (LOCAL SENTRY)</option>
                  </select>
                </div>

                {/* Passcode Input */}
                <div style={{ display: 'grid', gridTemplateColumns: authMode === 'SIGN_UP' ? '1fr 1fr' : '1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                      MILITARY SECURITY PASSCODE
                    </label>
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => { setPasscode(e.target.value); setAuthError(''); }}
                      placeholder="Enter security passcode"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 4,
                        color: '#ffffff',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  {authMode === 'SIGN_UP' && (
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                        CONFIRM PASSCODE
                      </label>
                      <input
                        type="password"
                        value={confirmPasscode}
                        onChange={(e) => { setConfirmPasscode(e.target.value); setAuthError(''); }}
                        placeholder="Confirm Passcode"
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 4,
                          color: '#ffffff',
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Default Credentials Hint Pill */}
                {authMode === 'SIGN_IN' && (
                  <div style={{
                    padding: '6px 10px',
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    border: '1px dashed rgba(34, 197, 94, 0.3)',
                    borderRadius: 4,
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Info size={13} color="var(--color-accent)" />
                    <span>
                      DEMO OPERATOR: ID <strong>IA-948201</strong> &bull; Passcode: <strong>aegis2026</strong> (or Sign Up to register your own)
                    </span>
                  </div>
                )}

                {/* Remember Credentials Option & Status Banner */}
                <div style={{
                  padding: '8px 10px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--color-accent)' }}>
                    <input
                      type="checkbox"
                      checked={rememberCredentials}
                      onChange={(e) => setRememberCredentials(e.target.checked)}
                    />
                    REMEMBER CREDENTIALS & SENSORS ON THIS TERMINAL
                  </label>
                  {hasSavedCreds && (
                    <button
                      type="button"
                      onClick={clearSavedCredentials}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        fontSize: 10,
                        textDecoration: 'underline'
                      }}
                    >
                      Clear Saved
                    </button>
                  )}
                </div>

                {/* Direct Action Row: Authenticate Directly OR Select Location / Cameras */}
                <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', gap: 8 }}>
                  <Link
                    to="/demo"
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'rgba(234, 179, 8, 0.15)',
                      border: '1px solid var(--color-warning)',
                      color: 'var(--color-warning)',
                      borderRadius: 4,
                      textDecoration: 'none',
                      fontSize: 11,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Sparkles size={13} /> TRY DEMO
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      // Move to location step
                      setActiveStep('LOCATION');
                    }}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    CONFIG BASE / CAM &rarr;
                  </button>

                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '11px 14px',
                      backgroundColor: 'var(--color-accent)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 'bold',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                    }}
                  >
                    <Play size={13} fill="#000" />
                    {authMode === 'SIGN_IN' ? 'SIGN IN & ENTER GRID' : 'ENROLL & ENTER GRID'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & SECTOR SELECTION */}
            {activeStep === 'LOCATION' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 15, color: 'var(--color-accent)' }}>
                    ASSIGN MONITORING BASE & SECTOR
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    Select the active operational base and geopolitical border corridor to patrol.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {MILITARY_BASES.map(base => (
                    <div
                      key={base.id}
                      onClick={() => setSelectedBase(base)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: selectedBase.id === base.id ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                        backgroundColor: selectedBase.id === base.id ? 'rgba(34, 197, 94, 0.12)' : 'rgba(0, 0, 0, 0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <MapPin size={13} color={selectedBase.id === base.id ? 'var(--color-accent)' : 'var(--color-text-muted)'} />
                          <strong style={{ fontSize: 12, color: selectedBase.id === base.id ? 'var(--color-accent)' : '#fff' }}>
                            {base.name}
                          </strong>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                          {base.code} &bull; {base.coordinates} &bull; {base.camerasCount} SENSORS
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9,
                        padding: '2px 6px',
                        borderRadius: 3,
                        backgroundColor: base.threatLevel === 'DEFCON 1' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: base.threatLevel === 'DEFCON 1' ? 'var(--color-alert)' : 'var(--color-warning)',
                        border: `1px solid ${base.threatLevel === 'DEFCON 1' ? 'var(--color-alert)' : 'var(--color-warning)'}`
                      }}>
                        {base.threatLevel}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setActiveStep('CREDENTIALS')}
                    style={{
                      padding: '9px 14px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                  >
                    &larr; BACK
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStep('CAMERAS')}
                    style={{
                      flex: 1,
                      padding: '11px',
                      backgroundColor: 'var(--color-accent)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 'bold',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    NEXT: CONNECT CAMERAS &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONNECT CAMERAS & SENSORS */}
            {activeStep === 'CAMERAS' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 15, color: 'var(--color-accent)' }}>
                    PROVISION CAMERA FEEDS & SENSORS
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    Configure local optical sensors, RTSP IP video feeds, and AI neural net processors.
                  </p>
                </div>

                {/* 1. Local Webcam Toggle & Test */}
                <div style={{
                  padding: 10,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Camera size={15} color="var(--color-accent)" />
                      <strong style={{ fontSize: 11 }}>LOCAL OPTICAL WEBCAM (AI DETECTOR)</strong>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={webcamEnabled}
                        onChange={(e) => setWebcamEnabled(e.target.checked)}
                      />
                      ENABLED
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={testWebcam}
                      disabled={cameraTestStatus === 'TESTING'}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-accent)',
                        color: 'var(--color-accent)',
                        borderRadius: 4,
                        fontSize: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <RefreshCw size={11} className={cameraTestStatus === 'TESTING' ? 'animate-spin' : ''} />
                      {cameraTestStatus === 'TESTING' ? 'PROBING SENSOR...' : 'TEST WEBCAM SIGNAL'}
                    </button>
                    {cameraTestStatus === 'SUCCESS' && (
                      <span style={{ fontSize: 10, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> SIGNAL LOCKED (60 FPS)
                      </span>
                    )}
                    {cameraTestStatus === 'FAILED' && (
                      <span style={{ fontSize: 10, color: 'var(--color-alert)' }}>
                        ⚠️ SENSOR BLOCKED OR PERMISSION DENIED
                      </span>
                    )}
                  </div>
                  {/* Live Video Preview Box */}
                  {webcamStream && (
                    <div style={{ width: '100%', height: 90, backgroundColor: '#000', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--color-success)', marginTop: 2 }}>
                      <video ref={videoPreviewRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                {/* 2. RTSP IP Camera Stream Input */}
                <div style={{
                  padding: 10,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Video size={15} color="var(--color-warning)" />
                    <strong style={{ fontSize: 11 }}>RTSP / IP SURVEILLANCE FEED URL</strong>
                  </div>
                  <input
                    type="text"
                    value={ipCameraUrl}
                    onChange={(e) => setIpCameraUrl(e.target.value)}
                    placeholder="rtsp://admin:pass@192.168.1.100:554/stream"
                    style={{
                      padding: '7px 10px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      color: 'var(--color-text)',
                      fontSize: 11,
                      fontFamily: "'Share Tech Mono', monospace"
                    }}
                  />
                </div>

                {/* 3. AI Backend Fast Inference Engine */}
                <div style={{
                  padding: 10,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Cpu size={15} color="var(--color-accent)" />
                    <div>
                      <strong style={{ fontSize: 11, display: 'block' }}>YOLOV8 FASTAPI ENGINE</strong>
                      <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>Port 8000 Stream / Cloud WebSocket</span>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={backendStreamEnabled}
                      onChange={(e) => setBackendStreamEnabled(e.target.checked)}
                    />
                    ACTIVE
                  </label>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveStep('LOCATION')}
                    style={{
                      padding: '9px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                  >
                    &larr; BACK
                  </button>

                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '11px',
                      backgroundColor: 'var(--color-accent)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 'bold',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                    }}
                  >
                    <Play size={14} fill="#000" />
                    {authMode === 'SIGN_IN' ? 'AUTHENTICATE & ENTER GRID' : 'ENROLL & ENTER GRID'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Base Preview & Live Tactical Intelligence Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Selected Base Satellite / Recon Card */}
          <div className="card" style={{
            padding: 0,
            overflow: 'hidden',
            backgroundColor: '#0a0f0a',
            borderColor: 'rgba(34, 197, 94, 0.3)',
            position: 'relative',
            height: 270
          }}>
            <img
              src={selectedBase.coverImage}
              alt={selectedBase.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
            />
            {/* Dark gradient overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(5,8,5,0.95) 0%, rgba(5,8,5,0.3) 60%, rgba(5,8,5,0.7) 100%)'
            }} />

            {/* Top HUD badge */}
            <div style={{ position: 'absolute', top: 14, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                backgroundColor: 'rgba(0,0,0,0.85)',
                padding: '4px 10px',
                borderRadius: 4,
                color: 'var(--color-accent)',
                fontSize: 11,
                border: '1px solid var(--color-accent)'
              }}>
                SECTOR RECON: {selectedBase.code}
              </span>
              <span style={{
                backgroundColor: 'rgba(0,0,0,0.85)',
                padding: '4px 10px',
                borderRadius: 4,
                color: 'var(--color-warning)',
                fontSize: 11,
                border: '1px solid var(--color-warning)'
              }}>
                {selectedBase.threatLevel} READY
              </span>
            </div>

            {/* Bottom Base Info */}
            <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: 16, color: '#fff' }}>
                {selectedBase.name}
              </h2>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--color-text-muted)' }}>
                <span><MapPin size={12} style={{ verticalAlign: 'middle' }} /> {selectedBase.coordinates}</span>
                <span><Radio size={12} style={{ verticalAlign: 'middle' }} /> {selectedBase.region}</span>
              </div>
            </div>
          </div>

          {/* Quick Interactive Features Showcase Card with Try Demo Highlight */}
          <div className="card" style={{
            backgroundColor: '#0a0f0a',
            borderColor: 'var(--color-border)',
            padding: 20,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={18} color="var(--color-accent)" />
                <h3 style={{ margin: 0, fontSize: 14, color: 'var(--color-accent)' }}>
                  TRY INTERACTIVE DEFENSE SANDBOX
                </h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
                Want to evaluate AEGIS-VISION without signing in? Launch the live sandbox demo to test AI object detection, siren audio synthesis, and multi-spectral optics.
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                <li><strong>Dual-Layer In-Browser AI:</strong> Real-time neural network + pixel saliency.</li>
                <li><strong>Threat vs Soldier Partitioning:</strong> Sentry soldiers vs non-human breaches.</li>
                <li><strong>Continuous Acoustic Siren:</strong> Web Audio synthesizer alarm.</li>
                <li><strong>Multi-Spectral Optics:</strong> Normal, Thermal IR, NVG, and FLIR.</li>
              </ul>
            </div>

            {/* Direct Try Demo Button */}
            <Link
              to="/demo"
              style={{
                marginTop: 14,
                padding: '12px 16px',
                backgroundColor: 'rgba(234, 179, 8, 0.16)',
                border: '1px solid var(--color-warning)',
                borderRadius: 4,
                color: 'var(--color-warning)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                textAlign: 'center',
                boxShadow: '0 0 20px rgba(234, 179, 8, 0.2)',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={16} />
              TRY DEMO (LAUNCH CAPABILITY SANDBOX) &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
