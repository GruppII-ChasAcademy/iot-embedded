import 'dotenv/config';
import aedes from 'aedes';
import net from 'net';

const port = Number(process.env.MQTT_PORT ?? process.argv[2] ?? 1883);
const broker = aedes();

const server = net.createServer(broker.handle);
server.listen(port, () => {
  console.log([BROKER] listening on );
});

broker.on('client', (c) => console.log('[BROKER] client connected', c?.id));
broker.on('clientDisconnect', (c) => console.log('[BROKER] client disconnected', c?.id));
broker.on('publish', (packet, c) => {
  const t = packet?.topic || '';
  if (t.endsWith('/status') || t.includes('/telemetry/')) {
    console.log('[PUB]', c?.id, t);
  }
});
