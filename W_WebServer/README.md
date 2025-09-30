# WebServer — IoT → Backend

**Purpose:** Central backend som tar emot sensortelemetri och exponerar ett enkelt **REST-API** för dashboards/klienter.  
**Modes:** Lokalt via **MQTT** (ESP32-gateway) eller moln via **Azure IoT Hub → Event Hubs**.  
**Project:** GroupII · Chas Advanced

- **Base URL:** `http://localhost:3000`
- **Health:** `GET /health` (status/uptime)
- **Telemetry:** `GET /api/telemetry?limit=50&deviceId=<id>&from=<iso>&to=<iso>`
- **MQTT Topic (lokalt):** `sensors/<deviceId>`
- **Payload (exempel):** `{"deviceId":"uno-r4-01","ts":1738256400,"temperature":22.8,"humidity":41.5}`

### Start in 30s
```bash
npm ci
# .env (lokalt MQTT)
# PORT=3000
# USE_AZURE=false
# MQTT_URL="mqtt://<gateway-ip>:1883"
# MQTT_TOPIC="sensors/#"
npm run dev
```
## Architecture (ASCII)

```
[S_SensorNodes] --(BLE/WiFi)--> [C_ESP32_Gateway] --(MQTT)--> [W_WebServer] --(REST)--> [Dashboard]-->[Backend]
                                   \__________________________________________________________________________/
                                                       (Optional cloud: Azure IoT Hub/Event Hubs)
```

---

## Prerequisites

- Node.js **18+** och **npm** (för W_WebServer)  
- Azure IoT Hub med **Built-in endpoints** (om molnflöde används)  
- Mosquitto eller annan **MQTT-broker** (för lokalt läge)

---

## Repository Layout

```
S_SensorNodes/     # UNO R4 WiFi sensornoder (DHT22, LCD I2C, MQTT)
C_ESP32_Gateway/   # ESP32 gateway/broker (samlar in & vidarebefordrar)
W_WebServer/       # REST-backend (lokal eller Azure Event Hubs-konsument)
M_MobileUnit/      # (valfritt) mobilklient
```

---

## Web Server (W) – Quick Start

```bash
cd W_WebServer
npm ci                  # eller: npm install
# .env (lokalt MQTT-exempel):
# PORT=3000
# CORS_ORIGIN=*
# USE_AZURE=false
# MQTT_URL="mqtt://<gateway-ip>:1883"
# MQTT_TOPIC="sensors/#"
npm run dev
curl http://localhost:3000/health
```

> För Azure-läge: fyll i `AZURE_EVENTHUB_CONNECTION_STRING`, `AZURE_EVENTHUB_NAME`, `AZURE_CONSUMER_GROUP`
> och sätt `USE_AZURE=true`.

---

## ESP32 Gateway – endast relevanta rader

**Syfte:** skapa AP + starta inbäddad MQTT-broker och logga allt som publiceras.

```cpp
#include <WiFi.h>
#include <uMQTTBroker.h>

const char* AP_SSID = "ESP32-GW";
const char* AP_PASS = "12345678";

class MyBroker : public uMQTTBroker {
  void onData(String topic, const char* data, uint32_t len) override {
    Serial.printf("[MQTT] %s => %.*s\n", topic.c_str(), len, data);
  }
} broker;

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASS);   // AP för noder
  broker.init(1883);                // starta broker
  broker.subscribe("#");            // logga allt
}
```

**Libbar:** `uMQTTBroker` (ESP32).

---

## UNO R4 Sensor Node – endast relevanta rader

**Syfte:** läsa DHT och publicera ett litet JSON-payload till gatewayns broker.

```cpp
#include <ArduinoMqttClient.h>
#include <DHT.h>

const char* DEVICE_ID  = "uno-r4-01";
const char* MQTT_TOPIC = "sensors/uno-r4-01";

extern MqttClient mqtt;  // antas vara uppkopplad
extern DHT dht;          // antas vara initierad

void publishOnce() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) return;

  String payload = String("{\"deviceId\":\"") + DEVICE_ID +
                   "\",\"ts\":" + String(millis()/1000) +
                   ",\"temperature\":" + String(t,1) +
                   ",\"humidity\":"  + String(h,1) + "}";

  mqtt.beginMessage(MQTT_TOPIC);
  mqtt.print(payload);
  mqtt.endMessage();
}
```

**Libbar:** `ArduinoMqttClient`, `DHT sensor library` (+ `Adafruit Unified Sensor`).

---

## End-to-End (lokal MQTT)

1. **ESP32**: starta gatewayn, notera AP-IP (ofta `192.168.4.1`).  
2. **UNO R4**: anslut till `ESP32-GW`, publicera till `sensors/<id>`.  
3. **Backend**: kör `W_WebServer` i `USE_AZURE=false` och peka `MQTT_URL` mot gateway-IP.  
4. Verifiera med `curl http://localhost:3000/health` och (om route finns) `curl "http://localhost:3000/api/telemetry?limit=1"`.

---

## Notes

- För **Azure Event Hubs**: sätt `USE_AZURE=true` och fyll i EH-variabler i `.env`.  
- Lägg **aldrig** hemligheter i Git – ignorera `.env`.

