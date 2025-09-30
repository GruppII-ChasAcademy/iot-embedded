# W_WebServer — Azure backend (IoT Hub/Event Hubs → REST)

Lättviktig Node-backend som tar emot telemetri från **Azure IoT Hub** (via **Event Hubs-kompatibel endpoint**) eller **lokal MQTT** och exponerar ett enkelt **REST-API** för dashboards och klienter.  
Projektet ingår i IoT-helheten (S = SensorNodes, C = ESP32-Gateway, M = Mobile, W = WebServer).

## Arkitektur (Mermaid)
```mermaid
flowchart LR
  S[Sensor Nodes<br/>(UNO R4 + DHT22)] -->|BLE/WiFi| G[ESP32 Gateway]
  G -->|MQTT / IoT Hub| H[Azure IoT Hub<br/>→ Event Hubs]
  H --> C[W_WebServer<br/>(Consumer + REST)]
  C --> D[Dashboard / Client]
```

> Om din GitHub inte renderar Mermaid kan du lägga bilden ovan eller en ASCII-skiss.

---

## Förkrav

- **Node.js 18+** och **npm**  
- **Azure IoT Hub** med åtkomst till **Built-in endpoints**  
- (Valfritt) **MQTT-broker** lokalt, t.ex. Mosquitto

---

## Mappstruktur

```
W_WebServer/
├─ src/               # routes, consumers, utils
├─ package.json       # scripts & beroenden
├─ .env               # hemligheter/konfig (ska INTE in i Git)
└─ README.md
```

---

## Snabbstart (lokalt)

```bash
# 1) Installera beroenden
npm ci   # eller: npm install

# 2) Skapa .env (se "Miljövariabler" nedan)
# cp .env.example .env  # om filen finns

# 3) Starta
npm run dev   # utveckling (nodemon)
# eller
npm start     # produktion

# 4) Hälsokoll
curl http://localhost:3000/health

# 5) Exempel: hämta senaste telemetri
curl "http://localhost:3000/api/telemetry?limit=50"
```

---

## Miljövariabler (`.env`)

```ini
# Server
PORT=3000
CORS_ORIGIN=*

# Datakälla
USE_AZURE=true        # true = Azure Event Hubs (IoT Hub), false = lokal MQTT

# Azure Event Hubs (IoT Hub → Built-in endpoints)
AZURE_EVENTHUB_CONNECTION_STRING="Endpoint=sb://<...>.servicebus.windows.net/;SharedAccessKeyName=<policy>;SharedAccessKey=<key>"
AZURE_EVENTHUB_NAME="iothub-<ditt-hub-namn>-events"
AZURE_CONSUMER_GROUP="$Default"   # t.ex. web

# Lokal MQTT (om USE_AZURE=false)
MQTT_URL="mqtt://localhost:1883"
MQTT_TOPIC="sensors/#"
```

### Var hittar jag Azure-värdena?
1) Azure Portal → **din IoT Hub** → **Built-in endpoints**  
2) Kopiera **Event Hub-compatible endpoint** → `AZURE_EVENTHUB_CONNECTION_STRING` (utan `EntityPath`)  
3) Kopiera **Event Hub-compatible name** → `AZURE_EVENTHUB_NAME`  
4) Skapa gärna en egen **Consumer group** (t.ex. `web`) → `AZURE_CONSUMER_GROUP`

---

## Telemetri (rekommenderat JSON-format)

```json
{
  "deviceId": "uno-r4-01",
  "ts": 1738256400,
  "temperature": 22.8,
  "humidity": 41.5,
  "rssi": -63,
  "battery": 3.98,
  "meta": { "fw": "1.0.3" }
}
```

> Backend förväntar sig JSON per meddelande. Anpassa parsern i `src/` om ditt format skiljer sig.

---

## REST-API (exempel)

- `GET /health` → enkel status (t.ex. `{ "status": "ok" }`)  
- `GET /api/telemetry` → senaste mätvärden  
  **Query-params:**  
  - `limit` (int, default 50)  
  - `deviceId` (str, valfritt)  
  - `from`, `to` (ISO 8601 eller unix-sek, valfritt)

*(Se exakta rutter i `src/routes` om implementationen avviker.)*

---

## Lokal MQTT-mode (om `USE_AZURE=false`)

```bash
# Publicera testmeddelande (Mosquitto):
mosquitto_pub -h localhost -t "sensors/uno-r4-01" \
  -m '{"deviceId":"uno-r4-01","ts":1738256400,"temperature":22.8,"humidity":41.5}'

# Läs via REST:
curl "http://localhost:3000/api/telemetry?limit=1"
```

---

## ESP32 — exempel (inspiration, BLE-stil)

> Den här snutten visar **stil** och struktur – anpassa till din kodbas (WiFi, topics, m.m.).

```cpp
#include <WiFi.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

BLEServer* pServer = nullptr;
BLECharacteristic* pChar = nullptr;

#define SERVICE_UUID        "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"   // UART-like
#define CHARACTERISTIC_UUID "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"   // TX Notify

void setup() {
  Serial.begin(115200);
  BLEDevice::init("ESP32-Gateway");

  BLEServer* server = BLEDevice::createServer();
  BLEService* service = server->createService(SERVICE_UUID);

  pChar = service->createCharacteristic(
      CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_NOTIFY
  );
  pChar->addDescriptor(new BLE2902());
  service->start();

  BLEAdvertising* adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->start();
}

void loop() {
  // Exempel: skicka en liten JSON var 5 s (notify)
  static unsigned long last = 0;
  if (millis() - last > 5000) {
    last = millis();
    String json = "{\"deviceId\":\"uno-r4-01\",\"ts\":" + String(millis()/1000) +
                  ",\"temperature\":22.8,\"humidity\":41.5}";
    pChar->setValue((uint8_t*)json.c_str(), json.length());
    pChar->notify();
  }
}
```

---

## Vanliga npm-kommandon

```bash
npm ci        # ren installation från lockfile
npm run dev   # utvecklingsläge (nodemon)
npm start     # produktion
npm test      # om tester finns
```

---

## Felsökning

- **401/403/ReceiverDisconnected** → ogiltig `AZURE_EVENTHUB_CONNECTION_STRING` / saknade rättigheter.  
- **No such event hub** → fel `AZURE_EVENTHUB_NAME` (måste vara *Event Hub-name*, inte IoT Hub-namnet).  
- **EADDRINUSE** → port upptagen; byt `PORT`.  
- **Inget data** → verifiera flöde med `az iot hub monitor-events -n <hub> --consumer-group <grp>`, kontrollera consumer group och tidsformat.  
- **CORS-fel** → sätt `CORS_ORIGIN="*"` i dev eller din domän i prod.

---

## Säkerhet & Git-hygien

Lägg **aldrig** hemligheter i Git. Ignorera `.env`:

```gitignore
W_WebServer/.env
.env
```

Valfritt i rot:

```gitignore
W_WebServer/node_modules/
*.pem
*.key
*.pfx
*.log
```

---

## Repo-översikt (kort)

- `C_ESP32_Gateway/` – ESP32-gateway  
- `S_SensorNodes/`  – sensornoder (Arduino/UNO R4)  
- `M_MobileUnit/`   – mobilklient  
- `W_WebServer/`    – **denna backend**

---

## Licens

MIT (om inget annat anges).
