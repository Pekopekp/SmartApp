import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Alert } from 'react-native';
import { ref, onValue, set, get } from 'firebase/database';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import type {
  SensorReading,
  MotorStatus,
  ControlMode,
  Thresholds,
  AppAlert,
  AppContextValue,
} from '../types';

// ─── Defaults ────────────────────────────────────────────────────────────────
const USER_EMAIL = process.env.EXPO_PUBLIC_USER_EMAIL || '';
const USER_PASS = process.env.EXPO_PUBLIC_USER_PASSWORD || '';

const DEFAULT_THRESHOLDS: Thresholds = {
  phMin: 6.0,
  phMax: 8.0,
  ecMax: 2.0,
  gasMax: 400,
  tempMax: 35,
  humidityMax: 80,
  waterTempMax: 30,
};

const INITIAL_SENSOR_DATA: SensorReading = {
  ph: 0,
  ec: 0,
  gas: 0,
  temperature: 0,
  humidity: 0,
  waterTemp: 0,
  timestamp: new Date().toISOString(),
};

// ─── Mock history (Disabled) ───────────────────────────────────────────────────
const generateHistory = (): SensorReading[] => [];

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sensorData, setSensorData] = useState<SensorReading>(INITIAL_SENSOR_DATA);
  const [motorStatus, setMotorStatus] = useState<MotorStatus>('OFF');
  const [mode, setMode] = useState<ControlMode>('AUTO');
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [history, setHistory] = useState<SensorReading[]>(generateHistory());
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFetchingMotor, setIsFetchingMotor] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sensorDataRef = useRef(sensorData);
  sensorDataRef.current = sensorData;

  // ─── Alert checker ──────────────────────────────────────────────────────────
  const checkAlerts = useCallback((data: SensorReading, thresh: Thresholds): AppAlert[] => {
    if (!lastUpdated) return [];
    const newAlerts: AppAlert[] = [];
    const t = Date.now();
    if (data.ph < thresh.phMin)
      newAlerts.push({ id: t + 1, type: 'danger', message: `pH too LOW: ${data.ph.toFixed(2)} (min: ${thresh.phMin})` });
    if (data.ph > thresh.phMax)
      newAlerts.push({ id: t + 2, type: 'danger', message: `pH too HIGH: ${data.ph.toFixed(2)} (max: ${thresh.phMax})` });
    if (data.ec > thresh.ecMax)
      newAlerts.push({ id: t + 3, type: 'warning', message: `EC HIGH: ${data.ec.toFixed(2)} mS/cm (max: ${thresh.ecMax})` });
    if (data.gas > thresh.gasMax)
      newAlerts.push({ id: t + 4, type: 'danger', message: `Gas ELEVATED: ${data.gas} ppm (max: ${thresh.gasMax})` });
    if (data.temperature > thresh.tempMax)
      newAlerts.push({ id: t + 5, type: 'warning', message: `Temp HIGH: ${data.temperature.toFixed(1)}°C (max: ${thresh.tempMax})` });
    if (data.waterTemp > thresh.waterTempMax)
      newAlerts.push({ id: t + 6, type: 'warning', message: `Water Temp HIGH: ${data.waterTemp.toFixed(1)}°C (max: ${thresh.waterTempMax})` });
    return newAlerts;
  }, []);

  // ─── Auto motor logic ───────────────────────────────────────────────────────
  const evaluateMotor = useCallback((data: SensorReading, thresh: Thresholds): MotorStatus => {
    const shouldBeOn =
      data.ph < thresh.phMin ||
      data.ph > thresh.phMax ||
      data.ec > thresh.ecMax ||
      data.gas > thresh.gasMax ||
      data.waterTemp > thresh.waterTempMax;
    return shouldBeOn ? 'ON' : 'OFF';
  }, []);

  // ─── Firebase: Listen to sensor data ────────────────────────────────────────
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        if (!auth.currentUser) {
          await signInWithEmailAndPassword(auth, USER_EMAIL, USER_PASS);
          console.log('[Firebase] App Authenticated successfully');
        }

        const sensorRef = ref(db, 'sensors/latest');
        unsubscribe = onValue(
          sensorRef,
          (snapshot) => {
            const val = snapshot.val();
            if (val) {
              const newData: SensorReading = {
                ph: val.ph ?? 0,
                ec: val.ec ?? 0,
                gas: val.gas ?? 0,
                temperature: val.temperature ?? 0,
                humidity: val.humidity ?? 0,
                waterTemp: val.waterTemp ?? 0,
                timestamp: val.timestamp ?? new Date().toISOString(),
              };
              setSensorData(newData);
              setLastUpdated(new Date());
              setHistory((prev) => [...prev.slice(-49), newData]);
              setIsConnected(true);

              const currentAlerts = checkAlerts(newData, thresholds);
              setAlerts(currentAlerts);

              if (mode === 'AUTO') {
                const autoStatus = evaluateMotor(newData, thresholds);
                setMotorStatus(autoStatus);
                set(ref(db, 'motor/status'), autoStatus).catch(() => null);
              }
            }
          },
          (error) => {
            console.warn('[Firebase] Sensor read error:', error.message);
            setIsConnected(false);
          }
        );
      } catch (err: any) {
        console.error('[Firebase] Auth Error:', err.message);
        Alert.alert('Auth Error', 'Failed to authenticate with Firebase.');
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [thresholds, mode, checkAlerts, evaluateMotor]);

  // ─── Firebase: Listen to motor status ───────────────────────────────────────
  useEffect(() => {
    const motorRef = ref(db, 'motor/status');
    const unsubscribe = onValue(motorRef, (snapshot) => {
      const val = snapshot.val() as MotorStatus | null;
      if (val === 'ON' || val === 'OFF') {
        setMotorStatus(val);
      }
    });
    return () => unsubscribe();
  }, []);

  // ─── Simulated sensor ticker (REMOVED) ─────────────────────────────────────

  // ─── Toggle motor (Manual mode) ─────────────────────────────────────────────
  const toggleMotor = useCallback(async () => {
    if (mode !== 'MANUAL') {
      Alert.alert('Manual Mode Required', 'Switch to Manual mode to control the motor.');
      return;
    }
    setIsFetchingMotor(true);
    try {
      const newStatus: MotorStatus = motorStatus === 'ON' ? 'OFF' : 'ON';
      await set(ref(db, 'motor/status'), newStatus);
      setMotorStatus(newStatus);
    } catch (err) {
      Alert.alert('Error', 'Failed to update motor status.');
    } finally {
      setIsFetchingMotor(false);
    }
  }, [mode, motorStatus]);

  const dismissAlert = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateThresholds = useCallback((newThresholds: Thresholds) => {
    setThresholds(newThresholds);
    set(ref(db, 'config/thresholds'), newThresholds).catch(() => null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        sensorData,
        motorStatus,
        mode,
        setMode,
        thresholds,
        updateThresholds,
        history,
        alerts,
        dismissAlert,
        isConnected,
        lastUpdated,
        toggleMotor,
        isFetchingMotor,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
