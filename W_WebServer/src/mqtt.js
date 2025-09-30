import mqtt from "mqtt";
import dotenv from "dotenv"; dotenv.config();
import { pushRecent } from "./store/recent.js";

const url   = process.env.MQTT_URL   || "mqtt://192.168.4.1:1883";
const topic = process.env.MQTT_TOPIC || "lab/sensors/bananer/dht22";

const client = mqtt.connect(url);
client.on("connect", () => {
  client.subscribe(topic, err => {
    if (!err) console.log(`[MQTT] ${url} -> ${topic}`);
    else console.error("[MQTT subscribe]", err.message);
  });
});

client.on("message", (_t, buf) => {
  const s = buf.toString();
  try {
    const o = JSON.parse(s);
    pushRecent({ deviceId:o.deviceId||"uno-r4-01", payload:o, time:new Date().toISOString() });
  } catch {
    pushRecent({ deviceId:"unknown", payload:{raw:s}, time:new Date().toISOString() });
  }
});
