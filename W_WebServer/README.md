# ========================================================================
# W_WebServer — Azure backend (IoT Hub/Event Hubs → REST)
# ========================================================================
# ÖVERSIKT
# Den här backend:en:
# 1) Läser telemetri från Azure IoT Hub via dess Event Hubs-kompatibla endpoint
#    (alternativt från en lokal MQTT-broker).
# 2) Transformerar/validerar inkommande meddelanden.
# 3) Exponerar REST-endpoints som din dashboard eller mobilklient kan hämta från.
#
# Den är byggd i Node.js. Kör lokalt för utveckling, eller deploya till valfri
# server/container i produktion.

# ------------------------------------------------------------------------
# ARKITEKTUR (ASCII)
# ------------------------------------------------------------------------
#  [S_SensorNodes] --(BLE/WiFi)--> [C_ESP32_Gateway] --(MQTT/IoT Hub)-->
#        \______________________________________________________________/
#                                     |
#                                     v
#                          [Azure IoT Hub → Event Hubs]
#                                     |
#                           (EventProcessor/Consumer)
#                                     |
#                                     v
#                              [W_WebServer (REST)]
#                                     |
#                                     v
#                               [Dashboard/Client]

# ------------------------------------------------------------------------
# FÖRKRAV
# ------------------------------------------------------------------------
# - Node.js 18 eller senare + npm
# - (Moln) Azure IoT Hub med åtkomst till "Built-in endpoints"
# - (Lokalt, valfritt) MQTT-broker (t.ex. Mosquitto)

# ------------------------------------------------------------------------
# MAPPSTRUKTUR (kort)
# ------------------------------------------------------------------------
# W_WebServer/
# ├─ src/               # källkod (routers, konsumenter, utils)
# ├─ package.json       # script/beroenden
# ├─ .env               # dina hemligheter (SKA INTE commit:as)
# └─ README.md          # denna fil

# ------------------------------------------------------------------------
# TL;DR — SNABBSTART (LOKALT)
# ------------------------------------------------------------------------
# 1) Gå in i mappen
cd "$(dirname "$0")" 2>/dev/null || true
# (når inte alltid ovan i GitHub-läsning; kör manuellt i terminal när du utvecklar:)
# cd W_WebServer

# 2) Installera beroenden (ren installation)
# - Använd npm ci om package-lock.json finns (det låser versioner exakt)
# - Annars npm install
# npm ci
# npm install

# 3) Skapa en .env (KLIPPA/ KLIStra in exemplet längre ner och fyll i)
#    Placera filen i W_WebServer/.env

# 4) Starta i utvecklingsläge (auto-restart via nodemon om konfigurerat)
# npm run dev
#    eller i "produktion"
# npm start

# 5) Hälsokontroll i annan terminal/flik:
# curl http://localhost:3000/health

# 6) Testa en (exempel)-endpoint:
# curl "http://localhost:3000/api/telemetry?limit=50"

# ------------------------------------------------------------------------
# EXEMPEL PÅ .env — KOPIERA DETTA TILL W_WebServer/.env OCH FYLL I
# ------------------------------------------------------------------------
# -----8<----- klipp här (börja kopiera nästa rad) -----8<-----
# Server
# PORT=3000
# CORS_ORIGIN=*
#
# Datakälla
# USE_AZURE=true               # true = läs från Azure Event Hubs; false = läs MQTT
#
# Azure Event Hubs (IoT Hub → Built-in endpoints)
# AZURE_EVENTHUB_CONNECTION_STRING="Endpoint=sb://<...>.servicebus.windows.net/;SharedAccessKeyName=<policy>;SharedAccessKey=<key>"
# AZURE_EVENTHUB_NAME="iothub-<ditt-hub-namn>-events"
# AZURE_CONSUMER_GROUP="$Default"     # rekommenderas: skapa t.ex. "web"
#
# Lokal MQTT (om USE_AZURE=false)
# MQTT_URL="mqtt://localhost:1883"
# MQTT_TOPIC="sensors/#"
# -----8<----- klipp här (sluta kopiera) -----8<-----

# ------------------------------------------------------------------------
# VAR HITTAR JAG AZURE-VÄRDENA?
# ------------------------------------------------------------------------
# Azure Portal → din IoT Hub → "Built-in endpoints"
#   - Event Hub-compatible endpoint     → till AZURE_EVENTHUB_CONNECTION_STRING (utan EntityPath)
#   - Event Hub-compatible name         → till AZURE_EVENTHUB_NAME
#   - Consumer groups                   → skapa t.ex. "web" (lägg i AZURE_CONSUMER_GROUP)
#
# (Valfritt) Azure CLI (kräver inloggning och iot-extension):
#   az extension add --name azure-iot
#   az login
#   az iot hub monitor-events -n <HUBNAMN> --consumer-group <GRUPP>
#   # ovan låter dig snoka på händelser i realtid, bra för felsökning

# ------------------------------------------------------------------------
# DATAFORMAT — EXEMPEL PÅ TELEMETRI (REKOMMENDERAT)
# ------------------------------------------------------------------------
# Avsändare (gateway eller nod) bör publicera JSON ungefär så här:
# {
#   "deviceId": "uno-r4-01",
#   "ts": 1738256400,              # unix seconds, eller ISO 8601 i "time"
#   "temperature": 22.8,           # °C
#   "humidity": 41.5,              # %
#   "rssi": -63,                   # valfritt, signalstyrka
#   "battery": 3.98,               # valfritt, V
#   "meta": { "fw": "1.0.3" }      # valfritt, fria fält
# }
#
# Backend:en förutsätter normalt JSON per meddelande. Om dina noder skickar
# annan struktur, anpassa parsern/transformern i src/.

# ------------------------------------------------------------------------
# REST-ENDPOINTS (KAN VARIERA LITE MED IMPLEMENTATIONEN – SE src/routes)
# ------------------------------------------------------------------------
# GET /health
#  - Returnerar något enkelt ("ok", version, uptime)
#
# GET /api/telemetry?limit=50&deviceId=uno-r4-01&from=ISO8601&to=ISO8601
#  - Hämtar senaste mätvärden; parametrar är valfria:
#    - limit: antal poster (default t.ex. 50)
#    - deviceId: filtrera på specifik enhet
#    - from/to: tidsintervall (ISO 8601 eller unix sek)
#
# (Din kodbas kan även ha fler rutter, t.ex. /api/devices, /api/stats etc.
#  Kontrollera src/routes för exakta vägar och parametrar.)

# ------------------------------------------------------------------------
# VANLIGA KOMMANDON (NPM SCRIPTS)
# ------------------------------------------------------------------------
# npm ci            # ren, reproducerbar installation från package-lock
# npm install       # normal installation (om du inte har lockfil)
# npm run dev       # dev-läge (auto-restart om nodemon finns)
# npm start         # start i "produktion"
# npm test          # kör tester om definierade
#
# Tips:
# - Använd nvm (Node Version Manager) för att låsa Node 18 i utveckling:
#   nvm install 18; nvm use 18

# ------------------------------------------------------------------------
# MQTT LOKALT — SNABBTEST (OM USE_AZURE=false)
# ------------------------------------------------------------------------
# Starta en lokal broker (exempel Mosquitto) och skicka testmeddelande:
# mosquitto_pub -h localhost -t "sensors/uno-r4-01" \
#   -m '{"deviceId":"uno-r4-01","ts":1738256400,"temperature":22.8,"humidity":41.5}'
#
# Kontrollera därefter REST:
# curl "http://localhost:3000/api/telemetry?limit=1"

# ------------------------------------------------------------------------
# FELSÖKNING (CHECKLISTA)
# ------------------------------------------------------------------------
# ⛔ Server startar inte / port upptagen:
#   - Ändra PORT i .env (t.ex. 3001)
#
# ⛔ 401/403/ReceiverDisconnected (Azure):
#   - Fel policy/nyckel i AZURE_EVENTHUB_CONNECTION_STRING
#   - Säkerställ att strängen är "Event Hub-compatible" (inte IoT Hub-owner)
#
# ⛔ "No such event hub":
#   - AZURE_EVENTHUB_NAME måste vara *Event Hub-compatible name* (ofta iothub-...-events)
#
# ⛔ Inget data syns i API:t:
#   - Verifiera at telemetri faktiskt flödar (Azure CLI: monitor-events)
#   - Kolla consumer group (en och samma group kan "låsa" läsning i annan process)
#   - Tidsstämplar i fel format → kontrollera parsern
#
# ⛔ CORS-problem i frontend:
#   - Sätt CORS_ORIGIN=* (för dev) eller din domän i produktion
#
# ⛔ Prestanda / ryckig konsumtion:
#   - Event Hubs har partitioner → se till att din konsument loopar över alla
#   - Batcha skrivningar och undvik synk/blockerande logik i hot path

# ------------------------------------------------------------------------
# SÄKERHET & HYGien
# ------------------------------------------------------------------------
# Lägg aldrig hemligheter i Git. Lägg i .env (och ignorera den i .gitignore).
# Rekommenderad .gitignore-rad:
#   W_WebServer/.env
#   .env
#
# Rot-.gitignore kan även ignorera t.ex.:
#   W_WebServer/node_modules/
#   *.pem *.key *.pfx
#   *.log

# ------------------------------------------------------------------------
# ENKEL PRODUKTIONSKÖRNING (PM2 eller DOCKER — VALFRITT)
# ------------------------------------------------------------------------
# PM2 (process manager):
#   npm i -g pm2
#   pm2 start npm --name w_webserver -- start
#   pm2 save
#
# Docker (skiss — beroende på din Dockerfile):
#   docker build -t w_webserver:latest .
#   docker run -d --name w_webserver -p 3000:3000 --env-file .env w_webserver:latest

# ------------------------------------------------------------------------
# FRÅGOR & VIDARE UTVECKLING
# ------------------------------------------------------------------------
# - Behöver du fler endpoints? Lägg dem i src/routes och dokumentera dem här.
# - Behöver du historiklagring? Koppla på en databas (t.ex. PostgreSQL, InfluxDB)
#   och låt konsumenten persist: a telemetri innan REST svarar klienterna.
# - Vill du ha push/real-time? Lägg till WebSocket/SSE ovanpå REST.

# ------------------------------------------------------------------------
# LICENS
# ------------------------------------------------------------------------
# MIT (om inget annat anges)
# ========================================================================
