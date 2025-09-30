#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>
#include <WiFiS3.h>
#include <ArduinoMqttClient.h>

#define DHTPIN 7
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

LiquidCrystal_I2C lcd(0x27, 16, 2);

// Alternativ 1: koppla UNO till ESP32:s AP
const char* WIFI_SSID  = "ESP32-GW";
const char* WIFI_PASS  = "12345678";
const char* MQTT_HOST  = "192.168.4.1";   // ESP32 AP IP

// Alternativ 2 (om du vill): koppla UNO till hemmaroutern
// const char* WIFI_SSID  = "DittWiFi";
// const char* WIFI_PASS  = "DittWifiLosen";
// const char* MQTT_HOST  = "192.168.0.45"; // ESP32 STA IP från seriell monitor

const int   MQTT_PORT  = 1883;
const char* MQTT_TOPIC = "lab/sensors/bananer/dht22";
const char* DEVICE_ID  = "uno-r4-01";

WiFiClient wifi;
MqttClient mqtt(wifi);
unsigned long lastSend = 0;

void wifiConnect(){
  if (WiFi.status()==WL_CONNECTED) return;
  while (WiFi.begin(WIFI_SSID, WIFI_PASS) != WL_CONNECTED) { delay(1000); }
}

void mqttConnect(){
  if (mqtt.connected()) return;
  while (!mqtt.connect(MQTT_HOST, MQTT_PORT)) { delay(1000); }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  lcd.init(); lcd.backlight();
  lcd.setCursor(0,0); lcd.print("Startar..."); delay(500);

  wifiConnect();
  mqttConnect();
}

void loop() {
  wifiConnect();
  mqttConnect();
  mqtt.poll();

  if (millis() - lastSend >= 2000) {
    lastSend = millis();
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (isnan(h) || isnan(t)) {
      lcd.clear();
      lcd.setCursor(0,0); lcd.print("Sensorfel!");
      lcd.setCursor(0,1); lcd.print("Kontrollera DHT");
      return;
    }

    // LCD
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Temp: "); lcd.print(t,1); lcd.print((char)223); lcd.print("C");
    lcd.setCursor(0,1);
    lcd.print("Fukt: "); lcd.print(h,1); lcd.print("%");

    // MQTT
    String payload = String("{\"deviceId\":\"") + DEVICE_ID +
                     "\",\"temp\":" + String(t,1) +
                     ",\"hum\":"  + String(h,1) + "}";
    mqtt.beginMessage(MQTT_TOPIC);
    mqtt.print(payload);
    mqtt.endMessage();

    Serial.println(payload);
  }
}
