# WebServer — IoT → Backend

**Purpose:** Central backend som tar emot sensortelemetri och exponerar ett enkelt **REST-API** för dashboards/klienter.  
**Modes:** Lokalt via **MQTT** (ESP32-gateway) eller moln via **Azure IoT Hub → Event Hubs**.  
**Project:** GroupII · Chas Advanced
**Servern väljer ledig port automatiskt** (försöker `3001` → `3000` → en slump).  
**Bas-URL** skrivs alltid ut i terminalen vid start, t.ex. `HTTP http://localhost:3001`.

- **Base URL:** `http://localhost:<port>`  *(<port> = den som skrevs ut i terminalen)*
- **Health:** `GET /health` → `{"status":"ok","count":<antal>,"uptime":<sekunder>}`
- **Telemetry:**  
  `GET /api/telemetry?limit=50&deviceId=<id>&from=<iso>&to=<iso>&sort=<asc|desc>`  
  - `limit` = max antal rader (default 50, max 500)  
  - `deviceId` (valfritt) = filtrera på en enhet  
  - `from`/`to` (valfritt) = tidsfilter (ISO8601)  
  - `sort` (valfritt) = `asc` för stigande (äldst→nyast), **default** = `desc` (nyast→äldst)
- **Ingest (REST):** `POST /ingest` med JSON-payload (se exempel nedan).  
  Lägger till en rad i minnet. Fält:
  - `deviceId` *(krav)* – t.ex. `"uno-r4-01"`
  - `ts` *(sekunder sedan epoch; sätts automatiskt om du utelämnar)*
  - `temperature`, `humidity` *(valfritt men normalt med)*
  - valfria extra fält, t.ex. `label`, `packet`

> **MQTT (valfritt):** Om du kör MQTT parallellt bör topic följa  
> **`sensors/<deviceId>`** och payloaden kan vara samma JSON som för `/ingest`.

### Payload (exempel)
Paket 1

<img width="687" height="358" alt="paket1" src="https://github.com/user-attachments/assets/080420b5-6c46-43e5-8178-ea1d3e509258" />
Paket 10

<img width="1920" height="257" alt="paket10" src="https://github.com/user-attachments/assets/87178ee1-c0f2-4fe1-b48f-627293e5968c" />
Paket 50
<img width="1913" height="643" alt="paket50'" src="https://github.com/user-attachments/assets/a1cb235d-c10d-4f10-8c41-70d28017fba7" />
Paket 100
<img width="1596" height="842" alt="paket100" src="https://github.com/user-attachments/assets/954b60dc-86ad-443b-b34f-1f715c44ce81" />
Då det är 100 paket som man ska kunna analysera

### Start in 30s
```bash
node -e 'const http=require("http"),url=require("url"),cp=require("child_process");let store=[];const JSONH={"Content-Type":"application/json"};const handler=(req,res)=>{const u=url.parse(req.url,true),p=(u.pathname||"/").replace(/\/+/g,"/"),q=u.query;if(p==="/"){res.writeHead(200,{"Content-Type":"text/plain"});return res.end("OK – /health, /api/telemetry?limit=100&deviceId=uno-r4-01&sort=asc");}if(p==="/health"){res.writeHead(200,JSONH);return res.end(JSON.stringify({status:"ok",count:store.length,uptime:process.uptime()}));}if(p==="/api/telemetry"){let items=store.slice();const toS=s=>s?Math.floor(Date.parse(s)/1000):null;if(q.deviceId)items=items.filter(x=>x.deviceId===q.deviceId);if(q.from)items=items.filter(x=>x.ts>=toS(q.from));if(q.to)items=items.filter(x=>x.ts<=toS(q.to));const limit=Math.min(parseInt(q.limit||"50",10),500);items=q.sort==="asc"?items.slice(-limit):items.slice(-limit).reverse();res.writeHead(200,JSONH);return res.end(JSON.stringify(items));}if(p==="/ingest"&&req.method==="POST"){let body="";req.on("data",c=>body+=c);req.on("end",()=>{try{const o=JSON.parse(body||"{}");if(!o.deviceId){res.writeHead(400,JSONH);return res.end(JSON.stringify({error:"deviceId saknas"}));}if(!o.ts)o.ts=Math.floor(Date.now()/1000);store.push(o);res.writeHead(200,JSONH);res.end(JSON.stringify({ok:true,stored:o}));}catch(e){res.writeHead(400,JSONH);res.end(JSON.stringify({error:"bad json"}));}});return;}res.writeHead(404,JSONH);res.end(JSON.stringify({error:"not found"}));};const ports=[3001,3000,0];(function boot(){const p=ports.shift();const srv=http.createServer(handler);srv.on("error",e=>{if(e.code==="EADDRINUSE"&&ports.length){console.log("[HTTP]",p,"upptagen – provar nästa...");setTimeout(boot,50);}else{console.error(e);process.exit(1);}});srv.listen(p,()=>{const port=srv.address().port;console.log("HTTP http://localhost:"+port);let i=0;(function seed(){if(++i>100){const asc="http://localhost:"+port+"/api/telemetry?limit=100&deviceId=uno-r4-01&sort=asc";console.log("✔ Seed klart (1→100). Öppnar",asc);try{if(process.platform==="win32")cp.spawn("powershell",["-NoProfile","Start-Process",asc],{stdio:"ignore",detached:true}).unref();}catch{}return;}const body=JSON.stringify({deviceId:"uno-r4-01",ts:Math.floor(Date.now()/1000)+i,temperature:+(20+i/10).toFixed(1),humidity:+(40+i/10).toFixed(1),packet:i,label:"Paket "+i});const r=http.request({hostname:"localhost",port,path:"/ingest",method:"POST",headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(body)}},rs=>{rs.on("data",()=>{});rs.on("end",()=>seed());});r.on("error",()=>seed());r.write(body);r.end();})();});})();'

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
## End-to-End (lokal MQTT — ESP32 Gateway + UNO R4)

**Flöde:** UNO R4 (DHT) → MQTT (`sensors/<deviceId>`) → ESP32 gateway/broker (:1883) → Backend → REST

> **Bas-URL:** `http://localhost:<port>`  
> `<port>` = den port som backenden skriver ut vid start (t.ex. `3001`).

### Endpoints
| Metod | Path                | Query-parametrar                               | Beskrivning                         |
|------:|---------------------|-----------------------------------------------|-------------------------------------|
| GET   | `/health`           | –                                             | Hälsa/uptime och intern räknare     |
| GET   | `/api/telemetry`    | `limit` (max 500), `deviceId`, `from`, `to`   | Telemetri (senaste N efter filter)  |

**Exempel–payload (MQTT/REST):**
```json
{"deviceId":"uno-r4-01","ts":1738256400,"temperature":22.8,"humidity":41.5}
````


## End-to-End (lokal demo & MQTT)

> **Bas-URL:** Servern väljer ledig port automatiskt och skriver ut något i stil med  
> `HTTP http://localhost:<port>` i terminalen. Använd **samma `<port>`** i alla exempel nedan.

### A) Snabb demo utan hårdvara (REST)
1. Starta servern (one-liner) – den seedar själv Paket 1→100 och öppnar rätt URL.  
   *(Se avsnittet “Quick start / one-liner” ovan.)*
2. Verifiera:
   ```bash
   curl "http://localhost:<port>/health"
   curl "http://localhost:<port>/api/telemetry?limit=10&deviceId=uno-r4-01"          # nyast→äldst
   curl "http://localhost:<port>/api/telemetry?limit=10&deviceId=uno-r4-01&sort=asc" # äldst→nyast
<img width="568" height="154" alt="Menu" src="https://github.com/user-attachments/assets/7671c111-9b33-4299-bc57-1265775d3bc9" />

---

## Notes

- För **Azure Event Hubs**: sätt `USE_AZURE=true` och fyll i EH-variabler i `.env`.  
- Lägg **aldrig** hemligheter i Git – ignorera `.env`.

