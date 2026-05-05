#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// 1. PROVIDE YOUR NETWORK CREDENTIALS
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// 2. PROVIDE FIREBASE CREDENTIALS (from your .env file)
#define API_KEY "AIzaSyB4l21rPqtVF4XiShCFirYvEuOWft0PqBc"
#define DATABASE_URL "https://smartiot-adcd1-default-rtdb.asia-southeast1.firebasedatabase.app"

// Firebase Data Objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Motor Pin
const int MOTOR_PIN = 26; // Example GPIO

void setup() {
  Serial.begin(115200);
  pinMode(MOTOR_PIN, OUTPUT);

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }

  // Firebase Setup
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // --- PART 1: SEND SENSOR DATA TO APP ---
  if (Firebase.ready()) {
    FirebaseJson json;
    
    // Replace these with your actual sensor readings
    json.set("ph", 7.2);
    json.set("ec", 1.5);
    json.set("gas", 300);
    json.set("temperature", 28.4);
    json.set("humidity", 65.0);
    json.set("waterTemp", 24.1);
    
    // Server-side timestamp
    json.set("timestamp/.sv", "timestamp");

    // Push to the exact path your app is listening to
    if (Firebase.RTDB.setJSON(&fbdo, "/sensors/latest", &json)) {
      Serial.println("Sent to Firebase!");
    }
  }

  // --- PART 2: LISTEN FOR MOTOR COMMAND FROM APP ---
  if (Firebase.RTDB.getString(&fbdo, "/motor/status")) {
    String motorStatus = fbdo.stringData();
    if (motorStatus == "ON") {
      digitalWrite(MOTOR_PIN, HIGH);
    } else {
      digitalWrite(MOTOR_PIN, LOW);
    }
  }

  delay(5000); // Send data every 5 seconds
}
