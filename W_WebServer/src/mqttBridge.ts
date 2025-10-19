import mqtt, { IClientOptions, MqttClient } from "mqtt";

export function connectMqtt(url: string, options: IClientOptions = {}): Promise<MqttClient> {
  return new Promise((resolve, reject) => {
    const c = mqtt.connect(url, { reconnectPeriod: 2000, ...options });
    const ok = () => { c.off("error", bad); resolve(c); };
    const bad = (e: unknown) => { c.off("connect", ok); reject(e); };
    c.once("connect", ok);
    c.once("error", bad);
    c.on("reconnect", () => console.log("[MQTT] reconnecting..."));
  });
}

/** Lyssnar på {TEAM}/backend/api/req och svarar till 'replyTo'. */
export function wireRpcResponder(client: MqttClient, team: string) {
  const reqTopic = `${team}/backend/api/req`;
  client.subscribe(reqTopic, { qos: 1 }, err => err && console.warn("[MQTT] sub error:", err));

  client.on("message", (topic, buf) => {
    if (topic !== reqTopic) return;
    try {
      const env = JSON.parse(buf.toString("utf-8"));
      const replyTo = env?.replyTo;
      const method = env?.request?.method;
      const path = env?.request?.path;
      if (!replyTo) return;

      const payload = { ok: true, service: "webserver", method, path, ts: Math.floor(Date.now()/1000) };
      client.publish(replyTo, JSON.stringify(payload), { qos: 1 });
      console.log("[RPC] responded ->", replyTo, payload);
    } catch (e:any) {
      console.warn("[RPC] parse error:", e.message);
    }
  });
}
