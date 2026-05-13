#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

#define WIFI_SSID     "**********"
#define WIFI_PASSWORD "**********"
#define API_KEY       "**********"
#define DATABASE_URL  "**********"

// ── Firebase Auth Credentials ─────────────────────────────────────────────────
#define USER_EMAIL    "**********"
#define USER_PASSWORD "**********"

FirebaseData fbdo;
FirebaseData fbdoMotor;
FirebaseAuth auth;
FirebaseConfig config;

const int MOTOR_PIN = 26;

unsigned long lastSensorSend = 0;
const unsigned long SENSOR_INTERVAL = 5000;

bool signupOK = false;

// ── Stream Callbacks ──────────────────────────────────────────────────────────

void streamCallback(FirebaseStream data) {
  if (data.dataType() == "string") {
    String motorStatus = data.stringData();
    Serial.println("[Stream] Motor command: " + motorStatus);

    if (motorStatus == "ON") {
      digitalWrite(MOTOR_PIN, HIGH);
      Serial.println("[Motor] ON");
    } else if (motorStatus == "OFF") {
      digitalWrite(MOTOR_PIN, LOW);
      Serial.println("[Motor] OFF");
    } else {
      Serial.println("[Motor] Unknown command ignored");
    }
  }
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) {
    Serial.println("[Stream] Timeout — will auto-reconnect");
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected — IP: " + WiFi.localIP().toString());

  // Firebase config
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  // ── Email/Password Sign-In (fixed UID, matches your DB rules) ──
  auth.user.email    = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Wait for authentication to complete
  Serial.print("Authenticating");
  while (!Firebase.ready()) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[Firebase] Authenticated OK!");
  signupOK = true;

  // ── Motor stream (event-driven, non-blocking) ──
  if (!Firebase.RTDB.beginStream(&fbdoMotor, "/motor/status")) {
    Serial.println("[Stream] Begin failed: " + fbdoMotor.errorReason());
  } else {
    Firebase.RTDB.setStreamCallback(
      &fbdoMotor,
      streamCallback,
      streamTimeoutCallback
    );
    Serial.println("[Stream] Motor stream started");
  }
}

// ── Loop ──────────────────────────────────────────────────────────────────────

void loop() {
  if (Firebase.ready() && signupOK) {
    unsigned long now = millis();

    if (now - lastSensorSend >= SENSOR_INTERVAL) {
      lastSensorSend = now;

      FirebaseJson json;
      // ── Replace these with real sensor readings ──
      json.set("ph",            7.2);
      json.set("ec",            1.5);
      json.set("gas",           300);
      json.set("temperature",   28.4);
      json.set("humidity",      65.0);
      json.set("waterTemp",     24.1);
      json.set("timestamp/.sv", "timestamp");

      if (Firebase.RTDB.setJSON(&fbdo, "/sensors/latest", &json)) {
        Serial.println("[Firebase] Sensor data sent OK");
      } else {
        Serial.println("[Firebase] Send failed: " + fbdo.errorReason());
      }
    }
  }
}
