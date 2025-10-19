import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from './mqttClient.js';
import { handleCommand } from './commands.js';
import type { Telemetry, ApiEnvelope } from './types.js';

const host = process.env.MQTT_HOST || 'localhost';
const port = Number(process.env.MQTT_PORT || '1883');
const user = process.env.MQTT_USERNAME || undefined;
const pass = process.env.MQTT_PASSWORD || undefined;
const tls = String(process.env.MQTT_TLS || 'false') === 'true';
const team = process.env.TEAM || 'GruppII';
const deviceId = process.env.DEVICE_ID || 'MOBILE-SIM-001';
const hbInterval = Number(process.env.HEARTBEAT_INTERVAL || '10');
const rpcTimeout = Number(process.env.RPC_TIMEOUT || '8');

const url = `${tls ? 'mqtts' : 'mqtt'}://${host}:${port}`;

async function main() {
  const lwtTopic = `${team}/mobile/status/${deviceId}`;
  const options = {
    username: user,
    password: pass,
    will: {
      topic: lwtTopic,
      payload: JSON.stringify({ deviceId, status: 'offline', ts: Math.floor(Date.now()/1000) }),
      retain: true,
      qos: 1
    }
  };

  const client = await createClient(url, options);
  console.log('[MQTT] connected', url);

  // Set online status
  client.publish(lwtTopic, JSON.stringify({ deviceId, status: 'online', ts: Math.floor(Date.now()/1000) }), { retain: true, qos: 1 });

  // Subscribe to command topics
  const cmdTopic = `${team}/mobile/cmd/#`;
  client.subscribe(cmdTopic);
  client.on('message', (topic, buf) => {
    try {
      const payload = JSON.parse(buf.toString('utf-8'));
      handleCommand(topic, payload, client as any);
    } catch {
      console.log('[MSG]', topic, buf.toString('utf-8'));
    }
  });

  // Heartbeat loop
  const telemetryTopic = `${team}/mobile/telemetry`;
  setInterval(() => {
    const t: Telemetry = {
      type: 'heartbeat',
      deviceId,
      ts: Math.floor(Date.now()/1000),
      battery: Number((0.6 + Math.random()*0.4).toFixed(2)),
      gps: { lat: 59.3293 + (Math.random()-0.5)*0.001, lon: 18.0686 + (Math.random()-0.5)*0.001 }
    };
    client.publish(telemetryTopic, JSON.stringify(t), { qos: 1 });
    console.log('[PUB] heartbeat ->', telemetryTopic);
  }, hbInterval * 1000);

  // Demo: RPC call to backend API via MQTT
  await rpcCall(client, { method: 'GET', path: '/health' })
    .then(res => console.log('[RPC] /health response:', res))
    .catch(err => console.warn('[RPC] timeout or error:', (err as Error).message));
}

async function rpcCall(client: any, request: { method: 'GET'|'POST'; path: string; body?: any }): Promise<any> {
  const corrId = uuidv4();
  const replyTo = `${team}/backend/api/res/${corrId}`;
  const reqTopic = `${team}/backend/api/req`;

  const envelope: ApiEnvelope = { corrId, replyTo, request };

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.unsubscribe(replyTo);
      reject(new Error('RPC timeout'));
    }, rpcTimeout * 1000);

    client.subscribe(replyTo, { qos: 1 }, (err: any) => {
      if (err) { clearTimeout(timer); reject(err); return; }
      client.publish(reqTopic, JSON.stringify(envelope), { qos: 1 });
    });

    const handler = (topic: string, buf: Buffer) => {
      if (topic !== replyTo) return;
      clearTimeout(timer);
      client.removeListener('message', handler);
      try {
        const payload = JSON.parse(buf.toString('utf-8'));
        resolve(payload);
      } catch (e: any) {
        reject(e);
      } finally {
        client.unsubscribe(replyTo);
      }
    };
    client.on('message', handler);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
