import "dotenv/config";
import express from "express";
import { connectMqtt, wireRpcResponder } from "./mqttBridge.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || "8080");
const team = process.env.TEAM || "GruppII";

const host = process.env.MQTT_HOST || "127.0.0.1";
const port = Number(process.env.MQTT_PORT || "1883");
const tls  = String(process.env.MQTT_TLS || "false") === "true";
const url  = `${tls ? "mqtts" : "mqtt"}://${host}:${port}`;

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "webserver", team, mqtt: { host, port, tls } });
});

const server = app.listen(PORT, () => console.log(`[HTTP] listening on :${PORT}`));

connectMqtt(url).then(client => {
  console.log("[MQTT] connected", url);
  wireRpcResponder(client, team);
}).catch(err => {
  console.error("[MQTT] connect error:", err);
});

process.on("SIGINT", () => { server.close(() => process.exit(0)); });
