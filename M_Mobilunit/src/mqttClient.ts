import mqtt, { IClientOptions, MqttClient } from 'mqtt';

export function createClient(url: string, options: IClientOptions): Promise<MqttClient> {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(url, options);

    client.on('connect', () => resolve(client));
    client.on('error', (err) => reject(err));
  });
}
