import { MqttClient } from 'mqtt';

export function handleCommand(topic: string, payload: any, client: MqttClient) {
  const parts = topic.split('/');
  const cmd = parts[parts.length - 1];

  if (cmd === 'ping') {
    console.log('[CMD] ping -> pong');
    return;
  }

  if (cmd === 'vibrate') {
    console.log('[CMD] vibrate (simulated)');
    return;
  }

  console.log('[CMD] unknown:', cmd, payload);
}
