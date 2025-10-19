# M_Mobilunit

Minimal mobil enhet (simulerad i Node.js/TypeScript) som kommunicerar via MQTT med backend.
Syfte: ersätta/komplettera tidigare HTTP-endpoint med MQTT och **bekräfta kommunikation med backend**.

## Funktioner
- MQTT-anslutning med LWT (Last Will & Testament).
- Heartbeat var 10:e sekund på `{TEAM}/mobile/telemetry`.
- GPS/mock-position skickas (kan ersättas med riktig data från mobil/Termux).
- Request/Response över MQTT för att anropa backend-endpoints via RPC-mönster:
  - Request publiceras på `{TEAM}/backend/api/req` med `corrId`.
  - Svar förväntas på `{TEAM}/backend/api/res/{corrId}` (times out om inget svar).
- Kommandon från backend lyssnas på `{TEAM}/mobile/cmd/#`.

## Topics (förslag)
- Telemetry publish: `{TEAM}/mobile/telemetry`
- Command subscribe: `{TEAM}/mobile/cmd/#`
- API RPC request publish: `{TEAM}/backend/api/req`
- API RPC response subscribe (dynamic): `{TEAM}/backend/api/res/{corrId}`

## Payload-exempel
```json
{"type":"heartbeat","deviceId":"MOBILE-EXAMPLE","ts": 1730000000, "battery": 0.88, "gps": {"lat": 59.3293, "lon": 18.0686}}
```

## Komma igång

1) Skapa `.env` (eller exportera variabler) baserat på `.env.example`.
2) Installera beroenden:
```bash
npm i
npm run build
npm start
```
Alternativ (utv): `npm run dev` (ts-node).

### Test utan backend (MQTTX/Mosquitto)
- Lyssna på telemetry:
```bash
mosquitto_sub -h $MQTT_HOST -p $MQTT_PORT -t "$TEAM/mobile/telemetry" -v
```
- Skicka ett kommando:
```bash
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "$TEAM/mobile/cmd/ping" -m '{"msg":"ping"}'
```

### Exempel: RPC-kall mot backend genom MQTT
Backend (bridge/mikrotjänst) bör:
1) Lyssna på `{TEAM}/backend/api/req`
2) Läsa `corrId` och `replyTo`
3) Publicera svar till `replyTo`

Klienten här skickar en provrequest `GET /health` som JSON: `{"method":"GET","path":"/health"}`.

## Struktur
- `src/mqttClient.ts` – MQTT-klient och hjälpfunktioner.
- `src/index.ts` – uppstart, heartbeat, RPC-exempel.
- `src/commands.ts` – hantering av inkommande kommandon.
- `src/types.ts` – gemensamma typer.
- `.env.example` – konfig.
- `package.json`, `tsconfig.json`.

## Definition of Done (för PR)
- [ ] Kan ansluta till broker med LWT och skicka heartbeat.
- [ ] Kan ta emot kommandot `ping` och svara i logg.
- [ ] Kan initiera ett RPC-kall och logga svar eller timeout.
- [ ] README beskriver topics och körning.
- [ ] `.env.example` inkluderad.

## PR-instruktion (snabb)
```bash
git checkout -b feat/mobileunit-mqtt
# Lägg in mappen M_Mobilunit i repo-roten
git add M_Mobilunit
git commit -m "M_Mobilunit: MQTT mobile client (heartbeat + RPC over MQTT)"
git push -u origin feat/mobileunit-mqtt
# Skapa Pull Request mot main med titel:
# "M_Mobilunit: Bekräfta MQTT-kommunikation och stänga ihop endpointen via MQTT"
```
