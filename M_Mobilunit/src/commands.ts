import type mqtt from 'mqtt';
import { makeTopics } from './mqttClient.js';
import type { CommandPayload } from './types.js';

export function handleCommand(
  team: string,
  deviceId: string,
  client: mqtt.MqttClient,
  topic: string,
  payload: CommandPayload
) {
  const t = makeTopics(team, deviceId);
  const ts = Math.floor(Date.now() / 1000);

  switch (payload.cmd) {
    case 'ping':
      client.publish(t.telem, JSON.stringify({ deviceId, ts, data: { pong: true } }), { qos: 1 });
      break;
    case 'echo':
      client.publish(t.telem, JSON.stringify({ deviceId, ts, data: { echo: payload.message } }), { qos: 1 });
      break;
    case 'telemetry':
      client.publish(t.telem, JSON.stringify({ deviceId, ts, data: payload.data ?? {} }), { qos: 1 });
      break;
    default:
      console.log('[CMD] unknown', payload);
  }
}
