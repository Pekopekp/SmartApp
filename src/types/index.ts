// ─── Sensor Data ──────────────────────────────────────────────────────────────
export interface SensorReading {
  ph: number;
  ec: number;
  gas: number;
  temperature: number;
  humidity: number;
  waterTemp: number;
  timestamp: string;
}

// ─── Motor ────────────────────────────────────────────────────────────────────
export type MotorStatus = 'ON' | 'OFF';
export type ControlMode = 'AUTO' | 'MANUAL';

// ─── Thresholds ───────────────────────────────────────────────────────────────
export interface Thresholds {
  phMin: number;
  phMax: number;
  ecMax: number;
  gasMax: number;
  tempMax: number;
  humidityMax: number;
  waterTempMax: number;
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export type AlertType = 'danger' | 'warning' | 'info';

export interface AppAlert {
  id: number;
  type: AlertType;
  message: string;
}

// ─── Status ───────────────────────────────────────────────────────────────────
export type SensorStatus = 'normal' | 'warning' | 'danger';

// ─── App Context ──────────────────────────────────────────────────────────────
export interface AppContextValue {
  sensorData: SensorReading;
  motorStatus: MotorStatus;
  mode: ControlMode;
  setMode: (mode: ControlMode) => void;
  thresholds: Thresholds;
  updateThresholds: (t: Thresholds) => void;
  history: SensorReading[];
  alerts: AppAlert[];
  dismissAlert: (id: number) => void;
  isConnected: boolean;
  lastUpdated: Date;
  toggleMotor: () => Promise<void>;
  isFetchingMotor: boolean;
}
