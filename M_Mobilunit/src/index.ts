import 'dotenv/config';
import { createClient, publishHeartbeat } from './mqttClient.js';
import { handleCommand } from './commands.js';

const HEARTBEAT_INTERVAL = Number(process.env.HEARTBEAT_INTERVAL ?? 10000);
const { client, topics, team, deviceId } = createClient();

client.on('connect', () => {
  console.log('[MQTT] connected');
  publishHeartbeat(client, topics.status, deviceId);
  client.subscribe([topics.cmd], { qos: 1 }, (err) => {
    if (err) console.error('[MQTT] subscribe error', err);
  });
});

client.on('reconnect', () => console.log('[MQTT] reconnect'));
client.on('error', (e) => console.error('[MQTT] error', e));

client.on('message', (topic, buf) => {
  if (topic !== topics.cmd) return; // bara kommandon
  try {
    const payload = JSON.parse(buf.toString('utf-8'));
    handleCommand(team, deviceId, client as any, topic, payload);
  } catch {
    console.log('[CMD RAW]', topic, buf.toString('utf-8'));
  }
});

setInterval(() => publishHeartbeat(client, topics.status, deviceId), HEARTBEAT_INTERVAL);
