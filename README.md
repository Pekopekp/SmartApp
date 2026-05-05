# SmartIoT Monitoring Dashboard 🚀

A premium, real-time IoT monitoring application built with **React Native (Expo)** and **TypeScript**. This dashboard connects to a **Firebase Realtime Database** to monitor environmental sensors and control hardware in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)

---

## ✨ Features

- 📱 **Real-time Monitoring**: Live updates for pH, EC, Gas (MQ2), Temperature, Humidity, and Water Temperature.
- ⚙️ **Hardware Control**: Manual and Automatic motor control modes synchronized across all devices via Firebase.
- 📊 **Historical Data**: Interactive sparkline charts and detailed logs of recent sensor readings.
- 🔔 **Intelligent Alerts**: Visual warnings and pulsing indicators when sensors exceed configurable thresholds.
- 🎨 **Premium UI/UX**: Dark mode design with glassmorphism, smooth animations, and high-contrast visuals.
- 🛡️ **Type Safety**: 100% TypeScript codebase for robust development.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS version)
- [Expo Go](https://expo.dev/go) app on your physical device (Android/iOS)
- A [Firebase Project](https://console.firebase.google.com/) with a **Realtime Database** enabled.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/SmartIoT.git
cd SmartIoT
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add your Firebase credentials:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run the Application
```bash
# Start the Metro bundler
npx expo start --clear
```
- Scan the QR code with **Expo Go** to view the app on your phone.
- Press **'w'** to view in a web browser.

---

## 🔗 Hardware Integration (ESP32)

The app listens to and writes to the following paths in your Firebase Realtime Database:

| Feature | Firebase Path | Data Type |
|--- |--- |--- |
| **Sensor Data** | `/sensors/latest` | JSON Object |
| **Motor Status** | `/motor/status` | String ("ON"/"OFF") |
| **Thresholds** | `/config/thresholds` | JSON Object |

### ESP32 Payload Example
Ensure your ESP32 sends data to `/sensors/latest` in this format:
```json
{
  "ph": 7.2,
  "ec": 1.4,
  "gas": 320,
  "temperature": 28.5,
  "humidity": 60.0,
  "waterTemp": 24.2,
  "timestamp": 1714900000000
}
```

---

## 📂 Project Structure

```text
SmartIoT/
├── src/
│   ├── components/    # Reusable UI elements (SensorCard, MotorControl)
│   ├── context/       # AppContext.tsx (The brain - handles Firebase & logic)
│   ├── firebase/      # Firebase configuration & initialization
│   ├── navigation/    # TabNavigator configuration
│   ├── screens/       # Main views (Dashboard, Logs, Settings)
│   ├── theme/         # Design tokens (Colors, Typography)
│   └── types/         # TypeScript interfaces
├── App.tsx            # Main app entry and providers
└── index.tsx          # Expo entry point
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
