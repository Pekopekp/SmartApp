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
import { db } from '../firebase/config';
import type {
  SensorReading,
  MotorStatus,
  ControlMode,
  Thresholds,
  AppAlert,
  AppContextValue,
} from '../types';

// ─── Defaults ────────────────────────────────────────────────────────────────
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
  ph: 6.5,
  ec: 1.2,
  gas: 300,
  temperature: 28,
  humidity: 60,
  waterTemp: 25,
  timestamp: new Date().toISOString(),
};

// ─── Mock history ─────────────────────────────────────────────────────────────
const generateHistory = (): SensorReading[] => {
  const history: SensorReading[] = [];
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    history.push({
      ph: +(6 + Math.random() * 2).toFixed(2),
      ec: +(0.8 + Math.random() * 2).toFixed(2),
      gas: Math.floor(200 + Math.random() * 400),
      temperature: +(24 + Math.random() * 12).toFixed(1),
      humidity: +(45 + Math.random() * 40).toFixed(1),
      waterTemp: +(20 + Math.random() * 12).toFixed(1),
      timestamp: new Date(now - i * 60_000).toISOString(),
    });
  }
  return history;
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sensorData, setSensorData] = useState<SensorReading>(INITIAL_SENSOR_DATA);
  const [motorStatus, setMotorStatus] = useState<MotorStatus>('OFF');
  const [mode, setMode] = useState<ControlMode>('AUTO');
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [history, setHistory] = useState<SensorReading[]>(generateHistory());
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isFetchingMotor, setIsFetchingMotor] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sensorDataRef = useRef(sensorData);
  sensorDataRef.current = sensorData;

  // ─── Alert checker ──────────────────────────────────────────────────────────
  const checkAlerts = useCallback((data: SensorReading, thresh: Thresholds): AppAlert[] => {
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
  // When your IoT device writes to Firebase Realtime DB at path /sensors/latest
  // this listener will pick it up automatically. Until you have a real device,
  // the simulated ticker below keeps data flowing.
  useEffect(() => {
    const sensorRef = ref(db, 'sensors/latest');
    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val.ph === 'number') {
          const newData: SensorReading = {
            ph: val.ph ?? INITIAL_SENSOR_DATA.ph,
            ec: val.ec ?? INITIAL_SENSOR_DATA.ec,
            gas: val.gas ?? INITIAL_SENSOR_DATA.gas,
            temperature: val.temperature ?? INITIAL_SENSOR_DATA.temperature,
            humidity: val.humidity ?? INITIAL_SENSOR_DATA.humidity,
            waterTemp: val.waterTemp ?? INITIAL_SENSOR_DATA.waterTemp,
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
            // Sync motor status to Firebase
            set(ref(db, 'motor/status'), autoStatus).catch(() => null);
          }
        }
      },
      (error) => {
        console.warn('[Firebase] Sensor read error:', error.message);
        setIsConnected(false);
      }
    );

    return () => unsubscribe();
  }, [thresholds, mode, checkAlerts, evaluateMotor]);

  // ─── Firebase: Listen to motor status (for real device sync) ────────────────
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

  // ─── Simulated sensor ticker (runs until Firebase has real device data) ─────
  useEffect(() => {
    const tick = () => {
      const prev = sensorDataRef.current;
      const fluctuate = (base: number, range: number) =>
        +(base + (Math.random() - 0.5) * range).toFixed(2);

      const newData: SensorReading = {
        ph: Math.max(0, Math.min(14, fluctuate(prev.ph, 0.4))),
        ec: Math.max(0, fluctuate(prev.ec, 0.2)),
        gas: Math.max(0, Math.round(prev.gas + (Math.random() - 0.5) * 50)),
        temperature: Math.max(0, fluctuate(prev.temperature, 1)),
        humidity: Math.max(0, Math.min(100, fluctuate(prev.humidity, 3))),
        waterTemp: Math.max(0, fluctuate(prev.waterTemp, 0.8)),
        timestamp: new Date().toISOString(),
      };

      // Push simulated reading to Firebase so listeners fire
      set(ref(db, 'sensors/latest'), newData).catch(() => {
        // Firebase not configured yet – update local state directly
        setSensorData(newData);
        setLastUpdated(new Date());
        setHistory((prev2) => [...prev2.slice(-49), newData]);

        const currentAlerts = checkAlerts(newData, DEFAULT_THRESHOLDS);
        setAlerts(currentAlerts);
      });
    };

    intervalRef.current = setInterval(tick, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkAlerts]);

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
      setMotorStatus(newStatus); // optimistic update
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
    // Persist to Firebase so all devices share the same thresholds
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
