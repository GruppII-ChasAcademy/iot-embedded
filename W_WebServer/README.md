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

<img width="755" height="292" alt="1enhet" src="https://github.com/user-attachments/assets/c54b1984-ee93-4233-931f-ff6f4486ae6a" />

En specfik Paket "PAKET 10"

<img width="921" height="719" alt="Specfiktpaket10" src="https://github.com/user-attachments/assets/60976ca0-274e-4e58-9733-590472f947c3" />

En specfik Paket "PAKET 77"

<img width="869" height="744" alt="Specfiktpaket77" src="https://github.com/user-attachments/assets/484af529-871f-4a8e-b54f-35d900d30f45" />


10st paket som visas

<img width="1801" height="230" alt="10enheter" src="https://github.com/user-attachments/assets/dd2951b0-f07e-4960-8bba-27d1d85d717e" />
50st paket som visas
<img width="1800" height="516" alt="50enhter" src="https://github.com/user-attachments/assets/d94ac13b-409c-43d3-9075-7fe41342ebc5" />
100st paket som visas
<img width="1754" height="836" alt="100enheter" src="https://github.com/user-attachments/assets/bdf33853-5b10-480d-b05f-92db4bb503e9" />

Då det är 100 paket som man ska kunna analysera

### Start in 30s
```bash
node -e 'const http=require("http"),url=require("url"),cp=require("child_process");let store=[];const J={"Content-Type":"application/json"};function handler(req,res){const u=url.parse(req.url,true),p=(u.pathname||"/").replace(/\/+/g,"/"),q=u.query;if(p==="/"){res.writeHead(200,{"Content-Type":"text/plain"});return res.end("OK - /health, /api/telemetry?limit=100&sort=asc|desc  (ta bort deviceId för ALLA enheter)");}if(p==="/health"){res.writeHead(200,J);return res.end(JSON.stringify({status:"ok",count:store.length,uptime:process.uptime()}));}if(p==="/api/telemetry"){let items=store.slice();const toS=s=>s?Math.floor(Date.parse(s)/1000):null;if(q.deviceId)items=items.filter(x=>x.deviceId===q.deviceId);if(q.from)items=items.filter(x=>x.ts>=toS(q.from));if(q.to)items=items.filter(x=>x.ts<=toS(q.to));const limit=Math.min(parseInt(q.limit||"50",10),500);items.sort((a,b)=>(a.ts||0)-(b.ts||0)||(a.packet||0)-(b.packet||0));const dir=(q.sort||"asc").toLowerCase();const out=dir==="desc"?items.slice(-limit).reverse():items.slice(0,limit);res.writeHead(200,J);return res.end(JSON.stringify(out));}if(p==="/ingest"&&req.method==="POST"){let body="";req.on("data",c=>body+=c);req.on("end",()=>{try{const o=JSON.parse(body||"{}");if(!o.deviceId){res.writeHead(400,J);return res.end(JSON.stringify({error:"deviceId saknas"}));}if(!o.ts)o.ts=Math.floor(Date.now()/1000);store.push(o);res.writeHead(200,J);res.end(JSON.stringify({ok:true,stored:o}));}catch(e){res.writeHead(400,J);res.end(JSON.stringify({error:"bad json"}));}});return;}res.writeHead(404,J);res.end(JSON.stringify({error:"not found"}));}const ports=[3001,3000,0];(function boot(){const p=ports.shift(),srv=http.createServer(handler);srv.on("error",e=>{if(e.code==="EADDRINUSE"&&ports.length){console.log("[HTTP]",p,"upptagen – provar nästa...");setTimeout(boot,50);}else{console.error(e);process.exit(1);}});srv.listen(p,()=>{const port=srv.address().port;console.log("HTTP http://localhost:"+port);let i=0;const N=100,base=Math.floor(Date.now()/1000);(function seed(){if(++i>N){const all="http://localhost:"+port+"/api/telemetry?limit=100&sort=asc";console.log("✔ Seed klart (100 enheter). Öppna:",all);try{if(process.platform==="win32")cp.spawn("powershell",["-NoProfile","Start-Process",all],{stdio:"ignore",detached:true}).unref();}catch{}return;}const dev="uno-r4-"+String(i).padStart(3,"0");const o={deviceId:dev,ts:base+i,temperature:+(25+i*0.1).toFixed(1),humidity:+(45+i*0.1).toFixed(1),packet:1,label:"Paket 1 ("+dev+")"};const body=JSON.stringify(o);const r=http.request({hostname:"localhost",port,path:"/ingest",method:"POST",headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(body)}},rs=>{rs.on("data",()=>{});rs.on("end",()=>seed());});r.on("error",()=>seed());r.write(body);r.end();})();});})();'
'
```
### Exempel-URL:er

- **Alla enheter (stigande):**  
  `http://localhost:<port>/api/telemetry?limit=100&sort=asc`

- **Bara “Arduino”-enheter (prefix):**  
  `http://localhost:<port>/api/telemetry?devicePrefix=uno-r4-&limit=50&sort=asc`

- **Exakt en enhet:**  
  `http://localhost:<port>/api/telemetry?deviceId=uno-r4-002&limit=10&sort=asc`

- **Specifikt paket (alla enheter):**  
  `http://localhost:<port>/api/telemetry?packet=3&sort=asc`

- **Specifikt paket för en enhet:**  
  `http://localhost:<port>/api/telemetry?deviceId=uno-r4-003&packet=3`

- **Paketintervall (t.ex. 2–5) för alla enheter med prefix:**  
  `http://localhost:<port>/api/telemetry?devicePrefix=uno-r4-&packetFrom=2&packetTo=5&sort=asc`

```


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

## Web Server (W) – Quick Start (MQTT-läge)

Kör den riktiga backendservern som lyssnar på din MQTT-broker (ESP32-gateway eller PC-broker).

```bash
cd W_WebServer
npm ci
# .env (exempel för lokal MQTT):
# PORT=3000
# CORS_ORIGIN=*
# USE_AZURE=false
# MQTT_URL="mqtt://<gateway-ip>:1883"
# MQTT_TOPIC="sensors/#"
npm run dev
```
Verifiera (använd samma port som i .env, t.ex. 3000 eller vilken som den automatiskt identiferar):
```bash
curl "http://localhost:3000/health"
curl "http://localhost:3000/api/telemetry?limit=10"
```
> För Azure-läge: fyll i `AZURE_EVENTHUB_CONNECTION_STRING`, `AZURE_EVENTHUB_NAME`, `AZURE_CONSUMER_GROUP`
> och sätt `USE_AZURE=true`.
> Telemetry stöder: `limit` (max **500**), `deviceId`, `devicePrefix`, `from`, `to`, `packet`, `packetFrom`, `packetTo`, `sort=asc|desc` (default `asc`).


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
3. Verifiera:
   ```bash
   curl "http://localhost:<port>/health"
   curl "http://localhost:<port>/api/telemetry?limit=10&deviceId=uno-r4-01](http://localhost:3000/api/telemetry?sort=asc&limit=10&deviceId=uno-r4-01"          # nyast→äldst
   curl "http://localhost:<port>/api/telemetry?limit=10&deviceId=uno-r4-01&sort=asc](http://localhost:3000/api/telemetry?sort=desc&limit=10&limit=10&deviceId=uno-r4-01" # äldst→nyast
---
<img width="567" height="152" alt="Menu" src="https://github.com/user-attachments/assets/a67cde50-5754-4094-9d50-64a98cf295ab" />

### Sortering (exempel)

`/api/telemetry` sorterar alltid på tid (`ts`).  
- `sort=asc` → stigande (äldst → nyast)  
- `sort=desc` → fallande (nyast → äldre)  
- Utelämnad `sort` = **asc** som standard.

**Exempel (för `deviceId=uno-r4-01`, `limit=10`):**
- `?sort=asc&limit=10`  ⇒ visar **Paket 1..10**
<img width="612" height="827" alt="paket1till10" src="https://github.com/user-attachments/assets/f6841ece-755f-4742-8a94-2a387c16656e" />


- `?sort=desc&limit=10` ⇒ visar **Paket 100..91**

<img width="604" height="938" alt="paket10till1" src="https://github.com/user-attachments/assets/c84f0032-70ad-4590-b0d2-29438770a593" />




## Notes

- För **Azure Event Hubs**: sätt `USE_AZURE=true` och fyll i EH-variabler i `.env`.  
- Lägg **aldrig** hemligheter i Git – ignorera `.env`.

